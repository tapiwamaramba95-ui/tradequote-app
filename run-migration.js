import { createSupabaseAdmin } from './lib/supabase-admin.js'
import fs from 'fs'

async function runMigration() {
  const supabase = await createSupabaseAdmin()
  
  console.log('Running migration to add client_id columns...')
  
  try {
    const migrationSQL = fs.readFileSync('./db/migrations/20260227_add_client_id_to_quotes_invoices.sql', 'utf8')
    
    // Split the SQL into individual statements and execute them one by one
    const statements = migrationSQL.split(/DO \$\$[\s\S]*?\$\$;/).filter(s => s.trim())
    
    console.log(`Found ${statements.length} migration statements to execute`)
    
    // Execute the SQL directly using raw SQL
    const { error } = await supabase.sql`${migrationSQL}`
    
    if (error) {
      console.error('Migration failed:', error)
    } else {
      console.log('Migration completed successfully!')
      
      // Verify the columns were added
      console.log('Verifying quotes table structure...')
      const { data: quotesColumns } = await supabase.rpc('get_table_columns', { table_name: 'quotes' })
      
      console.log('Verifying invoices table structure...')  
      const { data: invoicesColumns } = await supabase.rpc('get_table_columns', { table_name: 'invoices' })
      
      console.log('Migration verification complete')
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

runMigration().catch(console.error)