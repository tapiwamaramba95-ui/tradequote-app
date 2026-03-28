'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { colors, getStatusColor } from '../../lib/colors'
import { getCurrentUserPermissions, isBusinessOwner, PermissionKey } from '@/lib/permissions/check'
import { StaffPermissions } from '@/lib/permissions/types'
import { checkSubscriptionAccess, getSubscriptionMessage, SubscriptionState } from '@/lib/subscription'
import { ReadOnlyProvider } from '@/lib/contexts/ReadOnlyContext'
import { ErrorBoundaryWithReset } from '@/components/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        
        // Load user profile information with subscription fields
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, company_name, email, subscription_status, trial_ends_at, access_until, cancelled_at')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
        
        // Check subscription access
        const subState = checkSubscriptionAccess(profileData)
        setSubscriptionState(subState)
        
        // Redirect if expired and not on billing pages
        if (subState.isExpired && !pathname.includes('/billing')) {
          router.push('/dashboard/settings/billing/expired')
          return
        }
        
        // Load permissions
        const userPermissions = await getCurrentUserPermissions()
        setPermissions(userPermissions)
        
        const ownerStatus = await isBusinessOwner()
        setIsOwner(ownerStatus)
        
        setLoading(false)
      }
    }

    checkUser()
    
    // Listen for auth state changes to update profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, company_name, email, subscription_status, trial_ends_at, access_until, cancelled_at')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
        
        // Check subscription access
        const subState = checkSubscriptionAccess(profileData)
        setSubscriptionState(subState)
        
        // Reload permissions
        const userPermissions = await getCurrentUserPermissions()
        setPermissions(userPermissions)
        
        const ownerStatus = await isBusinessOwner()
        setIsOwner(ownerStatus)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent.DEFAULT }}></div>
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard',
      permission: null, // Always visible
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Jobs', 
      href: '/dashboard/jobs',
      permission: 'jobs' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      name: 'Recurring Jobs', 
      href: '/dashboard/recurring-jobs',
      permission: 'jobs' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      name: 'Enquiries',
      href: '/dashboard/enquiries',
      permission: 'enquiries' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Clients', 
      href: '/dashboard/clients',
      permission: null, // Generally accessible
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Connections', 
      href: '/dashboard/connections',
      permission: null, // Generally accessible - unlimited in all plans
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    { 
      name: 'Quotes', 
      href: '/dashboard/quotes',
      permission: 'quoting' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Invoices', 
      href: '/dashboard/invoices',
      permission: 'invoicing' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      )
    },
    { 
      name: 'Schedule', 
      href: '/dashboard/schedule',
      permission: 'scheduling_dispatch' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Purchase Orders',
      href: '/dashboard/purchase-orders',
      permission: 'purchases' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M7 21h10M7 3h10v4H7z" />
        </svg>
      )
    },
    {
      name: 'Suppliers',
      href: '/dashboard/suppliers',
      permission: 'purchases' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      )
    },
    {
      name: 'Timesheets',
      href: '/dashboard/timesheets',
      permission: 'timesheets' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M8 3h8v4H8zM5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      permission: 'reports_financials' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      permission: 'settings' as PermissionKey,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
  ]

  // Filter navigation by permissions
  const filteredNavigation = navigation.filter(item => {
    // Always show items with no permission requirement
    if (!item.permission) return true
    
    // Owners see everything
    if (isOwner) return true
    
    // Check if user has the required permission
    if (permissions && item.permission) {
      return permissions[item.permission]
    }
    
    // Hide by default if permissions not loaded yet
    return false
  })

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <ReadOnlyProvider>
      <div className="min-h-screen flex" style={{ backgroundColor: colors.background.main }}>
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex-shrink-0`}
        style={{ backgroundColor: colors.background.sidebar }}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {sidebarOpen ? (
              <h1 className="text-2xl font-bold text-white tracking-wide">TRADEQUOTE</h1>
            ) : (
              <span className="text-2xl font-bold text-white">TQ</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/60 hover:text-white p-2 rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-md transition-all min-h-11 ${
                    active 
                      ? 'text-white font-semibold' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? {
                    backgroundColor: colors.accent.light,
                    borderLeft: `3px solid ${colors.accent.DEFAULT}`,
                    paddingLeft: '0.875rem'
                  } : {}}
                >
                  <span className="flex-shrink-0" style={{ color: active ? colors.accent.DEFAULT : 'inherit' }}>
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center space-x-3 px-3 py-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-base" style={{ backgroundColor: colors.accent.DEFAULT }}>
                {profile?.full_name?.[0]?.toUpperCase() || profile?.company_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-white truncate">
                    {profile?.full_name || profile?.company_name || user?.email?.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'User'}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header 
          className="h-20 flex items-center justify-between px-6 border-b"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          <div className="flex items-center space-x-4">
            {/* Page name removed - displayed in page content below */}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2.5 rounded-md text-base w-64 transition-colors h-11"
                style={{
                  backgroundColor: colors.background.main,
                  border: `1px solid ${colors.border.DEFAULT}`,
                  color: colors.text.primary
                }}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: colors.text.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Notifications */}
            <button className="p-2.5 rounded-md hover:bg-gray-100 transition-colors relative min-h-11 min-w-11 flex items-center justify-center">
              <svg className="h-6 w-6" style={{ color: colors.text.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.semantic.error }}></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Subscription Warning Banner */}
          {subscriptionState && !subscriptionState.isActive && subscriptionState.canAccess && (() => {
            const message = getSubscriptionMessage(subscriptionState)
            return message ? (
              <div className="mx-6 mt-6 mb-0 p-4 rounded-lg border-l-4" style={{ 
                backgroundColor: '#fff3cd', 
                borderColor: '#ff9800',
                border: '1px solid #ffc107',
                borderLeftWidth: '4px'
              }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{message.title}</h3>
                    <p className="text-sm text-gray-700 mb-3">{message.message}</p>
                    <Link
                      href={message.actionUrl}
                      className="inline-block px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: colors.accent.DEFAULT }}
                    >
                      {message.action}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null
          })()}
          
          <div className="p-6">
            <ErrorBoundaryWithReset>
              {children}
            </ErrorBoundaryWithReset>
          </div>
        </main>
      </div>
    </div>
    </ReadOnlyProvider>
  )
}