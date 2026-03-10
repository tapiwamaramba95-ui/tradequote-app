'use client'

import { colors } from '@/lib/colors'

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: colors.text.primary }}>
          Payment Methods
        </h1>
        <div className="rounded-lg shadow-sm p-8" style={{ backgroundColor: colors.background.card }}>
          <p style={{ color: colors.text.secondary }}>Coming Soon</p>
        </div>
      </div>
    </div>
  )
}
