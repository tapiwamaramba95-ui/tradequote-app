'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import Papa from 'papaparse'
import Link from 'next/link'
import { Clipboard } from 'lucide-react'

interface PriceListItem {
  id: string
  name: string
  description: string
  cost: number
  unit: string
  category: string
  is_active: boolean
  created_at: string
}

type CSVRow = {
  'Supplier Name': string
  'Product Code': string
  'Product Name': string
  'Unit': string
  'Price': string
  'Category'?: string
  'Description'?: string
}

type ParsedData = {
  supplierName: string
  products: {
    code: string
    name: string
    unit: string
    price: number
    category?: string
    description?: string
  }[]
}

type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  auto_created: boolean
  details_completed: boolean
  product_count?: number
}

export default function PriceListSettings() {
  const searchParams = useSearchParams()
  
  // Tab state - check for ?section= query param
  const [activeTab, setActiveTab] = useState<'your-price-list' | 'supplier-price-lists'>('your-price-list')
  
  // Initialize tab from URL on mount
  useEffect(() => {
    const sectionParam = searchParams.get('section')
    if (sectionParam === 'supplier-price-lists') {
      setActiveTab('supplier-price-lists')
    }
  }, [searchParams])
  
  // Your Price List state
  const [items, setItems] = useState<PriceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null)
  const [defaultMarkup, setDefaultMarkup] = useState<number>(30)
  
  // Supplier Price Lists state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedData | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  
  // Supplier details form
  const [supplierABN, setSupplierABN] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [supplierWebsite, setSupplierWebsite] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    unit: 'each',
    category: '',
    is_active: true
  })

  useEffect(() => {
    if (activeTab === 'your-price-list') {
      fetchItems()
      fetchMarkupSettings()
    } else {
      loadSuppliers()
    }
  }, [activeTab])

  // Your Price List functions
  const fetchItems = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('price_list_items')
      .select('*')
      .eq('user_id', user.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const fetchMarkupSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('business_settings')
      .select('default_markup_percentage')
      .eq('user_id', user.id)
      .single()

    if (data?.default_markup_percentage) {
      setDefaultMarkup(data.default_markup_percentage)
    }
  }

  const handleMarkupUpdate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('business_settings')
      .update({ default_markup_percentage: defaultMarkup })
      .eq('user_id', user.id)

    if (!error) {
      alert('Markup percentage updated successfully')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const itemData = {
      name: formData.name,
      description: formData.description,
      cost: parseFloat(formData.cost),
      unit: formData.unit,
      category: formData.category,
      is_active: formData.is_active,
      updated_at: new Date().toISOString()
    }

    if (editingItem) {
      // Update existing item
      const { error } = await supabase
        .from('price_list_items')
        .update(itemData)
        .eq('id', editingItem.id)
        .eq('user_id', user.id)

      if (!error) {
        fetchItems()
        closeModal()
      }
    } else {
      // Create new item
      const { error } = await supabase
        .from('price_list_items')
        .insert({
          ...itemData,
          user_id: user.id
        })

      if (!error) {
        fetchItems()
        closeModal()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('price_list_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      fetchItems()
    }
  }

  const openModal = (item?: PriceListItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        cost: item.cost.toString(),
        unit: item.unit,
        category: item.category || '',
        is_active: item.is_active
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        cost: '',
        unit: 'each',
        category: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      cost: '',
      unit: 'each',
      category: '',
      is_active: true
    })
  }

  const calculateSellingPrice = (cost: number) => {
    return (cost * (1 + defaultMarkup / 100)).toFixed(2)
  }

  // Supplier Price Lists functions
  const loadSuppliers = async () => {
    setSuppliersLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) return

      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select(`
          *,
          supplier_products(count)
        `)
        .eq('business_id', businessId)
        .order('name')

      if (suppliersData) {
        const formatted = suppliersData.map(s => ({
          ...s,
          product_count: s.supplier_products?.[0]?.count || 0
        }))
        setSuppliers(formatted)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setSuppliersLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = (file: File) => {
    setUploadLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as CSVRow[]
          
          if (rows.length === 0) {
            alert('CSV file is empty')
            setUploadLoading(false)
            return
          }

          const supplierName = rows[0]['Supplier Name']?.trim()
          
          if (!supplierName) {
            alert('Missing "Supplier Name" column in CSV')
            setUploadLoading(false)
            return
          }

          const products = rows.map(row => ({
            code: row['Product Code']?.trim() || '',
            name: row['Product Name']?.trim() || '',
            unit: row['Unit']?.trim() || 'each',
            price: parseFloat(row['Price']) || 0,
            category: row['Category']?.trim(),
            description: row['Description']?.trim(),
          })).filter(p => p.name)

          setPreviewData({ supplierName, products })
          setUploadLoading(false)
        } catch (error) {
          console.error('Error parsing CSV:', error)
          alert('Error parsing CSV file. Please check the format.')
          setUploadLoading(false)
        }
      },
      error: (error) => {
        console.error('Parse error:', error)
        alert('Failed to parse CSV file')
        setUploadLoading(false)
      }
    })
  }

  const handleImport = async () => {
    if (!previewData) return

    setUploadLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) {
        alert('No business found. Please complete onboarding first.')
        setUploadLoading(false)
        return
      }

      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id, details_completed')
        .eq('business_id', businessId)
        .eq('name', previewData.supplierName)
        .single()

      let supplierId: string

      if (existingSupplier) {
        supplierId = existingSupplier.id
        
        if (!confirm(`Supplier "${previewData.supplierName}" already exists. Do you want to update their products?`)) {
          setUploadLoading(false)
          return
        }
      } else {
        setShowSupplierModal(true)
        setUploadLoading(false)
        return
      }

      await importProducts(supplierId, businessId)

    } catch (error) {
      console.error('Error importing:', error)
      alert('Failed to import price list')
      setUploadLoading(false)
    }
  }

  const handleCreateSupplierAndImport = async (skipDetails: boolean) => {
    if (!previewData) return

    setUploadLoading(true)
    setShowSupplierModal(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) {
        alert('No business found. Please complete onboarding first.')
        setUploadLoading(false)
        return
      }

      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_id: businessId,
          name: previewData.supplierName,
          abn: skipDetails ? null : supplierABN || null,
          email: skipDetails ? null : supplierEmail || null,
          phone: skipDetails ? null : supplierPhone || null,
          address: skipDetails ? null : supplierAddress || null,
          website: skipDetails ? null : supplierWebsite || null,
          auto_created: true,
          details_completed: !skipDetails && (supplierEmail || supplierPhone) ? true : false,
        })
        .select()
        .single()

      if (supplierError) throw supplierError

      await importProducts(supplier.id, businessId)

    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier')
      setUploadLoading(false)
    }
  }

  const importProducts = async (supplierId: string, businessId: string) => {
    if (!previewData) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const productsToInsert = previewData.products.map(p => ({
        supplier_id: supplierId,
        user_id: user.id,
        business_id: businessId,
        product_code: p.code || null,
        product_name: p.name,
        description: p.description || null,
        unit: p.unit,
        price: p.price,
        category: p.category || null,
        is_active: true,
        last_updated: new Date().toISOString(),
      }))

      await supabase
        .from('supplier_products')
        .delete()
        .eq('supplier_id', supplierId)

      const { error: productsError } = await supabase
        .from('supplier_products')
        .insert(productsToInsert)

      if (productsError) throw productsError

      alert(`✅ Successfully imported ${previewData.products.length} products for ${previewData.supplierName}`)
      
      // Reset upload state
      setFile(null)
      setPreviewData(null)
      setSupplierABN('')
      setSupplierEmail('')
      setSupplierPhone('')
      setSupplierAddress('')
      setSupplierWebsite('')
      
      // Reload suppliers list
      loadSuppliers()

    } catch (error) {
      console.error('Error importing products:', error)
      alert('Failed to import products')
      setUploadLoading(false)
    }
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, PriceListItem[]>)

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Clipboard size={24} style={{ color: colors.accent.DEFAULT }} />
              <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>
                Price Lists
              </h1>
            </div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Manage your price lists and supplier catalogs
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b" style={{ borderColor: colors.border.DEFAULT }}>
          <button
            onClick={() => setActiveTab('your-price-list')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'your-price-list' ? 'border-b-2' : ''
            }`}
            style={{
              borderColor: activeTab === 'your-price-list' ? colors.accent.DEFAULT : 'transparent',
              color: activeTab === 'your-price-list' ? colors.accent.DEFAULT : colors.text.secondary
            }}
          >
            📋 Your Price List
          </button>
          <button
            onClick={() => setActiveTab('supplier-price-lists')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'supplier-price-lists' ? 'border-b-2' : ''
            }`}
            style={{
              borderColor: activeTab === 'supplier-price-lists' ? colors.accent.DEFAULT : 'transparent',
              color: activeTab === 'supplier-price-lists' ? colors.accent.DEFAULT : colors.text.secondary
            }}
          >
            📦 Supplier Price Lists
          </button>
        </div>
      </div>

      {/* Your Price List Tab */}
      {activeTab === 'your-price-list' && (
        <>
          <div className="mb-6 flex items-center justify-end">
            <button
              onClick={() => openModal()}
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: colors.accent.DEFAULT,
                color: colors.text.inverse
              }}
            >
              + New Item
            </button>
          </div>

      {/* Markup Settings Card */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          Default Markup Percentage
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={defaultMarkup}
                onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="1000"
                className="w-24 px-3 py-2 rounded border text-right"
                style={{
                  backgroundColor: colors.background.main,
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary
                }}
              />
              <span style={{ color: colors.text.primary }}>%</span>
              <button
                onClick={handleMarkupUpdate}
                className="px-4 py-2 rounded font-medium"
                style={{
                  backgroundColor: colors.accent.DEFAULT,
                  color: colors.text.inverse
                }}
              >
                Update
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: colors.text.secondary }}>
              Example: $100 cost @ {defaultMarkup}% = ${calculateSellingPrice(100)} selling price
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: colors.text.secondary }}>Loading price list...</div>
      ) : items.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          <p style={{ color: colors.text.secondary }}>
            No price list items yet. Add your first item to speed up document creation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>
                {category}
              </h3>
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.DEFAULT
                }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border.DEFAULT}` }}>
                      <th className="px-4 py-5 text-left text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Item Name
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Description
                      </th>
                      <th className="px-4 py-5 text-right text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Cost
                      </th>
                      <th className="px-4 py-5 text-right text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Selling Price
                      </th>
                      <th className="px-4 py-5 text-center text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Unit
                      </th>
                      <th className="px-4 py-5 text-center text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Status
                      </th>
                      <th className="px-4 py-5 text-right text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: `1px solid ${colors.border.DEFAULT}`,
                          opacity: item.is_active ? 1 : 0.5
                        }}
                      >
                        <td className="px-4 py-5 font-medium" style={{ color: colors.text.primary }}>
                          {item.name}
                        </td>
                        <td className="px-4 py-5 text-sm" style={{ color: colors.text.secondary }}>
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-5 text-right" style={{ color: colors.text.primary }}>
                          ${item.cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-5 text-right font-medium" style={{ color: colors.accent.DEFAULT }}>
                          ${calculateSellingPrice(item.cost)}
                        </td>
                        <td className="px-4 py-5 text-center text-sm" style={{ color: colors.text.secondary }}>
                          {item.unit}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: item.is_active ? `${colors.semantic.success}20` : `${colors.text.secondary}20`,
                              color: item.is_active ? colors.semantic.success : colors.text.secondary
                            }}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openModal(item)}
                              className="px-3 py-1 text-sm rounded"
                              style={{
                                backgroundColor: `${colors.accent.DEFAULT}20`,
                                color: colors.accent.DEFAULT
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1 text-sm rounded"
                              style={{
                                backgroundColor: `${colors.semantic.error}20`,
                                color: colors.semantic.error
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Supplier Price Lists Tab */}
      {activeTab === 'supplier-price-lists' && (
        <div className="space-y-6">
          {/* Upload Section */}
          {!previewData ? (
            <>
              {/* Suppliers List */}
              {suppliers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                    Your Suppliers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="bg-white rounded-lg p-4 shadow-sm border"
                        style={{ borderColor: colors.border.DEFAULT }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {supplier.details_completed ? (
                            <span className="text-green-500 text-lg">✅</span>
                          ) : (
                            <span className="text-yellow-500 text-lg">⚠️</span>
                          )}
                          <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                            {supplier.name}
                          </h4>
                        </div>
                        <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                          {supplier.product_count} products
                        </p>
                        <Link
                          href={`/dashboard/suppliers/${supplier.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: colors.accent.DEFAULT }}
                        >
                          View Details →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="bg-white rounded-lg p-8 shadow-sm border" style={{ borderColor: colors.border.DEFAULT }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                  Import Supplier Price List
                </h3>
                
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <div 
                    className="border-4 border-dashed rounded-xl p-8 transition-colors hover:border-teal-500 hover:bg-teal-50 text-center"
                    style={{ borderColor: colors.border.DEFAULT }}
                  >
                    <div className="text-4xl mb-3">📄</div>
                    <p 
                      className="text-lg font-semibold mb-1"
                      style={{ color: colors.text.primary }}
                    >
                      {file ? file.name : 'Drop CSV file here or click to browse'}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="mt-6 flex items-center justify-between">
                  <a
                    href="/templates/supplier-price-list-template.csv"
                    download
                    className="text-sm font-medium hover:underline"
                    style={{ color: colors.accent.DEFAULT }}
                  >
                    📋 Download CSV Template
                  </a>
                  
                  <Link
                    href="/dashboard/suppliers"
                    className="text-sm font-medium hover:underline"
                    style={{ color: colors.text.secondary }}
                  >
                    View All Suppliers →
                  </Link>
                </div>

                {/* Instructions */}
                <div 
                  className="mt-6 p-4 rounded-lg"
                  style={{ backgroundColor: colors.background.hover }}
                >
                  <h4 
                    className="font-semibold text-sm mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    ℹ️ CSV file format:
                  </h4>
                  <ul 
                    className="space-y-1 text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    <li>• <strong>Supplier Name</strong> - Name of the supplier (same for all rows)</li>
                    <li>• <strong>Product Code</strong> - Supplier's SKU or product code</li>
                    <li>• <strong>Product Name</strong> - Description of the product</li>
                    <li>• <strong>Unit</strong> - Unit of measure (each, meter, kg, box, etc.)</li>
                    <li>• <strong>Price</strong> - Unit price in dollars</li>
                    <li>• <strong>Category</strong> - Optional category (Plumbing, Electrical, etc.)</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border" style={{ borderColor: colors.border.DEFAULT }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
                  ✅ Ready to Import
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: colors.text.secondary }}>
                      Supplier
                    </p>
                    <p className="text-xl font-bold" style={{ color: colors.text.primary }}>
                      {previewData.supplierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: colors.text.secondary }}>
                      Products
                    </p>
                    <p className="text-xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                      {previewData.products.length} items
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg overflow-hidden shadow-sm border" style={{ borderColor: colors.border.DEFAULT }}>
                <div 
                  className="px-6 py-4 border-b"
                  style={{ 
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.DEFAULT 
                  }}
                >
                  <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                    Preview (first 10 products)
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr 
                        className="border-b"
                        style={{ 
                          backgroundColor: colors.background.hover,
                          borderColor: colors.border.DEFAULT 
                        }}
                      >
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Unit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Price</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.products.slice(0, 10).map((product, idx) => (
                        <tr 
                          key={idx}
                          className="border-b hover:bg-gray-50"
                          style={{ borderColor: colors.border.DEFAULT }}
                        >
                          <td className="px-4 py-3 text-sm font-mono">{product.code || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-center">{product.unit}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{product.category || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.products.length > 10 && (
                  <div 
                    className="px-6 py-3 text-sm text-center"
                    style={{ color: colors.text.secondary }}
                  >
                    + {previewData.products.length - 10} more products...
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setFile(null)
                    setPreviewData(null)
                  }}
                  className="px-6 py-2 rounded-lg font-medium border"
                  style={{ 
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary 
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={uploadLoading}
                  className="px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                >
                  {uploadLoading ? 'Importing...' : `Import ${previewData.products.length} Products`}
                </button>
              </div>
            </div>
          )}

          {suppliersLoading && (
            <div className="text-center py-8">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                style={{ borderColor: colors.accent.DEFAULT }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Supplier Details Modal */}
      {showSupplierModal && previewData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSupplierModal(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: colors.text.primary }}
            >
              🆕 New Supplier Detected
            </h2>
            <p 
              className="mb-6"
              style={{ color: colors.text.secondary }}
            >
              <strong>{previewData.supplierName}</strong> doesn't exist yet. 
              Add their contact details now or skip and add later.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  ABN <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={supplierABN}
                  onChange={(e) => setSupplierABN(e.target.value)}
                  placeholder="12 345 678 901"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="sales@supplier.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Phone <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="1300 123 456"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Address <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="123 Trade St, Melbourne VIC 3000"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Website <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="url"
                  value={supplierWebsite}
                  onChange={(e) => setSupplierWebsite(e.target.value)}
                  placeholder="www.supplier.com.au"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCreateSupplierAndImport(true)}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium border disabled:opacity-50"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary 
                }}
              >
                Skip - Add Later
              </button>
              <button
                onClick={() => handleCreateSupplierAndImport(false)}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                {uploadLoading ? 'Importing...' : 'Save & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your Price List Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full p-6"
            style={{ backgroundColor: colors.background.card }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
              {editingItem ? 'Edit Item' : 'New Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: colors.background.main,
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.primary
                    }}
                    placeholder="e.g., 2x4 Timber"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: colors.background.main,
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.primary
                    }}
                    placeholder="e.g., Materials, Equipment"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Cost Price *
                  </label>
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.text.primary }}>$</span>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 rounded border"
                      style={{
                        backgroundColor: colors.background.main,
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.primary
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  {formData.cost && (
                    <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                      Selling price: ${calculateSellingPrice(parseFloat(formData.cost))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: colors.background.main,
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.primary
                    }}
                    placeholder="e.g., each, meter, kg, box"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm" style={{ color: colors.text.primary }}>
                  Active (visible when adding items to documents)
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: colors.text.inverse
                  }}
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
