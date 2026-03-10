'use client'

import { colors } from '@/lib/colors'
import Link from 'next/link'

export default function CancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background.main }}>
      <div className="max-w-lg w-full bg-white rounded-2xl p-12 shadow-sm text-center">
        <div className="text-6xl mb-6">😢</div>
        
        <h1 className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
          We've Cancelled Your Subscription
        </h1>
        
        <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
          Sorry to see you go!
        </p>

        <div className="rounded-xl p-6 mb-8 text-left" style={{ backgroundColor: `${colors.accent.DEFAULT}10`, border: `2px solid ${colors.accent.DEFAULT}30` }}>
          <h3 className="font-semibold mb-3" style={{ color: colors.text.primary }}>🗓️ What happens now:</h3>
          <ul className="space-y-2 text-sm" style={{ color: colors.text.secondary }}>
            <li>• You can access your data (read-only) for 30 days</li>
            <li>• You can export everything from Settings</li>
            <li>• Reactivate anytime to keep all your data</li>
            <li>• After 30 days, all data will be permanently deleted</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/settings/export"
            className="px-6 py-3 text-white rounded-lg font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            Export My Data
          </Link>
          
          <Link
            href="/dashboard/settings/billing/reactivate"
            className="px-6 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            style={{ borderColor: colors.border.DEFAULT, color: colors.text.primary }}
          >
            Reactivate Account
          </Link>
        </div>

        <p className="text-sm mt-8" style={{ color: colors.text.secondary }}>
          Questions? Reply to our cancellation email.
        </p>
      </div>
    </div>
  )
}
