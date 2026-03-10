'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/StatusBadge'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import Table from '@/components/Table'
import { Package, Plus, Search, Eye, Edit, ShoppingCart } from 'lucide-react'

type PurchaseOrder = {
  id: string
  po_number: string
  status: string
  order_date: string
  delivery_date: string
  total: number
  suppliers: { name: string } | null
  jobs: { job_name: string } | null
}

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Stats
  const [stats, setStats] = useState({
    draft: 0,
    sent: 0,
    received: 0,
    billed: 0,
    totalValue: 0,
  })

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  const loadPurchaseOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers!supplier_id (name),
          jobs!job_id (job_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setPos(data)
        
        // Calculate stats
        const draft = data.filter(po => po.status === 'draft').length
        const sent = data.filter(po => po.status === 'sent').length
        const received = data.filter(po => po.status === 'received').length
        const billed = data.filter(po => po.status === 'billed').length
        const totalValue = data.reduce((sum, po) => sum + (po.total || 0), 0)
        
        setStats({ draft, sent, received, billed, totalValue })
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPOs = pos.filter(po => {
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSearch =
      !search ||
      po.po_number.toLowerCase().includes(search.toLowerCase()) ||
      po.suppliers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      po.jobs?.job_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Purchase Orders', href: '/dashboard/purchase-orders' }
      ]} />
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          {/* Icon Badge */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Orders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pos.length} {pos.length === 1 ? 'purchase order' : 'purchase orders'}
            </p>
          </div>
        </div>
        
        {/* Right: Action Button */}
        <Link
          href="/dashboard/purchase-orders/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
          style={{ 
            backgroundColor: colors.accent.DEFAULT,
            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </Link>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              statusFilter === 'all'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({pos.length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              statusFilter === 'draft'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Draft ({stats.draft})
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              statusFilter === 'sent'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sent ({stats.sent})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              statusFilter === 'received'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Received ({stats.received})
          </button>
          <button
            onClick={() => setStatusFilter('billed')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              statusFilter === 'billed'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Billed ({stats.billed})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div 
        className="bg-white rounded-lg shadow-sm border p-4 mb-6" 
        style={{ borderColor: colors.border.DEFAULT }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/purchase-orders/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            <Plus size={18} />
            New Purchase Order
          </Link>
          
          <div className="flex flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} style={{ color: colors.text.muted }} />
            </div>
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: colors.border.DEFAULT,
                color: colors.text.primary 
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={[
            {
              key: 'po_number',
              label: 'Order No',
              align: 'left',
              render: (po: PurchaseOrder) => (
                <Link
                  href={`/dashboard/purchase-orders/${po.id}`}
                  className="hover:underline font-medium text-blue-700"
                >
                  {po.po_number}
                </Link>
              )
            },
            {
              key: 'supplier',
              label: 'Supplier',
              align: 'left',
              render: (po: PurchaseOrder) => po.suppliers?.name || '-'
            },
            {
              key: 'job',
              label: 'Job',
              align: 'left',
              render: (po: PurchaseOrder) => po.jobs?.job_name || '-'
            },
            {
              key: 'order_date',
              label: 'Order Date',
              align: 'center',
              render: (po: PurchaseOrder) => po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'
            },
            {
              key: 'delivery_date',
              label: 'Delivery Date',
              align: 'center',
              render: (po: PurchaseOrder) => po.delivery_date ? new Date(po.delivery_date).toLocaleDateString() : '-'
            },
            {
              key: 'total',
              label: 'Total',
              align: 'center',
              render: (po: PurchaseOrder) => (
                <span className="font-medium">
                  ${po.total?.toLocaleString() || '0.00'}
                </span>
              )
            },
            {
              key: 'status',
              label: 'Status',
              align: 'center',
              render: (po: PurchaseOrder) => <StatusBadge status={po.status} />
            }
          ]}
          data={filteredPOs}
          loading={loading}
          emptyMessage={
            <>
              No purchase orders found for this status.{' '}
              <Link href="/dashboard/purchase-orders/new" className="text-blue-600 hover:underline font-medium">
                Create your first PO
              </Link>
            </>
          }
        />
      </div>
    </div>
  )
}
