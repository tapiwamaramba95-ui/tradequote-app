'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import Link from 'next/link'
import { Edit2, X } from 'lucide-react'

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

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 
              className="text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {supplier.name}
            </h1>
            {!supplier.details_completed && (
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
              >
                ⚠️ Incomplete
              </span>
            )}
          </div>
          <p style={{ color: colors.text.secondary }}>
            {products.length} products
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/suppliers/${supplier.id}/edit`}
            className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
            style={{ 
              borderColor: colors.border.DEFAULT,
              color: colors.text.primary 
            }}
          >
            Edit Supplier
          </Link>
          <Link
            href="/dashboard/purchase-orders/new"
            className="px-6 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Supplier Info Card */}
      {supplier.details_completed && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 
            className="text-lg font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            Contact Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {supplier.email && (
              <div>
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Email
                </p>
                <p style={{ color: colors.text.primary }}>{supplier.email}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Phone
                </p>
                <p style={{ color: colors.text.primary }}>{supplier.phone}</p>
              </div>
            )}
            {supplier.abn && (
              <div>
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  ABN
                </p>
                <p style={{ color: colors.text.primary }}>{supplier.abn}</p>
              </div>
            )}
            {(supplier.street_address || supplier.suburb || supplier.state || supplier.postcode) && (
              <div className="col-span-2 md:col-span-3">
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Address
                </p>
                <p style={{ color: colors.text.primary }}>
                  {[
                    supplier.street_address,
                    [supplier.suburb, supplier.state, supplier.postcode].filter(Boolean).join(' ')
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div 
          className="p-6 border-b"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-lg text-sm"
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
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b hover:bg-gray-50"
                    style={{ borderColor: colors.border.DEFAULT }}
                  >
                    <td className="px-6 py-4 text-sm font-mono">
                      {product.product_code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {product.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ 
                          color: colors.accent.DEFAULT,
                          backgroundColor: colors.background.card
                        }}
                        title="Edit product"
                      >
                        <Edit2 size={14} />
                        Edit
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
