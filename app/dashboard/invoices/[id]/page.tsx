'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { DollarSign, Edit, Send, CheckCircle2, Download, Printer, AlertTriangle, ArrowRight, Eye, CreditCard, Mail, Receipt } from 'lucide-react'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { PaymentModal } from '@/components/PaymentModal'
import { EmailComposer } from '@/components/EmailComposer'

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
  sent_at?: string
  paid_at?: string
  payment_method?: string
  view_token?: string
  
  // Cost tracking fields
  material_cost?: number
  labour_cost?: number
  acquisition_cost?: number
  subcontractor_cost?: number
  total_cost?: number
  gross_profit?: number
  margin?: number
  
  jobs?: {
    job_name: string
    user_id: string
    clients?: {
      name: string
      email?: string
      phone?: string
      address?: string
    }
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          jobs!job_id (
            job_name,
            user_id,
            clients!client_id (
              name,
              email,
              phone,
              address
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (!invoiceError && invoiceData) {
        setInvoice(invoiceData)
        
        // Get user_id from invoice or job
        const userId = invoiceData.user_id || invoiceData.jobs?.user_id
        
        // Fix invoice user_id if it's missing but job has one
        if (!invoiceData.user_id && invoiceData.jobs?.user_id) {
          supabase
            .from('invoices')
            .update({ user_id: invoiceData.jobs.user_id })
            .eq('id', invoiceData.id)
            .then(() => console.log('Fixed invoice user_id'))
        }
        
        if (userId) {
          // Fetch business settings including bank details
          const { data: settings } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle() // Use maybeSingle to handle no results
          
          if (settings) {
            setBusinessSettings(settings)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (emailData: { subject: string; body: string; sendCopy: boolean }) => {
    if (!invoice?.jobs?.clients?.email) {
      alert('Client has no email address')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/sendinvoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.jobs.clients.email,
          invoiceNumber: invoice.invoice_number,
          customSubject: emailData.subject,
          customMessage: emailData.body,
          sendCopy: emailData.sendCopy,
        }),
      })

      if (response.ok) {
        alert('Invoice sent successfully!')
        
        await supabase
          .from('invoices')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', invoice.id)
        
        setShowEmailComposer(false)
        fetchInvoice()
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      alert('Error sending email')
    } finally {
      setSending(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!invoice) return

    const paymentMethod = prompt('Payment method (e.g., Cash, Bank Transfer, Card):')
    if (!paymentMethod) return

    setMarkingPaid(true)

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          amount_paid: invoice.total,
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod
        })
        .eq('id', invoice.id)

      if (error) {
        alert('Failed to mark as paid')
      } else {
        // Update job status to paid if invoice has a job_id
        if (invoice.job_id) {
          await supabase
            .from('jobs')
            .update({ status: 'paid' })
            .eq('id', invoice.job_id)
        }
        alert('Invoice marked as paid!')
        fetchInvoice()
      }
    } catch (error) {
      alert('Error updating invoice')
    } finally {
      setMarkingPaid(false)
    }
  }

  const fetchPayments = async () => {
    if (!invoice?.id) return
    
    try {
      const response = await fetch(`/api/payments?invoice_id=${invoice.id}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const handlePaymentRecorded = () => {
    fetchInvoice()
    fetchPayments()
  }

  useEffect(() => {
    if (invoice?.id) {
      fetchPayments()
    }
  }, [invoice?.id])

  const invoiceLabel = invoice?.invoice_number || String(params.id ?? '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
            Invoice not found
          </h3>
          <Link href="/dashboard/invoices" className="text-sm hover:underline" style={{ color: colors.accent.DEFAULT }}>
            Back to Invoices
          </Link>
        </div>
      </div>
    )
  }

  const statusColor = invoice.status === 'paid' ? colors.semantic.success :
                      invoice.status === 'partial' ? colors.semantic.warning :
                      invoice.status === 'overdue' ? colors.semantic.error :
                      invoice.status === 'sent' || invoice.status === 'viewed' ? colors.semantic.info :
                      colors.text.muted

  const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: `Invoice #${invoice.invoice_number}` }
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
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Invoice #{invoice.invoice_number}
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Created {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                }}
              >
                {invoice.status}
              </span>
              {isOverdue && invoice.status !== 'paid' && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${colors.semantic.error}15`,
                    color: colors.semantic.error,
                  }}
                >
                  OVERDUE
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {/* Edit Invoice - only for draft and sent */}
            {(invoice.status === 'draft' || invoice.status === 'sent') && (
              <Link
                href={`/dashboard/invoices/edit/${invoice.id}`}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all"
                style={{ backgroundColor: colors.semantic.warning }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Link>
            )}

            {/* View Invoice */}
            {invoice.view_token && (
              <button
                onClick={() => window.open(`/invoice/view/${invoice.view_token}`, '_blank')}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.DEFAULT}`,
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Invoice
              </button>
            )}

            {invoice.status !== 'paid' && (
              <>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.DEFAULT}`,
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </button>

                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: colors.semantic.success }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Paid
                </button>
              </>
            )}


            {invoice.status === 'draft' && (
              <button
                onClick={() => setShowEmailComposer(true)}
                disabled={sending}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div
        className="shadow rounded-lg px-8 py-6 border"
        style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT,
        }}
      >
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-3xl font-bold" style={{ color: colors.text.primary }}>INVOICE</h2>
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Invoice #{invoice.invoice_number}</p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
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

        {invoice.jobs?.clients && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Bill To:</h3>
            <p style={{ color: colors.text.primary }}>{invoice.jobs.clients.name}</p>
            {invoice.jobs.clients.email && <p className="text-sm" style={{ color: colors.text.secondary }}>{invoice.jobs.clients.email}</p>}
            {invoice.jobs.clients.phone && <p className="text-sm" style={{ color: colors.text.secondary }}>{invoice.jobs.clients.phone}</p>}
            {invoice.jobs.clients.address && <p className="text-sm" style={{ color: colors.text.secondary }}>{invoice.jobs.clients.address}</p>}
          </div>
        )}

        {invoice.jobs && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>Project:</h3>
            <p style={{ color: colors.text.primary }}>{invoice.jobs.job_name}</p>
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
              {invoice.line_items.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 border-b">
                  <td className="px-4 py-3 text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-900">${item.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-64 pr-4"> {/* Added padding to align with Amount column */}
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2" style={{ color: colors.text.primary }}>
              <span>Tax:</span>
              <span>${invoice.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between py-2" style={{ color: colors.semantic.success }}>
                <span>Paid:</span>
                <span>-${invoice.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div
              className="flex justify-between py-2 border-t-2 font-bold text-lg"
              style={{
                borderColor: colors.text.primary,
                color: colors.text.primary
              }}
            >
              <span>{invoice.status === 'paid' ? 'Paid' : 'Amount Due'}:</span>
              <span style={{ color: invoice.status === 'paid' ? colors.semantic.success : colors.accent.DEFAULT }}>
                ${(invoice.total - (invoice.amount_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

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

        {/* Bank Account Details - Bottom Left */}
        {invoice.status !== 'paid' && businessSettings && (businessSettings.bank_name || businessSettings.bsb || businessSettings.account_number) && (
          <div className="mt-12 text-left">
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
        )}

        {/* Payment Info */}
        {invoice.paid_at && (
          <div
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: `${colors.semantic.success}10` }}
          >
            <p className="text-sm font-medium" style={{ color: colors.semantic.success }}>
              ✓ Paid on {new Date(invoice.paid_at).toLocaleDateString()}
              {invoice.payment_method && ` via ${invoice.payment_method}`}
            </p>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>
              Payment History
            </h3>
            <div 
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: colors.border.DEFAULT }}
            >
              <table className="min-w-full">
                <thead style={{ backgroundColor: colors.background.main }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Reference
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr 
                      key={payment.id} 
                      className="border-t"
                      style={{ 
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: idx % 2 === 0 ? colors.background.card : colors.background.main
                      }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>
                        {payment.payment_method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: colors.text.secondary }}>
                        {payment.reference_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: colors.semantic.success }}>
                        ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: colors.background.main }}>
                  <tr className="border-t-2" style={{ borderColor: colors.border.DEFAULT }}>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold" style={{ color: colors.text.primary }}>
                      Total Paid
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: colors.semantic.success }}>
                      ${(invoice.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {(invoice.total - (invoice.amount_paid || 0)) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-semibold" style={{ color: colors.text.primary }}>
                        Balance Due
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-bold" style={{ color: colors.accent.DEFAULT }}>
                        ${(invoice.total - (invoice.amount_paid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Margin Tracking Section */}
      {invoice.total_cost !== null && invoice.total_cost !== undefined && (
        <div
          className="mt-6 shadow rounded-lg px-8 py-6 border"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              💰 Profit & Margin Analysis
            </h3>
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              Cost breakdown and profitability metrics
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Material Cost */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Material Cost
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                ${(invoice.material_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Labour Cost */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Labour Cost
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                ${(invoice.labour_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Acquisition Cost (CAC) */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Acquisition Cost
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                ${(invoice.acquisition_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                (M&Q time)
              </div>
            </div>

            {/* Subcontractor Cost */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Subcontractor
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                ${(invoice.subcontractor_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Cost */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Total Cost
                </div>
                <div className="text-3xl font-bold" style={{ color: colors.semantic.error }}>
                  ${(invoice.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Gross Profit */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Gross Profit
                </div>
                <div className="text-3xl font-bold" style={{ 
                  color: (invoice.gross_profit || 0) > 0 ? colors.semantic.success : colors.semantic.error 
                }}>
                  ${(invoice.gross_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Margin % */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Profit Margin
                </div>
                <div className="text-3xl font-bold" style={{ 
                  color: (invoice.margin || 0) > 30 ? colors.semantic.success : 
                         (invoice.margin || 0) > 15 ? colors.semantic.warning : 
                         colors.semantic.error 
                }}>
                  {(invoice.margin || 0).toFixed(1)}%
                </div>
                <div className="text-xs mt-2" style={{ color: colors.text.secondary }}>
                  {(invoice.margin || 0) > 30 ? '🎯 Excellent!' : 
                   (invoice.margin || 0) > 15 ? '📊 Good' : 
                   '⚠️ Below target (aim for 30%)'}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue vs Cost Breakdown */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: colors.border.DEFAULT }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold" style={{ color: colors.text.secondary }}>
                Revenue (Invoice Total):
              </span>
              <span className="font-bold text-lg" style={{ color: colors.accent.DEFAULT }}>
                ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="font-semibold" style={{ color: colors.text.secondary }}>
                Total Costs:
              </span>
              <span className="font-bold text-lg" style={{ color: colors.semantic.error }}>
                -${(invoice.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t" style={{ borderColor: colors.border.DEFAULT }}>
              <span className="font-bold" style={{ color: colors.text.primary }}>
                Net Profit:
              </span>
              <span className="font-bold text-xl" style={{ 
                color: (invoice.gross_profit || 0) > 0 ? colors.semantic.success : colors.semantic.error 
              }}>
                ${(invoice.gross_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="text-sm font-medium" style={{ color: '#1e40af' }}>
              💡 How margin tracking works
            </p>
            <ul className="text-xs mt-2 space-y-1" style={{ color: '#1e3a8a' }}>
              <li>• Material costs are pulled from your price list (supplier products)</li>
              <li>• Labour costs are calculated from timesheets logged by staff (uses their hourly rate)</li>
              <li>• Acquisition cost (CAC) includes M&Q time proportionally allocated to this invoice</li>
              <li>• Margin is calculated as: (Revenue - Total Costs) ÷ Revenue × 100</li>
            </ul>
          </div>
        </div>
      )}

      {/* No Cost Data Available */}
      {(invoice.total_cost === null || invoice.total_cost === undefined) && (
        <div
          className="mt-6 shadow rounded-lg px-8 py-6 border"
          style={{
            backgroundColor: '#fef3c7',
            borderColor: '#fcd34d',
          }}
        >
          <div className="flex items-start">
            <svg className="h-6 w-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#f59e0b' }}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#78350f' }}>
                Margin Tracking Not Available Yet
              </h3>
              <p className="text-sm mb-3" style={{ color: '#78350f' }}>
                Cost data will be calculated automatically when:
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#92400e' }}>
                <li>✓ Line items are linked to supplier products (from price list)</li>
                <li>✓ Staff members log timesheets with their hourly rates set</li>
                <li>✓ M&Q time is tracked on related enquiries/quotes</li>
              </ul>
              <p className="text-sm mt-4" style={{ color: '#78350f' }}>
                <Link href="/dashboard/analytics" className="underline font-semibold">
                  View Analytics Dashboard
                </Link>
                {' '}to see margin tracking across all jobs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          onSend={handleSendEmail}
          type="invoice"
          documentNumber={invoice.invoice_number}
          clientName={invoice.jobs?.clients?.name}
          clientEmail={invoice.jobs?.clients?.email}
          total={invoice.total}
          companyName={businessSettings?.company_name}
        />
      )}

      {/* Payment Modal */}
      {invoice && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={{
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            total: invoice.total,
            amount_paid: invoice.amount_paid || 0
          }}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  )
}