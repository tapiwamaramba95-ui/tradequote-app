const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillMissingAddresses() {
  console.log('🔍 Looking for missing addresses...')
  
  try {
    // Find clients with missing addresses
    const { data: clientsWithMissingAddresses, error: clientError } = await supabase
      .from('clients')
      .select('id, name, address')
      .or('address.is.null,address.eq.Not provided,address.eq.Address to be confirmed,address.eq.')
    
    if (clientError) {
      console.error('Error fetching clients:', clientError)
      return
    }

    // Find jobs with missing addresses  
    const { data: jobsWithMissingAddresses, error: jobError } = await supabase
      .from('jobs')
      .select('id, job_name, job_address, client_id, clients(name)')
      .or('job_address.is.null,job_address.eq.Address to be confirmed,job_address.eq.')

    if (jobError) {
      console.error('Error fetching jobs:', jobError)
      return
    }

    console.log(`\n📊 Found:`)
    console.log(`   • ${clientsWithMissingAddresses?.length || 0} clients with missing addresses`)
    console.log(`   • ${jobsWithMissingAddresses?.length || 0} jobs with missing addresses`)

    // Show details
    if (clientsWithMissingAddresses?.length > 0) {
      console.log(`\n👤 Clients needing addresses:`)
      clientsWithMissingAddresses.forEach(client => {
        console.log(`   • ${client.name} (ID: ${client.id}) - "${client.address || 'NULL'}"`)
      })
    }

    if (jobsWithMissingAddresses?.length > 0) {
      console.log(`\n📝 Jobs needing addresses:`)
      jobsWithMissingAddresses.forEach(job => {
        console.log(`   • ${job.job_name} - ${job.clients?.name || 'No client'} (ID: ${job.id}) - "${job.job_address || 'NULL'}"`)
      })
    }

    console.log(`\n💡 Next steps:`)
    console.log(`   1. Update your Supabase credentials in this script`)
    console.log(`   2. Run with --fix flag to apply fixes: node fix-missing-addresses.js --fix`)
    console.log(`   3. Or manually update addresses in the dashboard`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function fixMissingAddresses() {
  console.log('🔧 Applying address fixes...')

  try {
    // Option 1: Set a default placeholder for empty addresses
    console.log('\n📍 Setting placeholder for truly empty addresses...')
    
    const { error: clientUpdateError } = await supabase
      .from('clients')
      .update({ address: 'Address to be provided' })
      .or('address.is.null,address.eq.')

    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({ job_address: 'Address to be provided' })
      .or('job_address.is.null,job_address.eq.')

    if (clientUpdateError) {
      console.error('❌ Error updating clients:', clientUpdateError)
    } else {
      console.log('✅ Updated client addresses')
    }

    if (jobUpdateError) {
      console.error('❌ Error updating jobs:', jobUpdateError)
    } else {
      console.log('✅ Updated job addresses')
    }

    console.log('\n✅ Backfill complete!')
    console.log('💡 You can now manually edit specific addresses in the dashboard')

  } catch (error) {
    console.error('❌ Error during fix:', error.message)
  }
}

// Main execution
const shouldFix = process.argv.includes('--fix')

if (shouldFix) {
  fixMissingAddresses()
} else {
  backfillMissingAddresses()
}