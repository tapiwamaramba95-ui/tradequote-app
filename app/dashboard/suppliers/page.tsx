'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import Link from 'next/link'
import { Package, Upload, Plus, CheckCircle, AlertTriangle, Mail, Phone } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  auto_created: boolean
  details_completed: boolean
  product_count?: number
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const businessId = await getBusinessId()
      if (!businessId) return

      // Load suppliers with product count
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
      setLoading(false)
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          {/* Icon Badge */}
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center shadow-sm">
            <Package className="w-6 h-6 text-yellow-600" />
          </div>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Suppliers
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}
            </p>
          </div>
        </div>
        
        {/* Right: Action Buttons */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/settings?tab=price-list&section=supplier-price-lists"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import Price List
          </Link>
          <Link
            href="/dashboard/suppliers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            New Supplier
          </Link>
        </div>
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div 
          className="bg-white rounded-2xl p-12 text-center shadow-sm border"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            No suppliers yet
          </h3>
          <p 
            className="mb-6"
            style={{ color: colors.text.secondary }}
          >
            Import a price list or add a supplier manually to get started
          </p>
          <Link
            href="/dashboard/settings?tab=price-list&section=supplier-price-lists"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            <Upload size={18} />
            Import Price List
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Status indicator */}
              <div className="flex items-center gap-2 mb-4">
                {supplier.details_completed ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertTriangle size={20} className="text-yellow-500" />
                )}
                <h3 
                  className="text-lg font-bold flex-1"
                  style={{ color: colors.text.primary }}
                >
                  {supplier.name}
                </h3>
              </div>

              {/* Contact info or warning */}
              {supplier.details_completed ? (
                <div 
                  className="space-y-2 text-sm mb-4"
                  style={{ color: colors.text.secondary }}
                >
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="text-sm mb-4 px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                  }}
                >
                  Contact details incomplete
                </div>
              )}

              {/* Product count */}
              <div 
                className="text-sm font-semibold mb-4"
                style={{ color: colors.text.secondary }}
              >
                {supplier.product_count} products
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/suppliers/${supplier.id}`}
                  className="flex-1 text-center px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  style={{ 
                    backgroundColor: colors.accent.DEFAULT,
                    color: 'white'
                  }}
                >
                  View Products
                </Link>
                {!supplier.details_completed && (
                  <Link
                    href={`/dashboard/suppliers/${supplier.id}/edit`}
                    className="px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-colors"
                    style={{ 
                      borderColor: colors.accent.DEFAULT,
                      color: colors.accent.DEFAULT
                    }}
                  >
                    Add Details
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
