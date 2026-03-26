'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { checkSubscriptionAccess, SubscriptionState } from '@/lib/subscription'

interface ReadOnlyContextValue {
  isReadOnly: boolean
  subscriptionState: SubscriptionState | null
  loading: boolean
}

const ReadOnlyContext = createContext<ReadOnlyContextValue>({
  isReadOnly: false,
  subscriptionState: null,
  loading: true,
})

export function useReadOnly() {
  return useContext(ReadOnlyContext)
}

export function ReadOnlyProvider({ children }: { children: React.ReactNode }) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubscriptionState = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at, access_until, cancelled_at')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          const state = checkSubscriptionAccess(profileData)
          setSubscriptionState(state)
        }
      }
      
      setLoading(false)
    }

    loadSubscriptionState()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSubscriptionState()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ReadOnlyContext.Provider
      value={{
        isReadOnly: subscriptionState?.isReadOnly || false,
        subscriptionState,
        loading,
      }}
    >
      {children}
    </ReadOnlyContext.Provider>
  )
}

/**
 * Component wrapper that shows a message when in read-only mode
 * Use this to wrap buttons or forms that shouldn't be editable
 */
export function ReadOnlyGuard({ 
  children, 
  showMessage = true,
  message = "This action is disabled during your grace period. Choose a plan to continue."
}: { 
  children: React.ReactNode
  showMessage?: boolean
  message?: string
}) {
  const { isReadOnly } = useReadOnly()

  if (!isReadOnly) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-sm max-w-xs">
            <p className="text-sm text-yellow-800">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
