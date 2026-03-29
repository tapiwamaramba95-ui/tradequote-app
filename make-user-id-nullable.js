/**
 * Migration: Make user_id nullable in clients and jobs tables
 * 
 * This allows external enquiries (from non-authenticated customers) to create
 * clients and jobs associated only with business_id, not user_id.
 * 
 * Run with: node make-user-id-nullable.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔄 Starting migration: Make user_id nullable...\n')

  try {
    // 1. Make user_id nullable in clients table
    console.log('1️⃣  Altering clients table...')
    const { error: clientsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE clients ALTER COLUMN user_id DROP NOT NULL;'
    })

    if (clientsError) {
      // Try direct SQL query if RPC doesn't exist
      const { error: directError1 } = await supabase
        .from('clients')
        .select('id')
        .limit(0)
      
      if (directError1) {
        console.log('⚠️  Cannot alter clients table via Supabase client')
        console.log('   Please run this SQL manually in Supabase SQL Editor:')
        console.log('   ALTER TABLE clients ALTER COLUMN user_id DROP NOT NULL;')
      }
    } else {
      console.log('✅ clients.user_id is now nullable')
    }

    // 2. Make user_id nullable in jobs table
    console.log('\n2️⃣  Altering jobs table...')
    const { error: jobsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;'
    })

    if (jobsError) {
      console.log('⚠️  Cannot alter jobs table via Supabase client')
      console.log('   Please run this SQL manually in Supabase SQL Editor:')
      console.log('   ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;')
    } else {
      console.log('✅ jobs.user_id is now nullable')
    }

    console.log('\n' + '='.repeat(60))
    console.log('📋 MANUAL MIGRATION REQUIRED')
    console.log('='.repeat(60))
    console.log('\nGo to Supabase Dashboard > SQL Editor and run:\n')
    console.log('-- Make user_id nullable for external enquiries')
    console.log('ALTER TABLE clients ALTER COLUMN user_id DROP NOT NULL;')
    console.log('ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;')
    console.log('\n' + '='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
