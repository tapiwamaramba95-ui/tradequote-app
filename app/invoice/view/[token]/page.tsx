'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'
import { colors } from '@/lib/colors'
import PhotoGallery from '@/components/PhotoGallery'
import { Camera } from 'lucide-react'

// Create a public Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total: number
  subtotal: number
  tax: number
  amount_paid: number
  line_items: any[]
  notes?: string
  terms?: string
  status: string
  job_id?: string
}

type Job = {
  job_name: string
  job_number?: string
  client_id?: string
}

type Client = {
  name: string
  email?: string
  phone?: string
  address?: string
}

type BusinessSettings = {
  primary_brand_color?: string
  company_logo_url?: string
  company_name?: string
  bank_name?: string
  bsb?: string
  account_number?: string
  account_name?: string
}

export default function ViewInvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInvoice()
  }, [])

  const loadInvoice = async () => {
    const token = params.token as string

    try {
      const response = await fetch(`/api/invoice/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Invoice not found or link has expired')
        } else if (response.status === 410) {
          setError('This invoice link has expired. Please request a new invoice.')
        } else {
          setError('Failed to load invoice')
        }
        setLoading(false)
        return
      }

      const { invoice, job, client, businessSettings } = await response.json()
      setInvoice(invoice)
      setJob(job)
      setClient(client)
      setBusinessSettings(businessSettings)
      setLoading(false)
    } catch (err) {
      setError('Something went wrong. Please contact us directly.')
      setLoading(false)
    }
  }

  // Get brand color from business settings or use default (needs to be before early returns)
  const brandColor = businessSettings?.primary_brand_color || colors.accent.DEFAULT
  const companyLogo = businessSettings?.company_logo_url || ''
  const companyName = businessSettings?.company_name || ''

  // Format currency with commas
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount
    return `$${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Safe number conversion
  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.main }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: brandColor }}></div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16" style={{ color: colors.semantic.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
            {error || 'Invoice Not Found'}
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            Please contact us if you need assistance.
          </p>
        </div>
      </div>
    )
  }

  const balance = safeNumber(invoice.total) - safeNumber(invoice.amount_paid || 0)
  const isPaid = balance <= 0

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg shadow-lg p-8 mb-6" style={{ backgroundColor: colors.background.card }}>
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>INVOICE</h1>
          </div>

          {/* Invoice Details with Company Name */}
          <div className="flex justify-between items-baseline mb-6">
            <div>
              <p style={{ color: colors.text.primary }}>Invoice #{invoice.invoice_number}</p>
              <p style={{ color: colors.text.primary }}>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              <p style={{ color: colors.text.primary }}>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
              {isPaid && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${colors.semantic.success}20`, color: colors.semantic.success }}>
                    Paid
                  </span>
                </div>
              )}
            </div>
            <div className="text-right mr-8">
              {businessSettings?.company_logo_url && businessSettings.company_logo_url.trim() !== '' ? (
                <img 
                  src={businessSettings.company_logo_url} 
                  alt={businessSettings.company_name || 'Company Logo'} 
                  className="h-20 w-auto max-w-60"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
                />
              ) : businessSettings?.company_name ? (
                <div className="text-right">
                  <h2 className="text-3xl font-bold" style={{ color: brandColor }}>
                    {businessSettings.company_name}
                  </h2>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Bill To:</h3>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: colors.text.primary }}>{client?.name || 'Customer'}</p>
              {client?.email && <p className="text-sm" style={{ color: colors.text.primary }}>{client.email}</p>}
              {client?.phone && <p className="text-sm" style={{ color: colors.text.primary }}>{client.phone}</p>}
              {client?.address && <p className="text-sm whitespace-pre-line" style={{ color: colors.text.primary }}>{client.address}</p>}
            </div>
          </div>

          {/* Project */}
          {job?.job_name && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Project:</h3>
              <p className="font-medium" style={{ color: colors.text.primary }}>{job.job_name}</p>
            </div>
          )}

          {/* Job Photos - Customer View */}
          {invoice.job_id && (
            <div className="mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ backgroundColor: colors.background.card }}>
                <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colors.background.main }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <Camera className="w-4 h-4" />
                    Completed Work Photos
                  </h3>
                </div>
                <div className="p-4">
                  <PhotoGallery jobId={invoice.job_id} editable={false} />
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: colors.border.DEFAULT }}>
                  <th className="text-left py-3 text-sm font-medium" style={{ color: colors.text.secondary }}>DESCRIPTION</th>
                  <th className="text-right py-3 text-sm font-medium" style={{ color: colors.text.secondary }}>QTY</th>
                  <th className="text-right py-3 text-sm font-medium" style={{ color: colors.text.secondary }}>RATE</th>
                  <th className="text-right py-3 text-sm font-medium" style={{ color: colors.text.secondary }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.line_items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-3 text-left" style={{ color: colors.text.primary }}>{item.description || ''}</td>
                    <td className="py-3 text-right" style={{ color: colors.text.primary }}>{item.quantity || 0}</td>
                    <td className="py-3 text-right" style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(item.unit_price || item.rate || 0))}</td>
                    <td className="py-3 text-right" style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(item.amount || 0))}</td>
                  </tr>
                ))}
                {(!invoice.line_items || invoice.line_items.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No line items available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 pr-0">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Subtotal:</span>
                  <span style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(invoice.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Tax:</span>
                  <span style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(invoice.tax))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 font-bold" style={{ borderColor: colors.border.DEFAULT }}>
                  <span style={{ color: colors.text.primary }}>Total:</span>
                  <span style={{ color: brandColor }}>{formatCurrency(safeNumber(invoice.total))}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: colors.semantic.success }}>Paid:</span>
                    <span style={{ color: colors.semantic.success }}>-{formatCurrency(safeNumber(invoice.amount_paid))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t-2 font-bold" style={{ borderColor: colors.border.DEFAULT }}>
                  <span style={{ color: colors.text.primary }}>Balance Due:</span>
                  <span style={{ color: brandColor }}>{formatCurrency(balance)}</span>
                </div>
              </div>
            </div>
          </div>



          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>Notes:</p>
              <div 
                className="text-sm whitespace-pre-wrap rounded-lg p-4 ml-0" 
                style={{ 
                  color: colors.text.primary,
                  backgroundColor: colors.background.card,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {invoice.notes}
              </div>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>Terms & Conditions:</p>
              <div 
                className="text-sm whitespace-pre-wrap rounded-lg p-4 ml-0" 
                style={{ 
                  color: colors.text.primary,
                  backgroundColor: colors.background.card,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {invoice.terms}
              </div>
            </div>
          )}

          {/* Payment Options Section */}
          {!isPaid && (
            <div className="mt-8">
              <h3 className="font-semibold mb-6 text-center" style={{ color: colors.text.primary }}>Payment Options</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bank Details - Left Side */}
                {businessSettings && (businessSettings.bank_name || businessSettings.bsb || businessSettings.account_number) && (
                  <div>
                    <div 
                      className="text-sm whitespace-pre-wrap rounded-lg p-4" 
                      style={{ 
                        color: colors.text.primary,
                        backgroundColor: colors.background.card,
                        lineHeight: '1.6'
                      }}
                    >
                      <div className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>Bank Transfer Details:</div>
                      <div className="text-sm font-bold mb-2">PAYMENTS BY DIRECT BANK DEPOSIT</div>
                      <div className="text-sm mb-2">Please use the following details when paying by Direct Bank Deposit:</div>
                      <div className="text-sm mb-1">
                        <span className="font-bold">BSB:</span> {businessSettings.bsb || '—'}
                      </div>
                      <div className="text-sm mb-1">
                        <span className="font-bold">A/C No:</span> {businessSettings.account_number || '—'}
                      </div>
                      <div className="text-sm mb-2">
                        <span className="font-bold">A/C Name:</span> {businessSettings.account_name || '—'}
                      </div>
                      <div className="text-xs mt-3" style={{color: colors.text.muted}}>
                        Please include invoice number {invoice.invoice_number} in your bank transfer description.
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Button - Right Side */}
                <div className="flex flex-col items-center justify-start">
                  <button
                    onClick={() => alert('Payment integration coming soon! Please contact us to arrange payment.')}
                    className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all w-full max-w-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    Pay Invoice
                  </button>
                  <p className="mt-3 text-sm text-center" style={{ color: colors.text.muted }}>
                    Stripe payment integration coming soon
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
