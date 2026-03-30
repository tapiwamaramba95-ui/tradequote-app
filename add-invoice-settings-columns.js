#!/usr/bin/env node

/**
 * Migration: Add invoice settings columns to business_settings table
 * 
 * This script adds all necessary invoice-related columns to the business_settings table.
 * 
 * Run: node add-invoice-settings-columns.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addInvoiceSettingsColumns() {
  console.log('🔄 Starting migration: Add invoice settings columns...\n')

  console.log('=' .repeat(70))
  console.log('📋 MANUAL MIGRATION REQUIRED')
  console.log('=' .repeat(70))
  console.log('\nGo to Supabase Dashboard > SQL Editor and run:\n')
  console.log('-- Add invoice settings columns to business_settings table\n')
  
  console.log('-- Invoice numbering columns')
  console.log('ALTER TABLE business_settings')
  console.log('ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(10) DEFAULT \'INV\',')
  console.log('ADD COLUMN IF NOT EXISTS invoice_start_number INTEGER DEFAULT 1,')
  console.log('ADD COLUMN IF NOT EXISTS invoice_terms TEXT DEFAULT \'Payment due within 30 days\';')
  console.log('')
  
  console.log('-- Deposit settings columns')
  console.log('ALTER TABLE business_settings')
  console.log('ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false,')
  console.log('ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5,2) DEFAULT 30.00;')
  console.log('')
  
  console.log('-- Payment settings column')
  console.log('ALTER TABLE business_settings')
  console.log('ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false;')
  console.log('')
  
  console.log('-- Bank details columns')
  console.log('ALTER TABLE business_settings')
  console.log('ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),')
  console.log('ADD COLUMN IF NOT EXISTS bsb VARCHAR(10),')
  console.log('ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),')
  console.log('ADD COLUMN IF NOT EXISTS account_name VARCHAR(100);')
  console.log('')
  
  console.log('-- Update any NULL values to defaults')
  console.log('UPDATE business_settings')
  console.log('SET ')
  console.log('  invoice_prefix = COALESCE(invoice_prefix, \'INV\'),')
  console.log('  invoice_start_number = COALESCE(invoice_start_number, 1),')
  console.log('  invoice_terms = COALESCE(invoice_terms, \'Payment due within 30 days\'),')
  console.log('  deposit_required = COALESCE(deposit_required, false),')
  console.log('  deposit_percentage = COALESCE(deposit_percentage, 30.00),')
  console.log('  stripe_enabled = COALESCE(stripe_enabled, false);')
  console.log('')
  
  console.log('-- Refresh schema cache')
  console.log('NOTIFY pgrst, \'reload schema\';')
  console.log('\n' + '=' .repeat(70) + '\n')
  
  console.log('⚠️  IMPORTANT: After running the SQL, you may need to:')
  console.log('   1. Wait 30-60 seconds for Supabase to refresh the schema cache')
  console.log('   2. Or restart your Next.js dev server')
  console.log('   3. Or trigger a schema cache refresh in Supabase dashboard\n')
}

addInvoiceSettingsColumns()
  .then(() => {
    console.log('✅ Migration script complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
