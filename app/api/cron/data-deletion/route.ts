import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint should be called daily by a cron service
// Example cron setup in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/data-deletion",
//     "schedule": "0 2 * * *"
//   }]
// }

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()

    // Find accounts scheduled for deletion today
    const { data: accountsToDelete } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'cancelled')
      .lte('deletion_scheduled_at', now.toISOString())
      .is('data_deleted_at', null)

    if (accountsToDelete && accountsToDelete.length > 0) {
      for (const account of accountsToDelete) {
        console.log(`Deleting data for user: ${account.id}`)

        // Delete all user data
        // Note: Order matters - delete children before parents to avoid FK constraint errors
        
        // Jobs & related
        await supabase.from('job_items').delete().eq('user_id', account.id)
        await supabase.from('jobs').delete().eq('user_id', account.id)
        
        // Quotes & related
        await supabase.from('quote_items').delete().eq('user_id', account.id)
        await supabase.from('quotes').delete().eq('user_id', account.id)
        
        // Invoices & related
        await supabase.from('invoice_items').delete().eq('user_id', account.id)
        await supabase.from('invoices').delete().eq('user_id', account.id)
        await supabase.from('payments').delete().eq('user_id', account.id)
        
        // Purchase Orders & related
        await supabase.from('purchase_order_items').delete().eq('user_id', account.id)
        await supabase.from('purchase_orders').delete().eq('user_id', account.id)
        
        // Enquiries
        await supabase.from('enquiries').delete().eq('user_id', account.id)
        
        // Clients & Suppliers
        await supabase.from('clients').delete().eq('user_id', account.id)
        await supabase.from('suppliers').delete().eq('user_id', account.id)
        
        // Staff & related
        await supabase.from('staff_labour_rates').delete().eq('user_id', account.id)
        await supabase.from('staff').delete().eq('user_id', account.id)
        
        // Settings & configurations
        await supabase.from('labour_rates').delete().eq('user_id', account.id)
        await supabase.from('note_templates').delete().eq('user_id', account.id)
        await supabase.from('price_list').delete().eq('user_id', account.id)
        
        // Billing & payments
        await supabase.from('payment_methods').delete().eq('user_id', account.id)
        await supabase.from('billing_history').delete().eq('user_id', account.id)
        await supabase.from('payment_failures').delete().eq('user_id', account.id)
        
        // Security
        await supabase.from('security_audit_log').delete().eq('user_id', account.id)
        
        // Keep cancellations table for analytics (it's already anonymized)
        
        // Mark profile as deleted (keep profile for analytics but clear personal data)
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'deleted',
            data_deleted_at: now.toISOString(),
            // Clear personal data
            first_name: 'DELETED',
            last_name: 'USER',
            business_name: null,
            phone: null,
            email: null,
            abn: null,
            business_address: null,
            business_website: null,
            logo_url: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
          })
          .eq('id', account.id)

        // Send deletion confirmation email (if they still have email access)
        // TODO: Integrate with email service
        console.log(`Data deleted for user: ${account.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      accountsDeleted: accountsToDelete?.length || 0,
    })

  } catch (error) {
    console.error('Data deletion error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
