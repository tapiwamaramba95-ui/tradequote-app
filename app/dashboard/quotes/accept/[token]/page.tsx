'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'

export default function AcceptQuotePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    verifyAndAccept()
  }, [])

  const verifyAndAccept = async () => {
    const token = params.token as string

    try {
      // Find quote by token
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          jobs!job_id (
            id,
            job_name,
            clients!client_id (
              name,
              email
            )
          )
        `)
        .eq('acceptance_token', token)
        .single()

      if (quoteError || !quoteData) {
        setError('Invalid or expired quote link')
        setLoading(false)
        return
      }

      // Check if token is expired
      const expiresAt = new Date(quoteData.token_expires_at)
      if (expiresAt < new Date()) {
        setError('This quote link has expired. Please contact us for a new quote.')
        setLoading(false)
        return
      }

      // Check if already accepted/rejected
      if (quoteData.status === 'accepted') {
        setQuote(quoteData)
        setSuccess(true)
        setLoading(false)
        return
      }

      if (quoteData.status === 'rejected') {
        setError('This quote has already been declined.')
        setLoading(false)
        return
      }

      // Update quote status to accepted
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteData.id)

      if (updateError) {
        setError('Failed to accept quote. Please try again.')
        setLoading(false)
        return
      }

      // Update job status to approved
      await supabase
        .from('jobs')
        .update({ status: 'approved' })
        .eq('id', quoteData.jobs.id)

      setQuote(quoteData)
      setSuccess(true)
      setLoading(false)

    } catch (err) {
      setError('Something went wrong. Please contact us directly.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent.DEFAULT }}></div>
          <p style={{ color: colors.text.secondary }}>Processing your response...</p>
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
              Unable to Process
            </h1>
            <p className="mb-6" style={{ color: colors.text.secondary }}>
              {error}
            </p>
            <p className="text-sm" style={{ color: colors.text.muted }}>
              If you need assistance, please contact us directly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success && quote) {
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
            {/* Success Icon */}
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
                Quote Accepted!
              </h1>
              <p className="text-lg" style={{ color: colors.text.secondary }}>
                Thank you for accepting our quote
              </p>
            </div>

            {/* Quote Details */}
            <div 
              className="rounded-lg p-6 mb-6"
              style={{ 
                backgroundColor: colors.background.main,
                borderLeft: `4px solid ${colors.accent.DEFAULT}` 
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Quote Number
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    {quote.quote_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Project
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    {quote.jobs.job_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                    ${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                    Client
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    {quote.jobs.clients.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div 
              className="rounded-lg p-6"
              style={{ backgroundColor: `${colors.accent.DEFAULT}08` }}
            >
              <h2 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>
                What Happens Next?
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: colors.text.secondary }}>
                    You'll receive a confirmation email shortly
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: colors.text.secondary }}>
                    Our team will contact you to schedule the work
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: colors.text.secondary }}>
                    We'll send you an invoice for the deposit
                  </span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: colors.text.muted }}>
                Have questions? Reply to the quote email or contact us directly.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: colors.text.muted }}>
              Powered by <span className="font-semibold" style={{ color: colors.accent.DEFAULT }}>TradeQuote</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}