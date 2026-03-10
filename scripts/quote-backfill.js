import { createSupabaseAdmin } from '@/lib/supabase-admin'

const runQuoteBackfill = async () => {
  try {
    const supabase = await createSupabaseAdmin()

    // Get all users with quotes
    const { data: users } = await supabase
      .from('business_settings')
      .select('user_id, quote_prefix, quote_start_number')

    if (!users) {
      console.log('No users found')
      return
    }

    for (const user of users) {
      const quotePrefix = user.quote_prefix || 'Q'
      const startNumber = user.quote_start_number || 1

      // Get all quotes for this user, ordered by creation date
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, created_at, quote_number')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: true })

      if (!quotes || quotes.length === 0) continue

      console.log(`Processing ${quotes.length} quotes for user ${user.user_id}`)

      // Update each quote with proper numbering
      for (let i = 0; i < quotes.length; i++) {
        const quoteNumber = `${quotePrefix}${String(startNumber + i).padStart(4, '0')}`
        
        const { error } = await supabase
          .from('quotes')
          .update({ quote_number: quoteNumber })
          .eq('id', quotes[i].id)
          .eq('user_id', user.user_id)

        if (error) {
          console.error(`Error updating quote ${quotes[i].id}:`, error)
        } else {
          console.log(`Updated quote ${quotes[i].id} to ${quoteNumber}`)
        }
      }
    }

    console.log('Quote backfill completed!')
  } catch (error) {
    console.error('Backfill failed:', error)
  }
}

runQuoteBackfill()