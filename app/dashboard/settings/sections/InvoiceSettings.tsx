'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import { SettingsInput } from '@/components/SettingsInput'
import { SettingsToggle } from '@/components/SettingsToggle'

export default function InvoiceSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [invoicePrefix, setInvoicePrefix] = useState('INV')
  const [invoiceStartNumber, setInvoiceStartNumber] = useState('1')
  const [invoiceTerms, setInvoiceTerms] = useState('Payment due within 30 days')
  
  const [depositRequired, setDepositRequired] = useState(false)
  const [depositPercentage, setDepositPercentage] = useState('30')
  const [stripeEnabled, setStripeEnabled] = useState(false)
  
  const [bankName, setBankName] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setInvoicePrefix(data.invoice_prefix || 'INV')
        setInvoiceStartNumber(String(data.invoice_start_number || 1))
        setInvoiceTerms(data.invoice_terms || 'Payment due within 30 days')
        setDepositRequired(data.deposit_required || false)
        setDepositPercentage(String(data.deposit_percentage || 30))
        setStripeEnabled(data.stripe_enabled || false)
        setBankName(data.bank_name || '')
        setBsb(data.bsb || '')
        setAccountNumber(data.account_number || '')
        setAccountName(data.account_name || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          invoice_prefix: invoicePrefix,
          invoice_start_number: parseInt(invoiceStartNumber) || 1,
          invoice_terms: invoiceTerms,
          deposit_required: depositRequired,
          deposit_percentage: parseFloat(depositPercentage) || 30,
          stripe_enabled: stripeEnabled,
          bank_name: bankName,
          bsb: bsb,
          account_number: accountNumber,
          account_name: accountName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (!error) {
        if (bsb && accountNumber && accountName) {
          await supabase
            .from('onboarding_progress')
            .update({ 
              invoice_settings_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
        }
        
        alert('Invoice settings saved!')
      } else {
        console.error('Save error:', error)
        alert('Failed to save')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
        Invoice Settings
      </h1>

      <SettingsCard title="Invoice Numbering">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput
            label="Invoice Prefix"
            value={invoicePrefix}
            onChange={setInvoicePrefix}
            helpText="E.g. 'INV' creates INV001, INV002"
          />
          <SettingsInput
            label="Next Invoice Number"
            type="number"
            value={invoiceStartNumber}
            onChange={setInvoiceStartNumber}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
            Default Terms
          </label>
          <textarea
            value={invoiceTerms}
            onChange={(e) => setInvoiceTerms(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: colors.border.DEFAULT,
              backgroundColor: colors.background.card,
              color: colors.text.primary,
            }}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Payment & Deposit Settings">
        <SettingsToggle
          label="Accept Stripe Payments"
          description="Allow customers to pay invoices online with credit card via Stripe"
          checked={stripeEnabled}
          onChange={setStripeEnabled}
        />
        
        <div className="mt-6 pt-6 border-t" style={{ borderColor: colors.border.DEFAULT }}>
          <SettingsToggle
            label="Require Deposit on Quotes"
            description="When enabled, accepted quotes will prompt to create a deposit invoice"
            checked={depositRequired}
            onChange={setDepositRequired}
          />
        </div>
        
        {depositRequired && (
          <div className="mt-4 pl-4 border-l-2" style={{ borderColor: colors.border.DEFAULT }}>
            <SettingsInput
              label="Deposit Percentage"
              type="number"
              value={depositPercentage}
              onChange={setDepositPercentage}
              helpText="Percentage of total quote value required as deposit (0-100)"
            />
            <div className="mt-2 p-3 rounded-md text-sm" style={{
              backgroundColor: colors.background.main,
              color: colors.text.secondary
            }}>
              <p className="font-medium mb-1" style={{ color: colors.text.primary }}>How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>When a quote is accepted, you'll be prompted to create a deposit invoice</li>
                <li>Deposit invoice will be {depositPercentage}% of the quote total</li>
                <li>After deposit is paid, you can create the final invoice for the balance</li>
              </ul>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Bank Details">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput label="Bank Name" value={bankName} onChange={setBankName} />
          <SettingsInput label="Account Name" value={accountName} onChange={setAccountName} />
          <SettingsInput label="BSB" value={bsb} onChange={setBsb} />
          <SettingsInput label="Account Number" value={accountNumber} onChange={setAccountNumber} />
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
