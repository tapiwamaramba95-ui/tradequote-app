'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import Link from 'next/link'
import { Package, Upload, Plus, CheckCircle, AlertTriangle, Mail, Phone, Eye, Edit } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

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
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Suppliers', href: '/dashboard/suppliers' }]} />
      
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
        <>
          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {supplier.details_completed ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={18} className="text-yellow-500" />
                    )}
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {supplier.email && <div className="truncate">{supplier.email}</div>}
                  {supplier.phone && <div>{supplier.phone}</div>}
                  <div className="font-medium mt-1">{supplier.product_count} products</div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/suppliers/${supplier.id}`}
                    className="flex-1 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/dashboard/suppliers/${supplier.id}/edit`}
                    className="flex-1 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supplier.details_completed ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={18} />
                          <span className="text-xs font-medium">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <AlertTriangle size={18} />
                          <span className="text-xs font-medium">Incomplete</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{supplier.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{supplier.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.product_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/suppliers/${supplier.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                        <Link
                          href={`/dashboard/suppliers/${supplier.id}/edit`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
