// Subscription access control utilities

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'deleted'

export interface SubscriptionState {
  status: SubscriptionStatus
  isActive: boolean
  isExpired: boolean
  isInGracePeriod: boolean
  canAccess: boolean
  isReadOnly: boolean
  daysRemaining: number | null
  accessUntil: Date | null
  trialEndsAt: Date | null
}

/**
 * Check user's subscription status and access level
 */
export function checkSubscriptionAccess(profile: any): SubscriptionState {
  const now = new Date()
  const status = profile?.subscription_status || 'trial'
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const accessUntil = profile?.access_until ? new Date(profile.access_until) : null

  // Calculate days remaining in trial
  let daysRemaining = null
  if (trialEndsAt && status === 'trial') {
    const diff = trialEndsAt.getTime() - now.getTime()
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  // Active subscription or trial
  const isActive = status === 'active' || (status === 'trial' && trialEndsAt !== null && trialEndsAt > now)

  // Cancelled and in grace period (30 days after cancellation)
  const isInGracePeriod = status === 'cancelled' && accessUntil !== null && accessUntil > now

  // Trial expired or past grace period
  const isExpired = (status === 'trial' && trialEndsAt !== null && trialEndsAt < now) ||
                    (status === 'cancelled' && accessUntil !== null && accessUntil < now) ||
                    status === 'deleted'

  // Can access the dashboard
  const canAccess = isActive || isInGracePeriod

  // In read-only mode (grace period only)
  const isReadOnly = isInGracePeriod

  return {
    status,
    isActive,
    isExpired,
    isInGracePeriod,
    canAccess,
    isReadOnly,
    daysRemaining,
    accessUntil,
    trialEndsAt,
  }
}

/**
 * Get friendly message based on subscription state
 */
export function getSubscriptionMessage(state: SubscriptionState): {
  title: string
  message: string
  action: string
  actionUrl: string
} | null {
  if (state.isActive) {
    return null // No message needed
  }

  if (state.isInGracePeriod) {
    const daysLeft = state.accessUntil 
      ? Math.ceil((state.accessUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      title: '⚠️ Your trial has ended',
      message: `You have ${daysLeft} days of read-only access remaining. Choose a plan to continue creating jobs, quotes, and invoices.`,
      action: 'Choose a Plan',
      actionUrl: '/dashboard/settings/billing/upgrade',
    }
  }

  if (state.isExpired) {
    return {
      title: '❌ Subscription Expired',
      message: 'Your access period has ended. Reactivate your account to restore access to all your data.',
      action: 'Reactivate Account',
      actionUrl: '/dashboard/settings/billing/reactivate',
    }
  }

  return null
}

/**
 * Format days remaining message
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Trial ends today'
  if (days === 1) return '1 day remaining'
  return `${days} days remaining`
}
