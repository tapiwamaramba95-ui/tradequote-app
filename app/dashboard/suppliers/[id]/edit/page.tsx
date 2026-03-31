'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
}

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    abn: '',
    email: '',
    phone: '',
    street_address: '',
    suburb: '',
    state: '',
    postcode: ''
  })

  useEffect(() => {
    loadSupplier()
  }, [id])

  const loadSupplier = async () => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) {
        router.push('/dashboard/suppliers')
        return
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .eq('business_id', businessId)
        .single()

      if (error) throw error

      if (data) {
        setSupplier(data)
        setFormData({
          name: data.name || '',
          abn: data.abn || '',
          email: data.email || '',
          phone: data.phone || '',
          street_address: data.street_address || '',
          suburb: data.suburb || '',
          state: data.state || '',
          postcode: data.postcode || ''
        })
      }
    } catch (error) {
      console.error('Error loading supplier:', error)
      alert('Failed to load supplier')
      router.push('/dashboard/suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name,
          abn: formData.abn || null,
          email: formData.email || null,
          phone: formData.phone || null,
          street_address: formData.street_address || null,
          suburb: formData.suburb || null,
          state: formData.state || null,
          postcode: formData.postcode || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      alert('✅ Supplier updated successfully')
      router.push(`/dashboard/suppliers/${id}`)
    } catch (error) {
      console.error('Error updating supplier:', error)
      alert('Failed to update supplier')
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
    <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/suppliers/${id}`}
          className="inline-flex items-center gap-2 mb-4 text-sm font-medium"
          style={{ color: colors.accent.DEFAULT }}
        >
          <ArrowLeft size={16} />
          Back to Supplier
        </Link>
        <h1 
          className="text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          Edit Supplier
        </h1>
        <p style={{ color: colors.text.secondary }}>
          Update supplier contact details and information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="space-y-6">
          {/* Supplier Name */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="e.g., Bunnings Warehouse"
            />
          </div>

          {/* ABN */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              ABN <span style={{ color: colors.text.secondary }}>(optional)</span>
            </label>
            <input
              type="text"
              value={formData.abn}
              onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="12 345 678 901"
            />
          </div>

          {/* Email */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Email <span style={{ color: colors.text.secondary }}>(optional)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="sales@supplier.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Phone <span style={{ color: colors.text.secondary }}>(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="1300 123 456"
            />
          </div>

          {/* Street Address */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Street Address <span style={{ color: colors.text.secondary }}>(optional)</span>
            </label>
            <input
              type="text"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="123 Trade St"
            />
          </div>

          {/* Suburb, State, Postcode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text.primary }}
              >
                Suburb <span style={{ color: colors.text.secondary }}>(optional)</span>
              </label>
              <input
                type="text"
                value={formData.suburb}
                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 text-base"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="Melbourne"
              />
            </div>
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text.primary }}
              >
                State <span style={{ color: colors.text.secondary }}>(optional)</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 text-base"
                style={{ borderColor: colors.border.DEFAULT }}
                placeholder="VIC"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Postcode <span style={{ color: colors.text.secondary }}>(optional)</span>
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 text-base"
              style={{ borderColor: colors.border.DEFAULT }}
              placeholder="3000"
              maxLength={4}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Link
            href={`/dashboard/suppliers/${id}`}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-center border-2"
            style={{ 
              borderColor: colors.border.DEFAULT,
              color: colors.text.primary 
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
