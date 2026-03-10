'use client'

import { colors } from '@/lib/colors'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  CreditCard
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  { id: 'company', label: 'Company Information', icon: Building2, path: '/dashboard/settings/company' },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox, path: '/dashboard/settings/enquiries' },
  { id: 'invoice', label: 'Invoice Settings', icon: FileText, path: '/dashboard/settings/invoice' },
  { id: 'jobs', label: 'Jobs Settings', icon: Briefcase, path: '/dashboard/settings/jobs' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: Package, path: '/dashboard/settings/purchase-orders' },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, path: '/dashboard/settings/timesheets' },
  { id: 'labour-rates', label: 'Labour Rates', icon: DollarSign, path: '/dashboard/settings/labour-rates' },
  { id: 'note-templates', label: 'Note Templates', icon: StickyNote, path: '/dashboard/settings/note-templates' },
  { id: 'price-list', label: 'Price List', icon: Clipboard, path: '/dashboard/settings/price-list' },
  { id: 'pricing-levels', label: 'Pricing Levels', icon: BarChart3, path: '/dashboard/settings/pricing-levels' },
  { id: 'staff-permissions', label: 'Staff & Permissions', icon: Users, path: '/dashboard/settings/staff-permissions' },
  { id: 'integrations', label: 'Integrations', icon: Plug, path: '/dashboard/settings/integrations' },
  { id: 'security', label: 'Security', icon: Lock, path: '/dashboard/settings/security' },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, path: '/dashboard/settings/billing' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
              const isActive = pathname === section.path
              const IconComponent = section.icon
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? `${colors.accent.DEFAULT}15` : 'transparent',
                    color: isActive ? colors.accent.DEFAULT : colors.text.primary,
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
