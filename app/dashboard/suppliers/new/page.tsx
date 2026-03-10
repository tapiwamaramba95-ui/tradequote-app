"use client"

import { useState } from 'react'
import { colors } from '@/lib/colors'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import AddressInput from '@/components/AddressInput'
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'
import Link from 'next/link'

export default function NewSupplierPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Supplier name is required')
      return
    }
    
    setSaving(true)

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          contact_person: contactName.trim(), 
          email: email.trim(), 
          phone: phone.trim(), 
          mobile: mobile.trim(), 
          address: address.trim(), 
          notes: notes.trim() 
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Supplier creation error:', errorData)
        alert('Failed to create supplier: ' + (errorData.error || `Server error ${res.status}`))
        return
      }
      
      const result = await res.json()
      console.log('Supplier created successfully:', result)
      router.push('/dashboard/suppliers')
    } catch (err) {
      console.error('Network error:', err)
      alert('Failed to create supplier: Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[
          { label: 'Suppliers', href: '/dashboard/suppliers' },
          { label: 'New Supplier' }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Supplier</h1>
          <p className="text-gray-600 mt-2">Add a new supplier to your business directory</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input 
                  value={contactName} 
                  onChange={e=>setContactName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="Primary contact name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  value={phone} 
                  onChange={e=>setPhone(e.target.value)} 
                  placeholder="Phone number" 
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                />
                <input 
                  value={mobile} 
                  onChange={e=>setMobile(e.target.value)} 
                  placeholder="Mobile number" 
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                />
                <input 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder="Email address" 
                  type="email"
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <AddressInput
                  value={address}
                  onChange={setAddress}
                  required={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  value={notes} 
                  onChange={e=>setNotes(e.target.value)} 
                  rows={3} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none" 
                  placeholder="Additional notes about this supplier"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Link 
                  href="/dashboard/suppliers"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </Link>
                <button 
                  onClick={handleSave} 
                  disabled={saving || !name} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? 'Creating...' : 'Create Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
