'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { colors } from '@/lib/colors'

export default function DeclineQuotePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    verifyToken()
  }, [])

  const verifyToken = async () => {
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
        setError('This quote link has expired.')
        setLoading(false)
        return
      }

      // Check if already accepted
      if (quoteData.status === 'accepted') {
        setError('This quote has already been accepted and cannot be declined.')
        setLoading(false)
        return
      }

      // Check if already rejected
      if (quoteData.status === 'rejected') {
        setQuote(quoteData)
        setSuccess(true)
        setLoading(false)
        return
      }

      setQuote(quoteData)
      setLoading(false)

    } catch (err) {
      setError('Something went wrong. Please contact us directly.')
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!quote) return

    setSubmitting(true)

    try {
      // Update quote status to rejected
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: feedback || null
        })
        .eq('id', quote.id)

      if (updateError) {
        alert('Failed to decline quote. Please try again.')
        setSubmitting(false)
        return
      }

      // Update job status to cancelled
      await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', quote.jobs.id)

      setSuccess(true)
      setSubmitting(false)

    } catch (err) {
      alert('Something went wrong. Please contact us directly.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent.DEFAULT }}></div>
          <p style={{ color: colors.text.secondary }}>Loading...</p>
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
              Thank you for letting us know.
            </p>
            <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
              We appreciate your consideration. If you'd like to discuss alternative options or have any questions, please don't hesitate to reach out.
            </p>
            <div 
              className="rounded-lg p-4 text-left"
              style={{ backgroundColor: colors.background.main }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Quote Number
              </p>
              <p className="font-semibold" style={{ color: colors.text.primary }}>
                {quote.quote_number}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (quote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: colors.background.main }}>
        <div className="max-w-md w-full">
          <div 
            className="rounded-lg p-8 border"
            style={{ 
              backgroundColor: colors.background.card,
              borderColor: colors.border.DEFAULT 
            }}
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Decline Quote
              </h1>
              <p style={{ color: colors.text.secondary }}>
                We're sorry this quote didn't meet your needs
              </p>
            </div>

            {/* Quote Info */}
            <div 
              className="rounded-lg p-4 mb-6"
              style={{ 
                backgroundColor: colors.background.main,
                borderLeft: `4px solid ${colors.semantic.warning}` 
              }}
            >
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
                    Quote Number
                  </p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>
                    {quote.quote_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
                    Project
                  </p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>
                    {quote.jobs.job_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
                    Amount
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.accent.DEFAULT }}>
                    ${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Help us improve (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Let us know why this quote didn't work for you..."
                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
              <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                Your feedback helps us provide better service
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-md text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: colors.semantic.error,
                  color: '#ffffff',
                }}
              >
                {submitting ? 'Processing...' : 'Confirm Decline'}
              </button>
              
              <p className="text-center text-xs" style={{ color: colors.text.muted }}>
                Changed your mind?{' '}
                <a 
                  href={`/quote/accept/${params.token}`}
                  className="font-medium hover:underline"
                  style={{ color: colors.accent.DEFAULT }}
                >
                  Accept this quote instead
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: colors.text.muted }}>
              Questions? Reply to the quote email
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}