'use client'

import { lazy, Suspense, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { colors } from '@/lib/colors'
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
  Loader2,
  Calendar
} from 'lucide-react'

// ✅ Lazy load each section - only loads when tab is active
const CompanySettings = lazy(() => import('./sections/CompanySettings'))
const EnquiriesSettings = lazy(() => import('./sections/EnquiriesSettings'))
const InvoiceSettings = lazy(() => import('./sections/InvoiceSettings'))
const JobsSettings = lazy(() => import('./sections/JobsSettings'))
const PurchaseOrdersSettings = lazy(() => import('./sections/PurchaseOrdersSettings'))
const TimesheetsSettings = lazy(() => import('./sections/TimesheetsSettings'))
const LabourRatesSettings = lazy(() => import('./sections/LabourRatesSettings'))
const NoteTemplatesSettings = lazy(() => import('./sections/NoteTemplatesSettings'))
const PriceListSettings = lazy(() => import('./sections/PriceListSettings'))
const PricingLevelsSettings = lazy(() => import('./sections/PricingLevelsSettings'))
const StaffPermissionsSettings = lazy(() => import('./sections/StaffPermissionsSettings'))
const IntegrationsSettings = lazy(() => import('./sections/IntegrationsSettings'))
const SecuritySettings = lazy(() => import('./sections/SecuritySettings'))
const BillingSettings = lazy(() => import('./sections/BillingSettings'))
const PaymentMethodsSettings = lazy(() => import('./sections/PaymentMethodsSettings'))
const SchedulerSettings = lazy(() => import('./sections/SchedulerSettings'))

const SETTINGS_SECTIONS = [
  { id: 'company', label: 'Company Information', icon: Building2, component: CompanySettings },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox, component: EnquiriesSettings },
  { id: 'invoice', label: 'Invoice Settings', icon: FileText, component: InvoiceSettings },
  { id: 'jobs', label: 'Jobs Settings', icon: Briefcase, component: JobsSettings },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: Package, component: PurchaseOrdersSettings },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar, component: SchedulerSettings },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, component: TimesheetsSettings },
  { id: 'labour-rates', label: 'Labour Rates', icon: DollarSign, component: LabourRatesSettings },
  { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, component: PaymentMethodsSettings },
  { id: 'note-templates', label: 'Note Templates', icon: StickyNote, component: NoteTemplatesSettings },
  { id: 'price-list', label: 'Price List', icon: Clipboard, component: PriceListSettings },
  { id: 'pricing-levels', label: 'Pricing Levels', icon: BarChart3, component: PricingLevelsSettings },
  { id: 'staff-permissions', label: 'Staff & Permissions', icon: Users, component: StaffPermissionsSettings },
  { id: 'integrations', label: 'Integrations', icon: Plug, component: IntegrationsSettings },
  { id: 'security', label: 'Security', icon: Lock, component: SecuritySettings },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, component: BillingSettings },
]

// ⚡ Loading skeleton component
function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'company'
  const [isPending, startTransition] = useTransition()
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  const activeSection = SETTINGS_SECTIONS.find(s => s.id === activeTab) || SETTINGS_SECTIONS[0]
  const ActiveComponent = activeSection.component

  // ⚡ Optimistic navigation with URL state
  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      router.push(`/dashboard/settings?tab=${tabId}`, { scroll: false })
    })
  }

  // 🚀 Prefetch on hover for instant feel
  const handleHover = (tabId: string) => {
    setHoveredTab(tabId)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Content Area */}
      <main className="flex-1 min-w-0">
        <div
          className="rounded-lg border p-6"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          {/* ⚡ Suspense boundary with skeleton */}
          <Suspense fallback={<SettingsSkeleton />}>
            {!isPending && <ActiveComponent />}
            {isPending && <SettingsSkeleton />}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
