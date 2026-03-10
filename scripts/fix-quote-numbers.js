/**
 * Fix Quote Numbers Script
 * This script will update existing quote numbers to follow the correct Q001, Q002, Q003... format
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixQuoteNumbers() {
  console.log('Fixing quote numbers...');

  try {
    // Get all users with quotes
    const { data: users, error: usersError } = await supabase
      .from('business_settings')
      .select('user_id, quote_prefix, quote_start_number');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found with business settings');
      return;
    }

    for (const user of users) {
      const quotePrefix = user.quote_prefix || 'Q';
      const startNumber = user.quote_start_number || 1;

      console.log(`Processing quotes for user ${user.user_id}...`);
      console.log(`Using prefix: ${quotePrefix}, start number: ${startNumber}`);

      // Get all quotes for this user, ordered by creation date
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, created_at, quote_number')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: true });

      if (quotesError) {
        console.error(`Error fetching quotes for user ${user.user_id}:`, quotesError);
        continue;
      }

      if (!quotes || quotes.length === 0) {
        console.log(`No quotes found for user ${user.user_id}`);
        continue;
      }

      console.log(`Found ${quotes.length} quotes to update`);

      // Update each quote with proper numbering
      for (let i = 0; i < quotes.length; i++) {
        const newQuoteNumber = `${quotePrefix}${String(startNumber + i).padStart(4, '0')}`;
        
        console.log(`Updating quote ${quotes[i].id} from "${quotes[i].quote_number}" to "${newQuoteNumber}"`);
        
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ quote_number: newQuoteNumber })
          .eq('id', quotes[i].id);

        if (updateError) {
          console.error(`Error updating quote ${quotes[i].id}:`, updateError);
        } else {
          console.log(`✓ Updated quote ${quotes[i].id} to ${newQuoteNumber}`);
        }
      }

      console.log(`Completed processing quotes for user ${user.user_id}\n`);
    }

    console.log('Quote number fix completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixQuoteNumbers().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});