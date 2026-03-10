'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'

type Supplier = {
  id: string
  name: string
  abn: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
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

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSupplierData()
  }, [params.id])

  const loadSupplierData = async () => {
    try {
      // Load supplier
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (supplierData) setSupplier(supplierData)

      // Load products
      const { data: productsData } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', params.id)
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
            {supplier.address && (
              <div>
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Address
                </p>
                <p style={{ color: colors.text.primary }}>{supplier.address}</p>
              </div>
            )}
            {supplier.website && (
              <div>
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.text.secondary }}
                >
                  Website
                </p>
                <a 
                  href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: colors.accent.DEFAULT }}
                >
                  {supplier.website}
                </a>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
