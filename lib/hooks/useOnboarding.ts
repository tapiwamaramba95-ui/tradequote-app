'use client'

import { useEffect, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Auto-completion hook for onboarding progress
 * Automatically updates progress when certain actions are completed
 */
export function useOnboardingAutoCompletion() {
  
  const updateProgress = useCallback(async (step: string, completed: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Ensure progress record exists
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          account_created: true,
          [step]: completed
        }, {
          onConflict: 'user_id'
        })

    } catch (error) {
      console.error('Error updating onboarding progress:', error)
    }
  }, [])

  const checkBusinessDetailsCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('business_name, business_type')
        .eq('id', user.id)
        .single()

      if (profile?.business_name && profile?.business_type) {
        await updateProgress('business_details_added', true)
      }
    } catch (error) {
      console.error('Error checking business details:', error)
    }
  }, [updateProgress])

  const checkCompanyProfileCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('business_name, abn, business_address, logo_url')
        .eq('id', user.id)
        .single()

      if (profile?.business_name && profile?.abn && profile?.business_address) {
        await updateProgress('company_profile_completed', true)
      }
    } catch (error) {
      console.error('Error checking company profile:', error)
    }
  }, [updateProgress])

  const checkInvoiceSettingsCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('bank_account_name, bsb, account_number, payment_terms')
        .eq('user_id', user.id)
        .single()

      if (settings?.bank_account_name && settings?.bsb && settings?.account_number) {
        await updateProgress('invoice_settings_completed', true)
      }
    } catch (error) {
      console.error('Error checking invoice settings:', error)
    }
  }, [updateProgress])

  const checkFirstQuoteCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: quotes } = await supabase
        .from('quotes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (quotes && quotes.length > 0) {
        await updateProgress('first_quote_created', true)
      }
    } catch (error) {
      console.error('Error checking first quote:', error)
    }
  }, [updateProgress])

  // Auto-check all completions on mount and when user changes
  useEffect(() => {
    const checkAllCompletions = async () => {
      await Promise.all([
        checkBusinessDetailsCompletion(),
        checkCompanyProfileCompletion(),
        checkInvoiceSettingsCompletion(),
        checkFirstQuoteCompletion()
      ])
    }

    checkAllCompletions()
  }, [checkBusinessDetailsCompletion, checkCompanyProfileCompletion, checkInvoiceSettingsCompletion, checkFirstQuoteCompletion])

  // Return individual check functions for manual triggering
  return {
    updateProgress,
    checkBusinessDetailsCompletion,
    checkCompanyProfileCompletion,
    checkInvoiceSettingsCompletion,
    checkFirstQuoteCompletion,
    
    // Convenience functions for common actions
    markBusinessDetailsComplete: () => updateProgress('business_details_added', true),
    markCompanyProfileComplete: () => updateProgress('company_profile_completed', true),
    markInvoiceSettingsComplete: () => updateProgress('invoice_settings_completed', true),
    markFirstQuoteComplete: () => updateProgress('first_quote_created', true),
  }
}

/**
 * Hook to get current onboarding progress
 */
export function useOnboardingProgress() {
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setProgress(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching progress:', error)
        setLoading(false)
      }
    }

    fetchProgress()

    // Subscribe to changes
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const subscription = supabase
          .channel('onboarding_progress_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'onboarding_progress',
              filter: `user_id=eq.${user.id}`
            }, 
            () => fetchProgress()
          )
          .subscribe()

        return () => {
          supabase.removeChannel(subscription)
        }
      }
    }

    setupSubscription()
  }, [])

  return { progress, loading }
}