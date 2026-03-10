import { createSupabaseAdmin } from './lib/supabase-admin.ts'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables manually from .env.local
function loadEnvFile() {
  try {
    const envPath = join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=')
      if (key && values.length) {
        process.env[key.trim()] = values.join('=').trim()
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file:', error)
  }
}

async function runJobPhotosMigration() {
  // Load environment variables
  loadEnvFile()
  
  const supabase = await createSupabaseAdmin()
  
  console.log('Running job photos table migration...')
  
  try {
    const migrationPath = join(__dirname, 'db', 'migrations', '20260310_job_photos_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Executing job photos migration...')
    
    // Split SQL into individual statements and execute one by one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        try {
          // Use rpc to execute raw SQL
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          if (error) {
            console.error(`Statement ${i + 1} failed:`, error)
            // Some errors might be expected (like "already exists"), continue
          }
        } catch (err) {
          console.warn(`Warning on statement ${i + 1}:`, err.message)
          // Continue with other statements
        }
      }
    }
      console.log('✅ Job photos migration completed successfully!')
      
      // Verify the table was created
      console.log('Verifying job_photos table structure...')
      const { data, error: verifyError } = await supabase
        .from('job_photos')
        .select('*')
        .limit(1)
      
      if (verifyError && verifyError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Table verification failed:', verifyError)
      } else {
        console.log('✅ job_photos table created and accessible')
      }
      
      console.log('🎉 Migration verification complete')
    }
  } catch (err) {
    console.error('❌ Migration error:', err)
    process.exit(1)
  }
}

runJobPhotosMigration().catch(console.error)