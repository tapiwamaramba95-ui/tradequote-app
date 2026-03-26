import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateStaffDetails() {
  const userId = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2'
  const staffId = '63544360-c65a-4851-bdd1-82d80fcb76e2'
  
  console.log(`Updating staff member details for user: ${userId}\n`)
  
  try {
    // Get profile information (without phone since it might not exist in profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return
    }
    
    console.log('Profile data found:')
    console.log(`  Name: ${profile.full_name}`)
    console.log(`  Email: ${profile.email}`)
    
    // Try to get phone from business_settings or other sources
    const { data: businessSettings } = await supabase
      .from('business_settings')
      .select('company_phone')
      .eq('user_id', userId)
      .single()
    
    const phone = businessSettings?.company_phone
    if (phone) {
      console.log(`  Phone: ${phone}`)
    }
    
    // Update staff record with profile information
    console.log('\nUpdating staff record...')
    const updateData = {
      name: profile.full_name,
      email: profile.email
    }
    
    // Only add phone if we found it
    if (phone) {
      updateData.phone = phone
    }
    
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating staff:', updateError)
      return
    }
    
    console.log('\n✅ SUCCESS! Staff member updated with:')
    console.log(`   Name: ${updatedStaff.name || 'N/A'}`)
    console.log(`   Email: ${updatedStaff.email || 'N/A'}`)
    console.log(`   Phone: ${updatedStaff.phone || 'N/A'}`)
    console.log(`   Role: ${updatedStaff.role}`)
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

updateStaffDetails().catch(console.error)
