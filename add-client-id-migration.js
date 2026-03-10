const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addClientIdColumns() {
  console.log('Starting migration to add client_id columns...');
  
  try {
    // Add client_id to quotes table
    console.log('Adding client_id to quotes table...');
    const { error: quotesError } = await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);' 
    });
    
    if (quotesError) {
      console.log('Using alternative method for quotes...');
      // Alternative approach
      const { error: altError1 } = await supabase
        .schema('public')
        .from('quotes')
        .select('id')
        .limit(1);
      
      if (!altError1) {
        console.log('Quotes table accessible, client_id may already exist or need manual addition');
      }
    } else {
      console.log('✓ Added client_id to quotes table');
    }
    
    // Add client_id to invoices table
    console.log('Adding client_id to invoices table...');
    const { error: invoicesError } = await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);' 
    });
    
    if (invoicesError) {
      console.log('Using alternative method for invoices...');
      const { error: altError2 } = await supabase
        .schema('public')
        .from('invoices')
        .select('id')
        .limit(1);
      
      if (!altError2) {
        console.log('Invoices table accessible, client_id may already exist or need manual addition');
      }
    } else {
      console.log('✓ Added client_id to invoices table');
    }
    
    // Check if we can see the new columns
    console.log('Checking quotes structure...');
    const { data: quotesData, error: quotesCheckError } = await supabase
      .from('quotes')
      .select('id, job_id, client_id')
      .limit(1);
      
    if (!quotesCheckError) {
      console.log('✓ client_id column exists in quotes table');
      console.log('Sample quotes data:', quotesData);
    } else {
      console.log('❌ client_id column may not exist in quotes table:', quotesCheckError);
    }
    
    console.log('Checking invoices structure...');
    const { data: invoicesData, error: invoicesCheckError } = await supabase
      .from('invoices')  
      .select('id, job_id, client_id')
      .limit(1);
      
    if (!invoicesCheckError) {
      console.log('✓ client_id column exists in invoices table');
      console.log('Sample invoices data:', invoicesData);
    } else {
      console.log('❌ client_id column may not exist in invoices table:', invoicesCheckError);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addClientIdColumns();