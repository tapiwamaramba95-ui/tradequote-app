import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sql = fs.readFileSync('db/migrations/20260302_invoice_quote_reference.sql', 'utf8')

// Extract the actual SQL from the DO block
const alterSQL = `
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes(id);
`

const { error } = await supabase.rpc('exec', { sql: alterSQL })

if (error) {
  console.error('Migration error:', error)
  process.exit(1)
} else {
  console.log('✓ Migration completed successfully')
}
