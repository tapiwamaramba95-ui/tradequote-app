'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/business'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Edit, Send, Check, X, Calendar, Clock, DollarSign, ArrowRight, Download, Printer, Eye, Mail } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/QuotePDF'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { EmailComposer } from '@/components/EmailComposer'

type Quote = any // Use the full Quote type from QuotePDF

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this quote? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'cancelled' })
        .eq('id', quote.id)

      if (!error) {
        alert('Quote cancelled successfully')
        fetchQuote() // Refresh
      } else {
        alert('Failed to cancel quote')
      }
    } catch (error) {
      alert('Error cancelling quote')
    } finally {
      setCancelling(false)
    }
  }

  const handleAccept = async () => {
    if (!confirm('Mark this quote as accepted?')) {
      return
    }

    setAccepting(true)
    try {
      // First, mark quote as accepted
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quote.id)

      if (error) {
        alert('Failed to accept quote')
        setAccepting(false)
        return
      }

      // Check if deposit is required
      const userId = quote.user_id
      if (userId) {
        const { data: settings } = await supabase
          .from('business_settings')
          .select('deposit_required, deposit_percentage')
          .eq('user_id', userId)
          .single()

        if (settings?.deposit_required) {
          const depositPercentage = settings.deposit_percentage || 30
          const depositAmount = (quote.total * depositPercentage / 100).toFixed(2)
          
          const createDeposit = confirm(
            `This job requires a ${depositPercentage}% deposit ($${depositAmount}).\\n\\nWould you like to create the deposit invoice now?`
          )

          if (createDeposit) {
            // Create deposit invoice
            const response = await fetch('/api/invoices/deposit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quote_id: quote.id })
            })

            const data = await response.json()

            if (response.ok) {
              alert(`Deposit invoice ${data.invoice.invoice_number} created successfully!`)
              router.push(`/dashboard/invoices/${data.invoice.id}`)
              return
            } else {
              alert(`Failed to create deposit invoice: ${data.error}`)
            }
          }
        }
      }

      alert('Quote marked as accepted successfully')
      fetchQuote() // Refresh
    } catch (error) {
      alert('Error accepting quote')
    } finally {
      setAccepting(false)
    }
  }

  const downloadPDF = () => {
    if (!quote) return
    
    setDownloading(true)
    
    // Create a hidden PDFDownloadLink and trigger it
    const tempDiv = document.createElement('div')
    tempDiv.style.display = 'none'
    document.body.appendChild(tempDiv)
    
    // Simulate PDF generation time
    setTimeout(() => {
      setDownloading(false)
      document.body.removeChild(tempDiv)
      
      // For now, just indicate that PDF download would happen
      // In practice, this would integrate with the existing QuotePDF component
      console.log('PDF download triggered for quote:', quote.quote_number)
    }, 1000)
  }

  const isEditable = quote?.status === 'draft' || quote?.status === 'sent' || quote?.status === 'declined'
  const isCancellable = quote?.status === 'accepted'
  const canAcceptManually = quote?.status === 'sent' || quote?.status === 'draft'

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const businessId = await getBusinessId()
      if (!businessId) {
        console.error('No business found for user')
        setLoading(false)
        return
      }

      console.log('Fetching quote:', params.id, 'for business:', businessId)

      // First, try to get the quote without filtering to see if it exists and what business_id it has
      const { data: checkData } = await supabase
        .from('quotes')
        .select('id, quote_number, business_id')
        .eq('id', params.id)
        .maybeSingle()

      if (checkData) {
        console.log('Quote exists:', checkData.quote_number, 'business_id:', checkData.business_id)
        
        // If business_id doesn't match, update it
        if (checkData.business_id !== businessId) {
          console.log('Updating quote business_id from', checkData.business_id, 'to', businessId)
          await supabase
            .from('quotes')
            .update({ business_id: businessId })
            .eq('id', checkData.id)
        }
      } else {
        console.log('Quote does not exist:', params.id)
      }

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!client_id (
            id,
            name,
            email,
            phone,
            street_address,
            suburb,
            state,
            postcode
          ),
          jobs!job_id (
            job_name,
            clients!client_id (
              id,
              name,
              email,
              phone,
              street_address,
              suburb,
              state,
              postcode
            )
          )
        `)
        .eq('id', params.id)
        .eq('business_id', businessId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching quote:', error, JSON.stringify(error))
        setLoading(false)
        return
      }

      if (!data) {
        console.error('Quote not found after business_id check/update')
        setLoading(false)
        return
      }

      // Quote found
      console.log('Quote found:', data.quote_number)
      setQuote(data)
      
      // Fetch business settings for branding using current user
      if (user.id) {
        const { data: settings } = await supabase
          .from('business_settings')
          .select('company_name, company_logo_url, primary_brand_color')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (settings) {
          setBusinessSettings(settings)
        }
      }
    } catch (err) {
      console.error('Exception fetching quote:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (emailData: { subject: string; body: string; sendCopy: boolean }) => {
    const client = quote.clients || quote.jobs?.clients
    const clientEmail = client?.email
    
    if (!clientEmail) {
      alert('Client has no email address')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/sendquote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          quoteNumber: quote.quote_number,
          customSubject: emailData.subject,
          customMessage: emailData.body,
          sendCopy: emailData.sendCopy,
        }),
      })

      if (response.ok) {
        const isResend = quote.status === 'sent'
        alert(isResend ? 'Quote resent successfully!' : 'Quote sent successfully!')
        
        // Update quote status to 'sent'
        await supabase
          .from('quotes')
          .update({ status: 'sent' })
          .eq('id', quote.id)
        
        setShowEmailComposer(false)
        fetchQuote() // Refresh
      } else {
        const errorText = await response.text()
        const isResend = quote.status === 'sent'
        alert(`Failed to ${isResend ? 'resend' : 'send'} email: ${errorText}`)
      }
    } catch (error) {
      const isResend = quote.status === 'sent'
      alert(`Error ${isResend ? 'resending' : 'sending'} email`)
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
    <div className="p-8 max-w-6xl mx-auto">
      <Breadcrumb items={[
        { label: 'Quotes', href: '/dashboard/quotes' },
        { label: `Quote #${quote.quote_number}` }
      ]} />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-lg mr-3"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.DEFAULT}, ${colors.accent.DEFAULT}CC)`
                }}
              >
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Quote #{quote.quote_number}
              </h1>
            </div>
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
            {/* Individual Action Buttons */}
            {canAcceptManually && (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.semantic.success }}
              >
                {accepting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Accepting...
                  </>
                ) : (
                  'Accept Quote'
                )}
              </button>
            )}

            {(quote.status === 'draft' || quote.status === 'sent') && (
              <>
                {quote.status === 'draft' && (
                  <button
                    onClick={() => router.push(`/dashboard/quotes/edit/${quote.id}`)}
                    className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all"
                    style={{
                      backgroundColor: colors.accent.DEFAULT,
                      color: 'white',
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Quote
                  </button>
                )}

                <button
                  onClick={() => setShowEmailComposer(true)}
                  disabled={sending}
                  className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {quote.status === 'sent' ? 'Resend Quote' : 'Send Quote'}
                </button>
              </>
            )}

            {quote.view_token && (
              <button
                onClick={() => window.open(`/quote/view/${quote.view_token}`, '_blank')}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.DEFAULT}`,
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Quote
              </button>
            )}

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all disabled:opacity-50"
              style={{
                borderColor: colors.border.DEFAULT,
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                border: `1px solid ${colors.border.DEFAULT}`,
              }}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Preview */}
      <div 
        className="shadow rounded-lg px-8 py-6 border"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-3xl font-bold" style={{ color: colors.text.primary }}>QUOTE</h2>
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Quote #{quote.quote_number}</p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Date: {new Date(quote.created_at).toLocaleDateString()}</p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</p>
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
                  <h2 className="text-3xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                    {businessSettings.company_name}
                  </h2>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Bill To:</h3>
          {(() => {
            const client = quote.clients || quote.jobs?.clients;
            return client ? (
              <>
                <p style={{ color: colors.text.primary }}>{client.name}</p>
                {client.email && <p className="text-sm" style={{ color: colors.text.secondary }}>{client.email}</p>}
                {client.phone && <p className="text-sm" style={{ color: colors.text.secondary }}>{client.phone}</p>}
                {(client.street_address || client.suburb || client.state || client.postcode) && (
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    {[client.street_address, client.suburb, client.state, client.postcode].filter(Boolean).join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-red-500">No client information available</p>
            );
          })()}
        </div>

        {quote.jobs && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Project:</h3>
            <p style={{ color: colors.text.primary }}>{quote.jobs.job_name}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0 mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Description</th>
                <th className="px-4 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Qty</th>
                <th className="px-4 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Rate</th>
                <th className="px-4 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.line_items?.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 border-b">
                  <td className="px-4 py-3 text-gray-900">{item.description || ''}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{item.quantity || 0}</td>
                  <td className="px-4 py-3 text-right text-gray-900">${(item.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-64 pr-4"> {/* Added padding to align with Amount column */}
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Subtotal:</span>
              <span>${(quote.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Tax:</span>
              <span>${(quote.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div 
              className="flex justify-between py-2 border-t-2 font-bold text-lg"
              style={{ 
                borderColor: colors.text.primary,
                color: colors.text.primary 
              }}
            >
              <span>Total:</span>
              <span style={{ color: colors.accent.DEFAULT }}>${(quote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
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
              {quote.notes}
            </div>
          </div>
        )}

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
            {quote.terms}
          </div>
        </div>
      </div>

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          onSend={handleSendEmail}
          type="quote"
          documentNumber={quote.quote_number}
          clientName={quote.clients?.name || quote.jobs?.clients?.name}
          clientEmail={quote.clients?.email || quote.jobs?.clients?.email}
          total={quote.total}
          companyName={businessSettings?.company_name}
        />
      )}
    </div>
  )
}