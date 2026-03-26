'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Papa from 'papaparse'
import { getBusinessId } from '@/lib/business'

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

export default function UploadPriceListPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedData | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  
  // Supplier details form
  const [supplierABN, setSupplierABN] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [supplierWebsite, setSupplierWebsite] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = (file: File) => {
    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as CSVRow[]
          
          if (rows.length === 0) {
            alert('CSV file is empty')
            setLoading(false)
            return
          }

          // Extract supplier name from first row
          const supplierName = rows[0]['Supplier Name']?.trim()
          
          if (!supplierName) {
            alert('Missing "Supplier Name" column in CSV')
            setLoading(false)
            return
          }

          // Parse products
          const products = rows.map(row => ({
            code: row['Product Code']?.trim() || '',
            name: row['Product Name']?.trim() || '',
            unit: row['Unit']?.trim() || 'each',
            price: parseFloat(row['Price']) || 0,
            category: row['Category']?.trim(),
            description: row['Description']?.trim(),
          })).filter(p => p.name) // Remove empty rows

          setPreviewData({ supplierName, products })
          setLoading(false)
        } catch (error) {
          console.error('Error parsing CSV:', error)
          alert('Error parsing CSV file. Please check the format.')
          setLoading(false)
        }
      },
      error: (error) => {
        console.error('Parse error:', error)
        alert('Failed to parse CSV file')
        setLoading(false)
      }
    })
  }

  const handleImport = async () => {
    if (!previewData) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) {
        alert('No business found. Please complete onboarding first.')
        setLoading(false)
        return
      }

      // Check if supplier exists
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id, details_completed')
        .eq('business_id', businessId)
        .eq('name', previewData.supplierName)
        .single()

      let supplierId: string

      if (existingSupplier) {
        // Supplier exists
        supplierId = existingSupplier.id
        
        // Ask user if they want to update products
        if (!confirm(`Supplier "${previewData.supplierName}" already exists. Do you want to update their products?`)) {
          setLoading(false)
          return
        }
      } else {
        // New supplier - show modal to collect details
        setShowSupplierModal(true)
        setLoading(false)
        return // Wait for modal submission
      }

      // Import products
      await importProducts(supplierId)

    } catch (error) {
      console.error('Error importing:', error)
      alert('Failed to import price list')
      setLoading(false)
    }
  }

  const handleCreateSupplierAndImport = async (skipDetails: boolean) => {
    if (!previewData) return

    setLoading(true)
    setShowSupplierModal(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) {
        alert('No business found. Please complete onboarding first.')
        setLoading(false)
        return
      }

      // Create supplier
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_id: businessId,
          name: previewData.supplierName,
          abn: skipDetails ? null : supplierABN || null,
          email: skipDetails ? null : supplierEmail || null,
          phone: skipDetails ? null : supplierPhone || null,
          street_address: skipDetails ? null : supplierAddress || null,
          website: skipDetails ? null : supplierWebsite || null,
        })
        .select()
        .single()

      if (supplierError) throw supplierError

      // Import products
      await importProducts(supplier.id)

    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier')
      setLoading(false)
    }
  }

      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) return

      // Prepare products for insert
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

      // Delete old products (if updating)
      await supabase
        .from('supplier_products')
        .delete()
        .eq('supplier_id', supplierId)

      // Insert new products
      const { error: productsError } = await supabase
        .from('supplier_products')
        .insert(productsToInsert)

      if (productsError) throw productsError

      // Success!
      alert(`✅ Successfully imported ${previewData.products.length} products for ${previewData.supplierName}`)
      router.push('/dashboard/suppliers')

    } catch (error) {
      console.error('Error importing products:', error)
      alert('Failed to import products')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 
        className="text-3xl font-bold mb-8"
        style={{ color: colors.text.primary }}
      >
        Import Supplier Price List
      </h1>

      {/* Upload Section */}
      {!previewData && (
        <div className="bg-white rounded-2xl p-12 shadow-sm">
          <div className="text-center">
            {/* File Upload */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <div 
                className="border-4 border-dashed rounded-2xl p-12 transition-colors hover:border-blue-500 hover:bg-blue-50"
                style={{ borderColor: colors.border.DEFAULT }}
              >
                <div className="text-6xl mb-4">📄</div>
                <p 
                  className="text-xl font-semibold mb-2"
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

            {/* Download Template */}
            <div className="mt-8">
              <p 
                className="text-sm mb-3"
                style={{ color: colors.text.secondary }}
              >
                Don't have a price list yet?
              </p>
              <a
                href="/templates/supplier-price-list-template.csv"
                download
                className="inline-block px-6 py-2 rounded-lg font-semibold text-sm border-2 transition-colors"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary 
                }}
              >
                📋 Download CSV Template
              </a>
            </div>

            {/* Instructions */}
            <div 
              className="mt-8 p-6 rounded-xl text-left"
              style={{ backgroundColor: colors.background.card }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: colors.text.primary }}
              >
                ℹ️ Your CSV file should include:
              </h3>
              <ul 
                className="space-y-2 text-sm"
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
        </div>
      )}

      {/* Preview Section */}
      {previewData && !showSupplierModal && (
        <div className="space-y-6">
          {/* Preview Header */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: colors.text.primary }}
            >
              ✅ Ready to Import
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p 
                  className="text-sm font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Supplier
                </p>
                <p 
                  className="text-xl font-bold"
                  style={{ color: colors.text.primary }}
                >
                  {previewData.supplierName}
                </p>
              </div>
              <div>
                <p 
                  className="text-sm font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Products
                </p>
                <p 
                  className="text-xl font-bold"
                  style={{ color: colors.accent.DEFAULT }}
                >
                  {previewData.products.length} items
                </p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div 
              className="px-8 py-4 border-b"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border.DEFAULT 
              }}
            >
              <h3 
                className="font-semibold"
                style={{ color: colors.text.primary }}
              >
                Preview (first 10 products)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr 
                    className="border-b"
                    style={{ 
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.DEFAULT 
                    }}
                  >
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.products.slice(0, 10).map((product, idx) => (
                    <tr 
                      key={idx}
                      className="border-b hover:bg-gray-50"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <td className="px-6 py-4 text-sm font-mono">{product.code || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-center">{product.unit}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">{product.category || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.products.length > 10 && (
              <div 
                className="px-8 py-4 text-sm text-center"
                style={{ color: colors.text.secondary }}
              >
                + {previewData.products.length - 10} more products...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setFile(null)
                setPreviewData(null)
              }}
              className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
              style={{ 
                borderColor: colors.border.DEFAULT,
                color: colors.text.primary 
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              {loading ? 'Importing...' : `Import ${previewData.products.length} Products`}
            </button>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {showSupplierModal && previewData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSupplierModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 
              className="text-2xl font-bold mb-2"
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

            {/* Form */}
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
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm"
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
                  onChange={(e) => {
                    const normalized = normalizeEmail(e.target.value)
                    setSupplierEmail(normalized)
                  }}
                  onBlur={(e) => {
                    const suggestion = suggestEmailCorrection(e.target.value)
                    if (suggestion && suggestion !== e.target.value) {
                      if (confirm(`Did you mean ${suggestion}?`)) {
                        setSupplierEmail(suggestion)
                      }
                    }
                  }}
                  placeholder="sales@supplier.com"
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm"
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
                  onBlur={(e) => {
                    const formatted = formatAustralianPhone(e.target.value)
                    setSupplierPhone(formatted)
                  }}
                  placeholder="1300 123 456"
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm"
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
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm"
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
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateSupplierAndImport(true)}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-colors disabled:opacity-50"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary 
                }}
              >
                Skip - Add Later
              </button>
              <button
                onClick={() => handleCreateSupplierAndImport(false)}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                {loading ? 'Importing...' : 'Save & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}