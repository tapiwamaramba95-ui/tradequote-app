'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
import PhotoGallery from '@/components/PhotoGallery'
import { Camera } from 'lucide-react'

// Create a public Supabase client (doesn't require auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Quote = {
  id: string
  quote_number: string
  total: number
  subtotal: number
  tax: number
  created_at: string
  valid_until: string
  line_items: any[]
  notes?: string
  terms?: string
  status: string
  job_id?: string
  accepted_at?: string
  rejected_at?: string
}

type Job = {
  job_name: string
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
}

export default function ViewQuotePage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQuote()
  }, [])

  const loadQuote = async () => {
    const token = params.token as string

    try {
      // Use API endpoint instead of direct Supabase calls
      const response = await fetch(`/api/quote/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Quote not found or link has expired')
        } else if (response.status === 410) {
          setError('This quote link has expired. Please request a new quote.')
        } else {
          setError('Failed to load quote')
        }
        setLoading(false)
        return
      }

      const { quote, job, client, businessSettings } = await response.json()
      setQuote(quote)
      setJob(job)
      setClient(client)
      setBusinessSettings(businessSettings)
      setLoading(false)
    } catch (err) {
      setError('Something went wrong. Please contact us directly.')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!quote) return

    const confirmed = confirm('Accept this quote?')
    if (!confirmed) return

    setSubmitting(true)

    try {
      const token = params.token as string
      const response = await fetch(`/api/quote/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to accept quote. Please try again or contact us.')
        setSubmitting(false)
        return
      }

      // Redirect to thank you page
      router.push('/quote/accepted')
    } catch (err) {
      alert('Something went wrong. Please contact us directly.')
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!quote) return

    const reason = prompt('Optional: Let us know why you\'re declining (or leave blank)')

    setSubmitting(true)

    try {
      const token = params.token as string
      const response = await fetch(`/api/quote/${token}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || null })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to decline quote. Please try again or contact us.')
        setSubmitting(false)
        return
      }

      // Redirect to declined page
      router.push('/quote/declined')
    } catch (err) {
      alert('Something went wrong. Please contact us directly.')
      setSubmitting(false)
    }
  }

  // Get brand color from business settings or use default (needs to be before early returns)
  const brandColor = businessSettings?.primary_brand_color || colors.accent.DEFAULT

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
  const companyLogo = businessSettings?.company_logo_url || ''
  const companyName = businessSettings?.company_name || ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: brandColor }}></div>
          <p style={{ color: colors.text.secondary }}>Loading quote...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
        <div className="max-w-md w-full">
          <div
            className="rounded-lg p-8 text-center border"
            style={{
              backgroundColor: colors.background.card,
              borderColor: colors.border.DEFAULT
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${colors.semantic.error}15` }}
            >
              <svg className="h-8 w-8" style={{ color: colors.semantic.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
              Unable to Load Quote
            </h1>
            <p className="mb-6" style={{ color: colors.text.secondary }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!quote) return null

  // Already accepted
  if (quote.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
        <div className="max-w-2xl w-full">
          <div
            className="rounded-lg p-8 border shadow-lg"
            style={{
              backgroundColor: colors.background.card,
              borderColor: colors.border.DEFAULT
            }}
          >
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ backgroundColor: `${colors.semantic.success}15` }}
              >
                <svg className="h-10 w-10" style={{ color: colors.semantic.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Quote Already Accepted!
              </h1>
              <p className="text-lg" style={{ color: colors.text.secondary }}>
                This quote was accepted on {new Date(quote.accepted_at!).toLocaleDateString()}
              </p>
            </div>

            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: colors.background.main,
                borderLeft: `4px solid ${brandColor}`
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Quote Number
              </p>
              <p className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
                {quote.quote_number}
              </p>
              <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Total Amount
              </p>
              <p className="text-2xl font-bold" style={{ color: brandColor }}>
                ${quote.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Already rejected
  if (quote.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
        <div className="max-w-md w-full">
          <div
            className="rounded-lg p-8 text-center border"
            style={{
              backgroundColor: colors.background.card,
              borderColor: colors.border.DEFAULT
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${colors.semantic.info}15` }}
            >
              <svg className="h-8 w-8" style={{ color: colors.semantic.info }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
              Quote Declined
            </h1>
            <p className="mb-4" style={{ color: colors.text.secondary }}>
              This quote was declined on {new Date(quote.rejected_at!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Active quote - show full details
  return (
    <div className="min-h-screen py-6 sm:py-12 px-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-6" style={{ backgroundColor: colors.background.card }}>
          
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text.primary }}>QUOTE</h1>
          </div>

          {/* Quote Details with Company Name */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-6">
            <div className="flex-1">
              <p style={{ color: colors.text.primary }}>Quote #{quote.quote_number}</p>
              <p style={{ color: colors.text.primary }}>Date: {new Date(quote.created_at).toLocaleDateString()}</p>
              <p style={{ color: colors.text.primary }}>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</p>
              {(quote.status === 'accepted' || quote.status === 'declined') && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ 
                    backgroundColor: quote.status === 'accepted' ? `${colors.semantic.success}20` : `${colors.semantic.info}20`, 
                    color: quote.status === 'accepted' ? colors.semantic.success : colors.semantic.info 
                  }}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center md:text-right flex-shrink-0">
              {businessSettings?.company_logo_url && businessSettings.company_logo_url.trim() !== '' ? (
                <img 
                  src={businessSettings.company_logo_url} 
                  alt={businessSettings.company_name || 'Company Logo'} 
                  className="h-16 md:h-20 w-auto max-w-48 md:max-w-60 mx-auto md:mx-0"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
                />
              ) : businessSettings?.company_name ? (
                <div className="text-center md:text-right">
                  <h2 className="text-2xl md:text-3xl font-bold" style={{ color: brandColor }}>
                    {businessSettings.company_name}
                  </h2>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-4 sm:mb-6">
            <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: colors.text.primary }}>Bill To:</h3>
            <div className="space-y-1">
              <p className="font-medium text-sm sm:text-base" style={{ color: colors.text.primary }}>{client?.name || 'Customer'}</p>
              {client?.email && <p className="text-xs sm:text-sm" style={{ color: colors.text.primary }}>{client.email}</p>}
              {client?.phone && <p className="text-xs sm:text-sm" style={{ color: colors.text.primary }}>{client.phone}</p>}
              {client?.address && <p className="text-xs sm:text-sm whitespace-pre-line" style={{ color: colors.text.primary }}>{client.address}</p>}
            </div>
          </div>

          {/* Project */}
          {job?.job_name && (
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: colors.text.primary }}>Project:</h3>
              <p className="font-medium text-sm sm:text-base" style={{ color: colors.text.primary }}>{job.job_name}</p>
            </div>
          )}

          {/* Job Photos - Customer View */}
          {quote.job_id && (
            <div className="mb-6 sm:mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ backgroundColor: colors.background.card }}>
                <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colors.background.main }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <Camera className="w-4 h-4" />
                    Project Photos
                  </h3>
                </div>
                <div className="p-4">
                  <PhotoGallery jobId={quote.job_id} editable={false} />
                </div>
              </div>
            </div>
          )}


          {/* Line Items */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: colors.border.DEFAULT }}>
                  <th className="text-left py-3 text-sm font-medium min-w-0 pr-4" style={{ color: colors.text.secondary }}>DESCRIPTION</th>
                  <th className="text-right py-3 text-sm font-medium w-16 sm:w-20" style={{ color: colors.text.secondary }}>QTY</th>
                  <th className="text-right py-3 text-sm font-medium w-20 sm:w-24" style={{ color: colors.text.secondary }}>RATE</th>
                  <th className="text-right py-3 text-sm font-medium w-24 sm:w-28" style={{ color: colors.text.secondary }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(quote.line_items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-3 text-left text-sm sm:text-base min-w-0 pr-4" style={{ color: colors.text.primary }}>
                      <div className="break-words">{item.description || ''}</div>
                    </td>
                    <td className="py-3 text-right text-sm sm:text-base w-16 sm:w-20" style={{ color: colors.text.primary }}>{item.quantity || 0}</td>
                    <td className="py-3 text-right text-sm sm:text-base w-20 sm:w-24" style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(item.rate || item.unit_price || 0))}</td>
                    <td className="py-3 text-right text-sm sm:text-base w-24 sm:w-28 font-medium" style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(item.amount || 0))}</td>
                  </tr>
                ))}
                {(!quote.line_items || quote.line_items.length === 0) && (
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
            <div className="w-full max-w-xs sm:w-64 pr-0"> {/* Align with Amount column */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span style={{ color: colors.text.secondary }}>Subtotal:</span>
                  <span style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(quote.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span style={{ color: colors.text.secondary }}>Tax:</span>
                  <span style={{ color: colors.text.primary }}>{formatCurrency(safeNumber(quote.tax))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 font-bold text-base sm:text-lg" style={{ borderColor: colors.border.DEFAULT }}>
                  <span style={{ color: colors.text.primary }}>Total:</span>
                  <span style={{ color: brandColor }}>{formatCurrency(safeNumber(quote.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>Notes:</p>
              <div 
                className="text-xs sm:text-sm whitespace-pre-wrap rounded-lg p-3 sm:p-4 ml-0" 
                style={{ 
                  color: colors.text.primary,
                  backgroundColor: colors.background.card,
                  maxHeight: '250px',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {quote.notes}
              </div>
            </div>
          )}

          {/* Terms */}
          {quote.terms && (
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>Terms & Conditions:</p>
              <div 
                className="text-xs sm:text-sm whitespace-pre-wrap rounded-lg p-3 sm:p-4 ml-0" 
                style={{ 
                  color: colors.text.primary,
                  backgroundColor: colors.background.card,
                  maxHeight: '250px',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {quote.terms}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="w-full sm:flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white text-base sm:text-lg transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: colors.semantic.success }}
            >
              {submitting ? 'Processing...' : '✓ Accept Quote'}
            </button>
            <button
              onClick={handleDecline}
              disabled={submitting}
              className="w-full sm:flex-1 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all disabled:opacity-50 hover:opacity-75"
              style={{
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `2px solid ${colors.border.DEFAULT}`
              }}
            >
              {submitting ? 'Processing...' : '✗ Decline Quote'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Powered by <span className="font-semibold" style={{ color: brandColor }}>TradeQuote</span>
          </p>
        </div>
      </div>
    </div>
  )
}