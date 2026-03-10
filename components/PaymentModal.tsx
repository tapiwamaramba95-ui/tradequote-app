'use client'

import { useState } from 'react'
import { colors } from '@/lib/colors'

type PaymentModalProps = {
  isOpen: boolean
  onClose: () => void
  invoice: {
    id: string
    invoice_number: string
    total: number
    amount_paid: number
  }
  onPaymentRecorded: () => void
}

export function PaymentModal({ isOpen, onClose, invoice, onPaymentRecorded }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const remainingBalance = invoice.total - (invoice.amount_paid || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const paymentAmount = parseFloat(amount)
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (paymentAmount > remainingBalance) {
      setError(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`)
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: paymentAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      // Reset form
      setAmount('')
      setReferenceNumber('')
      setNotes('')
      
      // Notify parent and close
      onPaymentRecorded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickFill = () => {
    setAmount(remainingBalance.toFixed(2))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md rounded-lg shadow-xl"
          style={{ backgroundColor: colors.background.card }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                Record Payment
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              Invoice #{invoice.invoice_number}
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: colors.background.main }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: colors.text.secondary }}>Invoice Total:</span>
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: colors.text.secondary }}>Already Paid:</span>
                <span className="font-medium" style={{ color: colors.semantic.success }}>
                  ${(invoice.amount_paid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: colors.border.DEFAULT }}>
                <span className="font-medium" style={{ color: colors.text.primary }}>Remaining Balance:</span>
                <span className="font-bold text-lg" style={{ color: colors.accent.DEFAULT }}>
                  ${remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{
                backgroundColor: '#fee',
                color: '#c00',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Payment Amount *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-md border text-sm"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        backgroundColor: colors.background.card,
                        color: colors.text.primary,
                      }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="px-3 py-2 rounded-md text-sm border"
                    style={{
                      borderColor: colors.border.DEFAULT,
                      color: colors.accent.DEFAULT
                    }}
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                  placeholder="Transaction ID, cheque number, etc."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium border"
                style={{
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                {saving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
