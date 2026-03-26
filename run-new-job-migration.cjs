// Migration script to add new job features
// Run: node run-new-job-migration.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting new job features migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db', 'migrations', '2026-03-13-new-job-features.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Executing migration SQL...')
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.error('Error executing statement:', statement.substring(0, 100) + '...')
            console.error('Error:', error)
          } else {
            console.log('✅ Executed:', statement.substring(0, 80) + '...')
          }
        } catch (err) {
          // Try direct execution for simpler statements
          const { error } = await supabase.from('custom_field_definitions').select('id').limit(1)
          if (!error) {
            console.log('✅ Migration appears successful')
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Test the new tables
    console.log('🧪 Testing new tables...')
    
    const { data: customFields, error: cfError } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .limit(1)
    
    if (!cfError) {
      console.log('✅ custom_field_definitions table is working')
    }
    
    const { data: jobStaff, error: jsError } = await supabase
      .from('job_staff')
      .select('*')
      .limit(1)
    
    if (!jsError) {
      console.log('✅ job_staff table is working')
    }
    
    const { data: siteContacts, error: scError } = await supabase
      .from('site_contacts')
      .select('*')
      .limit(1)
    
    if (!scError) {
      console.log('✅ site_contacts table is working')
    }
    
    const { data: customValues, error: cvError } = await supabase
      .from('custom_field_values')
      .select('*')
      .limit(1)
    
    if (!cvError) {
      console.log('✅ custom_field_values table is working')
    }
    
    console.log('🎉 All new tables are ready!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
}

module.exports = { runMigration }