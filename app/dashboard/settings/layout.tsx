'use client'

import { Suspense } from 'react'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Building2,
  Inbox,
  FileText,
  Briefcase,
  Package,
  Clock,
  DollarSign,
  StickyNote,
  Clipboard,
  BarChart3,
  Users,
  Plug,
  Lock,
  CreditCard,
  Calendar
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  { id: 'company', label: 'Company Information', icon: Building2 },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
  { id: 'invoice', label: 'Invoice Settings', icon: FileText },
  { id: 'jobs', label: 'Jobs Settings', icon: Briefcase },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: Package },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'labour-rates', label: 'Labour Rates', icon: DollarSign },
  { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
  { id: 'note-templates', label: 'Note Templates', icon: StickyNote },
  { id: 'price-list', label: 'Price List', icon: Clipboard },
  { id: 'pricing-levels', label: 'Pricing Levels', icon: BarChart3 },
  { id: 'staff-permissions', label: 'Staff & Permissions', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
]

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'company'

  return (
    <div className="flex gap-6 px-4 sm:px-6 lg:px-8">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div
          className="rounded-lg border p-4 sticky top-4"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT,
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
            Settings
          </h2>
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = section.id === activeTab
              const IconComponent = section.icon
              return (
                <Link
                  key={section.id}
                  href={`/dashboard/settings?tab=${section.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? colors.accent.DEFAULT : 'transparent',
                    color: isActive ? 'white' : colors.text.primary,
                  }}
                >
                  <IconComponent size={18} />
                  <span>{section.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl">
        {children}
      </div>
    </div>
  )
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    }>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  )
}
