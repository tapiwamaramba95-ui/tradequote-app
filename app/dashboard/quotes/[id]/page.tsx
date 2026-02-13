'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/QuotePDF'
import { colors } from '@/lib/colors'
import Link from 'next/link'

type Quote = any // Use the full Quote type from QuotePDF

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        jobs (
          title,
          clients (
            name,
            email,
            phone,
            address
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setQuote(data)
    }
    setLoading(false)
  }

  const handleSendEmail = async () => {
    if (!quote.jobs.clients.email) {
      alert('Client has no email address')
      return
    }

    const confirmed = confirm(`Send quote to ${quote.jobs.clients.email}?`)
    if (!confirmed) return

    setSending(true)

    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: quote.jobs.clients.email,
          quoteNumber: quote.quote_number,
        }),
      })

      if (response.ok) {
        alert('Quote sent successfully!')
        
        // Update quote status to 'sent'
        await supabase
          .from('quotes')
          .update({ status: 'sent' })
          .eq('id', quote.id)
        
        fetchQuote() // Refresh
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      alert('Error sending email')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
            Quote not found
          </h3>
          <Link href="/dashboard/quotes" className="text-sm hover:underline" style={{ color: colors.accent.DEFAULT }}>
            Back to Quotes
          </Link>
        </div>
      </div>
    )
  }

  const statusColor = quote.status === 'sent' ? colors.semantic.info : 
                      quote.status === 'accepted' ? colors.semantic.success :
                      quote.status === 'rejected' ? colors.semantic.error :
                      colors.text.muted

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: colors.text.muted }}>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/quotes" className="hover:underline">Quotes</Link>
          <span>/</span>
          <span>#{quote.quote_number}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Quote #{quote.quote_number}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Created {new Date(quote.created_at).toLocaleDateString()}
              </p>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                }}
              >
                {quote.status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all disabled:opacity-50"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            >
              {sending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </>
              )}
            </button>

            <PDFDownloadLink
              document={<QuotePDF quote={quote} />}
              fileName={`quote-${quote.quote_number}.pdf`}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all"
              style={{ backgroundColor: colors.accent.DEFAULT }}
            >
              {({ loading }) => (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {loading ? 'Generating...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Quote Preview */}
      <div 
        className="shadow rounded-lg p-8 border"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>QUOTE</h2>
          <p className="text-sm" style={{ color: colors.text.secondary }}>Quote #{quote.quote_number}</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>Date: {new Date(quote.created_at).toLocaleDateString()}</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Bill To:</h3>
          <p style={{ color: colors.text.primary }}>{quote.jobs.clients.name}</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{quote.jobs.clients.email}</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{quote.jobs.clients.phone}</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{quote.jobs.clients.address}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Project:</h3>
          <p style={{ color: colors.text.primary }}>{quote.jobs.title}</p>
        </div>

        <table className="w-full mb-6">
          <thead style={{ backgroundColor: colors.background.main }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text.secondary }}>Description</th>
              <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.text.secondary }}>Qty</th>
              <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.text.secondary }}>Rate</th>
              <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.text.secondary }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.line_items.map((item: any, index: number) => (
              <tr key={index} className="border-b" style={{ borderColor: colors.border.light }}>
                <td className="px-4 py-3" style={{ color: colors.text.primary }}>{item.description}</td>
                <td className="px-4 py-3 text-right" style={{ color: colors.text.primary }}>{item.quantity}</td>
                <td className="px-4 py-3 text-right" style={{ color: colors.text.primary }}>${item.rate.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium" style={{ color: colors.text.primary }}>${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Subtotal:</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Tax:</span>
              <span>${quote.tax.toFixed(2)}</span>
            </div>
            <div 
              className="flex justify-between py-2 border-t-2 font-bold text-lg"
              style={{ 
                borderColor: colors.text.primary,
                color: colors.text.primary 
              }}
            >
              <span>Total:</span>
              <span style={{ color: colors.accent.DEFAULT }}>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Notes:</h3>
            <p style={{ color: colors.text.secondary }}>{quote.notes}</p>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Terms & Conditions:</h3>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{quote.terms}</p>
        </div>
      </div>
    </div>
  )
}