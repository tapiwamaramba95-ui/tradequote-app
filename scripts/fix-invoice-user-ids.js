/**
 * One-time script to fix invoices with null user_id
 * This will update all invoices to have proper user_id from their linked job
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixInvoiceUserIds() {
  try {
    console.log('🔍 Finding invoices with null user_id...')
    
    // Get all invoices with null user_id that have a job_id
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, job_id')
      .is('user_id', null)
      .not('job_id', 'is', null)
    
    if (fetchError) {
      console.error('Error fetching invoices:', fetchError)
      return
    }

    if (!invoices || invoices.length === 0) {
      console.log('✅ No invoices found with missing user_id')
      return
    }

    console.log(`📋 Found ${invoices.length} invoices to fix`)

    for (const invoice of invoices) {
      console.log(`🔧 Fixing invoice ${invoice.id}...`)
      
      // Get user_id from the job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('user_id')
        .eq('id', invoice.job_id)
        .single()

      if (jobError || !job || !job.user_id) {
        console.log(`❌ Could not get user_id for job ${invoice.job_id}`)
        continue
      }

      // Update the invoice with the correct user_id
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ user_id: job.user_id })
        .eq('id', invoice.id)

      if (updateError) {
        console.error(`❌ Failed to update invoice ${invoice.id}:`, updateError)
      } else {
        console.log(`✅ Updated invoice ${invoice.id} with user_id ${job.user_id}`)
      }
    }

    console.log('🎉 Invoice user_id fix completed!')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
  }
}

// Run the fix
fixInvoiceUserIds()