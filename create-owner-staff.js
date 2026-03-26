import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createOwnerStaff() {
  
  const userId = '04df4341-54ff-4ce2-a14c-bdfe709e4fb2'
  
  console.log(`Creating staff member for user: ${userId}`)
  
  try {
    // Step 1: Get the user's business_id
    console.log('Step 1: Getting business_id from user_businesses...')
    const { data: userBusiness, error: businessError } = await supabase
      .from('user_businesses')
      .select('business_id, role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    if (businessError || !userBusiness) {
      console.error('Error: Could not find active business for user', businessError)
      return
    }
    
    console.log(`Found business_id: ${userBusiness.business_id}`)
    console.log(`User role: ${userBusiness.role}`)
    
    // Step 2: Check if staff member already exists
    console.log('\nStep 2: Checking if staff member already exists...')
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('business_id', userBusiness.business_id)
      .maybeSingle()
    
    if (existingStaff) {
      console.log('✅ Staff member already exists:')
      console.log(`   ID: ${existingStaff.id}`)
      console.log(`   Role: ${existingStaff.role}`)
      console.log(`   Active: ${existingStaff.is_active}`)
      return
    }
    
    // Step 3: Get user profile information
    console.log('\nStep 3: Getting user profile information...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Continue anyway, we can create without this info
    }
    
    console.log(`Profile name: ${profile?.full_name || 'N/A'}`)
    console.log(`Profile email: ${profile?.email || 'N/A'}`)
    
    // Step 4: Create staff member
    console.log('\nStep 4: Creating staff member...')
    const { data: newStaff, error: insertError } = await supabase
      .from('staff')
      .insert({
        user_id: userId,
        owner_id: userId, // Owner is staff member of their own business
        business_id: userBusiness.business_id,
        role: 'Owner',
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error creating staff member:', insertError)
      return
    }
    
    console.log('\n✅ SUCCESS! Staff member created:')
    console.log(`   ID: ${newStaff.id}`)
    console.log(`   User ID: ${newStaff.user_id}`)
    console.log(`   Business ID: ${newStaff.business_id}`)
    console.log(`   Role: ${newStaff.role}`)
    console.log(`   Active: ${newStaff.is_active}`)
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

createOwnerStaff().catch(console.error)
