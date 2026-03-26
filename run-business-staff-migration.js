import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('Running migration: Auto-create business and staff on signup...\n')
  
  try {
    const migrationSQL = fs.readFileSync(
      './db/migrations/20260326_auto_create_business_and_staff_on_signup.sql',
      'utf8'
    )
    
    // Use raw SQL query method
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1)
    
    // Actually, we need to run this manually since Supabase JS doesn't support raw SQL
    console.log('⚠️  This migration needs to be run directly in Supabase SQL Editor')
    console.log('📋 Copy and paste the following SQL into your Supabase SQL Editor:')
    console.log('   Dashboard → SQL Editor → New Query\n')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))
    console.log('\nOr run this file directly in PostgreSQL/Supabase CLI')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

runMigration().catch(console.error)
