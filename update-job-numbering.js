import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const updateSQL = `
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
  last_job_number TEXT;
BEGIN
  -- Only set if job_number is null
  IF NEW.job_number IS NULL THEN
    -- Get prefix from business_settings or use default
    SELECT COALESCE(job_prefix, 'J') INTO prefix
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- If no prefix found, use default
    IF prefix IS NULL THEN
      prefix := 'J';
    END IF;
    
    -- Get settings for start number
    SELECT COALESCE(job_start_number, 1) INTO next_number
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    IF next_number IS NULL THEN
      next_number := 1;
    END IF;
    
    -- Get the last job number with this prefix to determine next number
    SELECT job_number INTO last_job_number
    FROM jobs
    WHERE user_id = NEW.user_id
      AND job_number ~ ('^' || prefix || '\\d+$')
    ORDER BY job_number DESC
    LIMIT 1;
    
    -- If we found a previous job, extract the number and increment
    IF last_job_number IS NOT NULL THEN
      next_number := SUBSTRING(last_job_number FROM (length(prefix) + 1))::INTEGER + 1;
    END IF;
    
    -- Set the job number with 5-digit padding (matches invoice format)
    NEW.job_number := prefix || LPAD(next_number::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`

async function updateJobNumbering() {
  console.log('Updating job numbering trigger...')
  
  const { error } = await supabase.rpc('exec_sql', { 
    sql: updateSQL 
  })
  
  if (error) {
    console.error('Error updating trigger:', error)
    
    // Try direct approach if RPC doesn't work
    console.log('Trying direct SQL execution...')
    const { error: directError } = await supabase.from('_migrations').select('*').limit(0)
    
    // Since we can't execute arbitrary SQL directly, we'll use the service role to update
    console.log('\nPlease run this SQL in your Supabase SQL Editor:')
    console.log(updateSQL)
    return
  }
  
  console.log('✅ Job numbering trigger updated successfully!')
  console.log('\nNew format: PREFIX + 5-digit number (e.g., J00001, J00002)')
  console.log('No hyphen, matching invoice/quote format')
}

updateJobNumbering()
