#!/usr/bin/env node

/**
 * Migration: Add stripe_enabled column to business_settings table
 * 
 * This script adds the stripe_enabled boolean column to allow businesses
 * to enable/disable Stripe payment acceptance for their invoices.
 * 
 * Run: node add-stripe-enabled-column.js
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

async function addStripeEnabledColumn() {
  console.log('🔄 Starting migration: Add stripe_enabled column...\n')

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from('business_settings')
      .select('stripe_enabled')
      .limit(1)

    if (!checkError) {
      console.log('✅ Column stripe_enabled already exists!')
      return
    }

    console.log('📝 Column does not exist, will provide SQL to add it manually...\n')
    
    console.log('=' .repeat(60))
    console.log('📋 MANUAL MIGRATION REQUIRED')
    console.log('=' .repeat(60))
    console.log('\nGo to Supabase Dashboard > SQL Editor and run:\n')
    console.log('-- Add stripe_enabled column to business_settings table')
    console.log('ALTER TABLE business_settings')
    console.log('ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false;')
    console.log('\n-- Update any NULL values to false')
    console.log('UPDATE business_settings')
    console.log('SET stripe_enabled = false')
    console.log('WHERE stripe_enabled IS NULL;')
    console.log('\n' + '=' .repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

addStripeEnabledColumn()
  .then(() => {
    console.log('✅ Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
