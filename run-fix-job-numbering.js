import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('\nPlease run the SQL manually in Supabase SQL Editor:')
  console.log('   Dashboard → SQL Editor → New Query')
  console.log('   Then paste the contents of: fix-job-numbering.sql')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function fixJobNumbering() {
  try {
    console.log('🔄 Fixing job numbering format...')
    
    const sql = readFileSync('./fix-job-numbering.sql', 'utf8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Job numbering fixed successfully!')
    console.log('\nNew format:')
    console.log('  - Prefix from settings (default: "J")')
    console.log('  - 5-digit padding')
    console.log('  - No hyphen')
    console.log('  - Example: J00001, J00002, J00003')
    console.log('\n✅ Existing jobs with old format updated')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:')
    console.log('   1. Go to: https://supabase.com/dashboard')
    console.log('   2. Select your project')
    console.log('   3. Go to SQL Editor')
    console.log('   4. Create new query and paste contents of: fix-job-numbering.sql')
    console.log('   5. Run the query')
  }
}

fixJobNumbering()
