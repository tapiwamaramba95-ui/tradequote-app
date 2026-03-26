'use client'

import { useState } from 'react'
import { colors } from '@/lib/colors'

type ActionButtonsProps = {
  type: 'invoice' | 'quote' | 'job'
  id: string
  status?: string
  onActionComplete?: () => void
}

export function ActionButtons({ type, id, status, onActionComplete }: ActionButtonsProps) {
  const [loading, setLoading] = useState(false)

  const handleSendReminder = async () => {
    if (!confirm('Send payment reminder to client?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/actions/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id }),
      })

      if (response.ok) {
        alert('✅ Reminder sent successfully!')
        onActionComplete?.()
      } else {
        alert('❌ Failed to send reminder')
      }
    } catch (error) {
      alert('❌ Error sending reminder')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/actions/mark-invoice-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id }),
      })

      if (response.ok) {
        alert('✅ Invoice marked as paid!')
        onActionComplete?.()
      } else {
        alert('❌ Failed to mark invoice as paid')
      }
    } catch (error) {
      alert('❌ Error marking invoice as paid')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/actions/send-quote-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id }),
      })

      if (response.ok) {
        alert('✅ Follow-up sent successfully!')
        onActionComplete?.()
      } else {
        alert('❌ Failed to send follow-up')
      }
    } catch (error) {
      alert('❌ Error sending follow-up')
    } finally {
      setLoading(false)
    }
  }

  const handleExtendValidity = async () => {
    const days = prompt('Extend quote validity by how many days?', '7')
    if (!days) return

    setLoading(true)
    try {
      const response = await fetch('/api/actions/extend-quote-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id, daysToExtend: parseInt(days) }),
      })

      if (response.ok) {
        alert(`✅ Quote validity extended by ${days} days!`)
        onActionComplete?.()
      } else {
        alert('❌ Failed to extend validity')
      }
    } catch (error) {
      alert('❌ Error extending validity')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleWork = () => {
    window.location.href = `/dashboard/jobs/${id}`
  }

  // Invoice actions
  if (type === 'invoice') {
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSendReminder}
          disabled={loading}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-md text-base font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors min-h-11"
        >
          {loading ? 'Sending...' : 'Send Reminder'}
        </button>
        <button
          onClick={handleMarkPaid}
          disabled={loading}
          className="px-4 py-2.5 border-2 rounded-md text-base font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-11"
          style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
        >
          Mark Paid
        </button>
        <a
          href={`/dashboard/invoices/${id}`}
          className="px-4 py-2.5 border-2 rounded-md text-base font-semibold hover:bg-gray-50 transition-colors inline-block min-h-11 flex items-center"
          style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
        >
          View Invoice
        </a>
      </div>
    )
  }

  // Quote actions
  if (type === 'quote') {
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleFollowUp}
          disabled={loading}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-md text-base font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors min-h-11"
        >
          {loading ? 'Sending...' : 'Follow Up'}
        </button>
        <button
          onClick={handleExtendValidity}
          disabled={loading}
          className="px-4 py-2.5 border-2 rounded-md text-base font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-11"
          style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
        >
          Extend Validity
        </button>
        <a
          href={`/dashboard/quotes/${id}`}
          className="px-4 py-2.5 border-2 rounded-md text-base font-semibold hover:bg-gray-50 transition-colors inline-block min-h-11 flex items-center"
          style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
        >
          View Quote
        </a>
      </div>
    )
  }

  // Job actions
  if (type === 'job') {
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleScheduleWork}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-md text-base font-semibold hover:bg-blue-600 transition-colors min-h-11"
        >
          Schedule Work
        </button>
        <a
          href={`/dashboard/jobs/${id}`}
          className="px-4 py-2.5 border-2 rounded-md text-base font-semibold hover:bg-gray-50 transition-colors inline-block min-h-11 flex items-center"
          style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
        >
          View Job
        </a>
      </div>
    )
  }

  return null
}
