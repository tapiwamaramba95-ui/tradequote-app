import { createSupabaseAdmin } from './lib/supabase-admin.js'
import fs from 'fs'

async function setupDatabase() {
  console.log('🚀 Setting up database for sign-up functionality...\n')
  
  const supabase = await createSupabaseAdmin()
  
  try {
    // Read the setup SQL file
    const setupSQL = fs.readFileSync('./database-setup.sql', 'utf8')
    
    console.log('📝 Running database setup SQL...')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec', { sql: setupSQL })
    
    if (error) {
      console.error('❌ Database setup failed:', error)
      console.error('\n📋 Please run the SQL manually in Supabase Dashboard > SQL Editor')
      console.error('📄 File: database-setup.sql')
    } else {
      console.log('✅ Database setup completed successfully!')
      
      // Test the setup by checking if we can access the tables
      console.log('\n🧪 Testing database setup...')
      
      const { data: profileTest, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, trade_type, phone, subscription_status')
        .limit(1)
      
      const { data: onboardingTest, error: onboardingError } = await supabase
        .from('onboarding_progress')
        .select('user_id, business_details_added')
        .limit(1)
      
      console.log('📋 Profiles table access:', profileError ? 'FAILED' : 'SUCCESS')
      console.log('📋 Onboarding progress table access:', onboardingError ? 'FAILED' : 'SUCCESS')
      
      if (!profileError && !onboardingError) {
        console.log('\n🎉 All tests passed! Sign-up functionality should now work.')
        console.log('\n📝 Next steps:')
        console.log('   1. Start your dev server: npm run dev')
        console.log('   2. Go to http://localhost:3000')
        console.log('   3. Test the sign-up process')
      }
    }
  } catch (err) {
    console.error('💥 Error:', err)
    console.error('\n📋 Please run the SQL manually in Supabase Dashboard > SQL Editor')
    console.error('📄 File: database-setup.sql')
  }
}

setupDatabase().catch(console.error)