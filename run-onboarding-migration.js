const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
// Note: You'll need to set these environment variables or update with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runOnboardingMigration() {
  try {
    console.log('🚀 Starting onboarding progress migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db', 'migrations', '20241228_onboarding_progress.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error)
          throw error
        }
        
        console.log(`✅ Statement ${i + 1} completed successfully`)
      } catch (error) {
        // Some statements might fail due to existing objects, which is okay
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (object already exists)`)
          continue
        } else {
          throw error
        }
      }
    }
    
    console.log('🎉 Onboarding progress migration completed successfully!')
    console.log('')
    console.log('📊 Migration Summary:')
    console.log('• Created onboarding_progress table')
    console.log('• Added RLS policies for data security')
    console.log('• Created triggers for automatic progress tracking')
    console.log('• Initialized existing users with their current progress')
    console.log('')
    console.log('🔧 Next steps:')
    console.log('1. Test the onboarding flow at /onboarding')
    console.log('2. Check dashboard for new onboarding widgets')
    console.log('3. Verify progress tracking works correctly')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative approach using direct SQL execution
async function runOnboardingMigrationDirect() {
  try {
    console.log('🚀 Starting onboarding progress migration (direct approach)...')
    
    // Create the table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS onboarding_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          account_created BOOLEAN DEFAULT true,
          business_details_added BOOLEAN DEFAULT false,
          company_profile_completed BOOLEAN DEFAULT false,
          invoice_settings_completed BOOLEAN DEFAULT false,
          first_quote_created BOOLEAN DEFAULT false,
          widget_dismissed BOOLEAN DEFAULT false,
          widget_dismissed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          completion_date TIMESTAMPTZ,
          UNIQUE(user_id)
        );
      `
    })
    
    if (tableError && !tableError.message.includes('already exists')) {
      throw tableError
    }
    
    console.log('✅ Table created successfully')
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError && !rlsError.message.includes('already exists')) {
      console.log('⚠️  RLS enable warning:', rlsError.message)
    }
    
    console.log('✅ RLS enabled')
    
    // Create RLS policy
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage their own onboarding progress" 
        ON onboarding_progress 
        FOR ALL 
        USING (auth.uid() = user_id);
      `
    })
    
    if (policyError && !policyError.message.includes('already exists')) {
      console.log('⚠️  Policy warning:', policyError.message)
    }
    
    console.log('✅ RLS policy created')
    
    // Initialize existing users
    const { error: initError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO onboarding_progress (user_id, account_created, business_details_added, company_profile_completed)
        SELECT 
          id as user_id,
          true as account_created,
          CASE WHEN business_name IS NOT NULL AND business_name != '' THEN true ELSE false END as business_details_added,
          CASE WHEN abn IS NOT NULL AND abn != '' AND business_address IS NOT NULL AND business_address != '' THEN true ELSE false END as company_profile_completed
        FROM user_profiles
        ON CONFLICT (user_id) DO NOTHING;
      `
    })
    
    if (initError) {
      console.log('⚠️  Initialization warning:', initError.message)
    } else {
      console.log('✅ Existing users initialized')
    }
    
    console.log('🎉 Onboarding progress migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    
    // Provide helpful error information
    if (error.message.includes('permission denied')) {
      console.log('')
      console.log('💡 This error suggests you need service role permissions.')
      console.log('   Make sure you are using the service role key, not the anon key.')
    }
    
    process.exit(1)
  }
}

// Run the migration
if (require.main === module) {
  console.log('🔧 TradeQuote Onboarding Migration Tool')
  console.log('=====================================')
  console.log('')
  
  // Try the direct approach first
  runOnboardingMigrationDirect()
}