'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import Link from 'next/link'
import { Edit2, X } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

type Supplier = {
  id: string
  name: string
  abn: string | null
  email: string | null
  phone: string | null
  street_address: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  details_completed: boolean
}

type Product = {
  id: string
  product_code: string | null
  product_name: string
  unit: string
  price: number
  category: string | null
  is_active: boolean
}

// Helper function to get supplier initials
function getSupplierInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Calculate category count
  const categoryCount = new Set(
    products.map(p => p.category).filter(Boolean)
  ).size

  useEffect(() => {
    loadSupplierData()
  }, [id])

  const loadSupplierData = async () => {
    try {
      // Get business_id for filtering
      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found')
        setLoading(false)
        return
      }

      // Load supplier with business_id verification
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .eq('business_id', businessId)
        .single()

      if (supplierData) setSupplier(supplierData)

      // Load products with business_id verification
      const { data: productsData } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', id)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('product_name')

      if (productsData) setProducts(productsData)
    } catch (error) {
      console.error('Error loading supplier:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({
          product_code: editingProduct.product_code || null,
          product_name: editingProduct.product_name,
          unit: editingProduct.unit,
          price: editingProduct.price,
          category: editingProduct.category || null,
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      // Update local state
      setProducts(products.map(p => 
        p.id === editingProduct.id ? editingProduct : p
      ))

      setShowEditModal(false)
      setEditingProduct(null)
      alert('✅ Product updated successfully')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: colors.accent.DEFAULT }}
        ></div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p style={{ color: colors.text.secondary }}>Supplier not found</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Suppliers', href: '/dashboard/suppliers' },
        { label: supplier.name }
      ]} />
      
      {/* Header with Avatar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Supplier Avatar/Initials */}
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-xl"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            {getSupplierInitials(supplier.name)}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
              {supplier.name}
            </h1>
            <p style={{ color: colors.text.secondary }}>
              {products.length} products • {categoryCount} categories
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link
            href={`/dashboard/suppliers/${supplier.id}/edit`}
            className="px-5 py-2.5 rounded-lg font-semibold border transition-colors"
            style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
          >
            Edit Supplier
          </Link>
          <Link
            href="/dashboard/purchase-orders/new"
            className="px-5 py-2.5 rounded-lg font-semibold text-white"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            New Purchase Order
          </Link>
        </div>
      </div>

      {/* Supplier Info Cards - Always Show */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Contact Card */}
        <div 
          className="bg-white rounded-xl p-5 border"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: colors.text.secondary }}
          >
            📧 Contact
          </div>
          <div className="space-y-2">
            {supplier.email ? (
              <div className="text-xs font-medium break-all">
                {supplier.email}
              </div>
            ) : (
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                No email on file
              </div>
            )}
            
            {supplier.phone ? (
              <div className="text-xs font-medium">
                {supplier.phone}
              </div>
            ) : (
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                No phone on file
              </div>
            )}
          </div>
        </div>
        
        {/* Address Card */}
        <div 
          className="bg-white rounded-xl p-5 border"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: colors.text.secondary }}
          >
            📍 Address
          </div>
          {(supplier.street_address || supplier.suburb || supplier.state || supplier.postcode) ? (
            <div className="text-xs leading-relaxed">
              {supplier.street_address && <div>{supplier.street_address}</div>}
              {(supplier.suburb || supplier.state || supplier.postcode) && (
                <div>
                  {[supplier.suburb, supplier.state, supplier.postcode]
                    .filter(Boolean)
                    .join(' ')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs" style={{ color: colors.text.secondary }}>
              No address on file
            </div>
          )}
        </div>
        
        {/* Business Details Card */}
        <div 
          className="bg-white rounded-xl p-5 border"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: colors.text.secondary }}
          >
            🏢 Business Details
          </div>
          <div className="space-y-2">
            {supplier.abn ? (
              <div className="text-xs">
                <span style={{ color: colors.text.secondary }}>ABN: </span>
                <span className="font-medium">{supplier.abn}</span>
              </div>
            ) : (
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                No ABN on file
              </div>
            )}
            
            <div className="text-xs">
              <span style={{ color: colors.text.secondary }}>Categories: </span>
              <span className="font-medium">{categoryCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        
        {/* Section Header with Search */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <h2 
            className="text-lg font-bold"
            style={{ color: colors.text.primary }}
          >
            Products
          </h2>
          
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2 border rounded-lg text-sm"
            style={{ borderColor: colors.border.DEFAULT }}
          />
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div 
            className="text-center py-12"
            style={{ color: colors.text.secondary }}
          >
            {searchQuery ? 'No products found' : 'No products yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr 
                  className="border-b"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                  <th className="px-2 py-2 text-center text-xs font-medium uppercase text-gray-500">Unit</th>
                  <th className="px-2 py-2 text-right text-xs font-medium uppercase text-gray-500">Price</th>
                  <th className="px-2 py-2 text-center text-xs font-medium uppercase text-gray-500">Category</th>
                  <th className="px-2 py-2 text-center text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-2 text-xs text-gray-600">
                      {product.product_code || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs font-medium text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-600">
                      {product.unit}
                    </td>
                    <td className="px-2 py-2 text-xs text-right font-medium text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-600">
                      {product.category || '-'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-bold"
                style={{ color: colors.text.primary }}
              >
                Edit Product
              </h2>
              <button
                onClick={() => !saving && setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Code */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Product Code <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={editingProduct.product_code || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, product_code: e.target.value })}
                  placeholder="e.g., SKU123"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.product_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                  placeholder="e.g., Base Cabinet 600mm"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>

              {/* Unit and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="e.g., each, meter, kg"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: colors.border.DEFAULT }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: colors.border.DEFAULT }}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Category <span style={{ color: colors.text.secondary }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={editingProduct.category || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  placeholder="e.g., Plumbing, Electrical"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border.DEFAULT }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !saving && setShowEditModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg font-medium border disabled:opacity-50"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary 
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving || !editingProduct.product_name || !editingProduct.unit}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
