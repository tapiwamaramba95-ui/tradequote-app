'use client'

import { colors } from '@/lib/colors'

export default function PaymentMethodsSettings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
        Payment Methods
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Configure accepted payment methods for your invoices.
      </p>
      <div className="rounded-lg border p-8 text-center" style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.DEFAULT
      }}>
        <p style={{ color: colors.text.secondary }}>Coming Soon</p>
      </div>
    </div>
  )
}
