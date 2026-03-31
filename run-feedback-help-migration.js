import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('Running feedback and help system migration...\n')
  
  try {
    const migrationSQL = fs.readFileSync('./db/migrations/20260331_feedback_and_help_system.sql', 'utf8')
    
    console.log('📋 MANUAL MIGRATION REQUIRED')
    console.log('─'.repeat(80))
    console.log('Please copy and paste the SQL below into your Supabase SQL Editor:')
    console.log('Dashboard → SQL Editor → New Query → Paste → Run')
    console.log('─'.repeat(80) + '\n')
    console.log(migrationSQL)
    console.log('\n' + '─'.repeat(80))
    console.log('✓ After running the SQL, the following will be created:')
    console.log('  - feedback table (for user feedback)')
    console.log('  - help_articles table (for help center articles)')
    console.log('  - article_feedback table (for article helpful/not helpful votes)')
    console.log('  - 9 seed help articles')  
  } catch (err) {
    console.error('Error reading migration file:', err)
    process.exit(1)
  }
}

runMigration().catch(console.error)
