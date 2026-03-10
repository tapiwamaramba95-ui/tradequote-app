'use client'

import Link from 'next/link'
import { colors } from '@/lib/colors'

export default function QuoteAcceptedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full p-4" style={{ backgroundColor: '#d4edda' }}>
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#28a745"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Thank You!
        </h1>
        
        <p className="text-lg mb-6" style={{ color: colors.text.secondary }}>
          Your quote has been accepted. We'll be in touch shortly to proceed with the next steps.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Our team will contact you soon to discuss the details and timeline.
          </p>
        </div>

        {/* Removed create invoice button for customer-facing page */}
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
