/**
 * Utilities for generating and managing enquiry numbers
 * Format: ENQ0001, ENQ0002, etc.
 * 
 * Also includes onboarding progress utility functions
 */

import { supabase } from '@/lib/supabase'

/**
 * Generate the next enquiry number that will be assigned
 * This is for preview purposes - the actual assignment happens in the database
 */
export async function getNextEnquiryNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('enquiry_number')
      .not('enquiry_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data?.enquiry_number) {
      return 'ENQ0001' // First enquiry
    }

    // Extract number and increment
    const currentNumber = parseInt(data.enquiry_number.replace('ENQ', ''))
    const nextNumber = currentNumber + 1

    // Pad with zeros (minimum 4 digits)
    return `ENQ${nextNumber.toString().padStart(4, '0')}`
  } catch (error) {
    console.error('Error getting next enquiry number:', error)
    return 'ENQ0001'
  }
}

/**
 * Manually update onboarding progress (for testing or manual completion)
 */
export async function updateOnboardingProgress(
  step: 'business_details_added' | 'company_profile_completed' | 'invoice_settings_completed' | 'first_quote_created',
  completed: boolean = true
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const updateData: any = {
      [step]: completed,
      updated_at: new Date().toISOString()
    }

    // If completing the last step, set completion date
    if (step === 'first_quote_created' && completed) {
      updateData.completion_date = new Date().toISOString()
    }

    const { error } = await supabase
      .from('onboarding_progress')
      .update(updateData)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating onboarding progress:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating onboarding progress:', error)
    return false
  }
}

/**
 * Get current onboarding progress for a user
 */
export async function getOnboardingProgress() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return data
  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    return null
  }
}

/**
 * Format enquiry source for display
 */
export function formatEnquirySource(source: string | null): { text: string; color: string } {
  switch (source) {
    case 'website_form':
      return { text: 'Website', color: 'text-blue-600' }
    case 'email':
      return { text: 'Email', color: 'text-green-600' }
    case 'phone_call':
      return { text: 'Phone', color: 'text-purple-600' }
    case 'referral':
      return { text: 'Referral', color: 'text-orange-600' }
    case 'social_media':
      return { text: 'Social', color: 'text-pink-600' }
    case 'walk_in':
      return { text: 'Walk-in', color: 'text-yellow-600' }
    default:
      return { text: 'Manual', color: 'text-gray-600' }
  }
}

/**
 * Validate enquiry number format
 */
export function isValidEnquiryNumber(enquiryNumber: string): boolean {
  return /^ENQ[0-9]{4,}$/.test(enquiryNumber)
}