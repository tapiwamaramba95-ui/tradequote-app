// Script to update enquiry profile name to use business name instead of email
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function updateEnquiryProfileNames() {
  try {
    // Get all users with business settings
    const { data: businesses, error: businessError } = await supabase
      .from('business_settings')
      .select('user_id, company_name')
    
    if (businessError) {
      console.error('Error fetching business settings:', businessError)
      return
    }

    console.log(`Found ${businesses.length} businesses`)

    for (const business of businesses) {
      if (!business.company_name) {
        console.log(`Skipping user ${business.user_id} - no company name`)
        continue
      }

      // Generate URL-safe profile name from company name
      const profileName = business.company_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

      console.log(`Updating ${business.company_name} -> ${profileName}`)

      // Update enquiry settings
      const { error: updateError } = await supabase
        .from('enquiry_settings')
        .update({
          public_profile_name: profileName,
          enquiry_email: `${profileName}@enquiries.tradequote.com`
        })
        .eq('user_id', business.user_id)

      if (updateError) {
        console.error(`Error updating user ${business.user_id}:`, updateError)
      } else {
        console.log(`✅ Updated profile name for ${business.company_name}`)
      }
    }

    console.log('\n✅ All enquiry profile names updated!')
  } catch (error) {
    console.error('Error:', error)
  }
}

updateEnquiryProfileNames()
