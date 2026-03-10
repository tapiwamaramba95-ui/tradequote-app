'use client'

import Link from 'next/link'
import { colors } from '@/lib/colors'

export default function QuoteDeclinedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-md w-full text-center">
        {/* Info Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full p-4" style={{ backgroundColor: '#fff3cd' }}>
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#856404"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Thank You for Considering Us
        </h1>
        
        <p className="text-lg mb-6" style={{ color: colors.text.secondary }}>
          We're sorry to hear you've decided to decline this quote.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            If you'd like to discuss alternatives or have any questions, please don't hesitate to reach out.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-white"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
