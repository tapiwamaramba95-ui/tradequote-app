const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables manually from .env.local
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file:', error.message)
  }
}

async function runMigration() {
  console.log('Starting auto-complete triggers migration...')
  
  // Load environment variables
  loadEnvFile()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY  // Fixed: was SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('Reading SQL file...')
    const sql = fs.readFileSync('./db/migrations/20241228_onboarding_auto_complete_triggers.sql', 'utf-8')
    
    console.log('Executing SQL migration...')
    // Split SQL into statements and execute one by one
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('exec', { sql: statement })
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error)
          throw error
        }
      }
    }
    
    console.log('✅ Auto-complete triggers migration completed successfully!')
    console.log('Migration output:', data)
    
  } catch (error) {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  }
}

runMigration()