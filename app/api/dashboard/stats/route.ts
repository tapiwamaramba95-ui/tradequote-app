import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  let userId: string | undefined
  try {
    const body = await request.json()
    userId = body.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const oneWeekFromNow = new Date(now)
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
    const oneWeekStr = oneWeekFromNow.toISOString().split('T')[0]
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0]

    // Execute all stat queries in parallel using database aggregation
    const [
      jobsInProgressResult,
      jobsTodayResult,
      jobsTomorrowResult,
      unscheduledJobsResult,
      scheduledThisWeekResult,
      invoicesDraftResult,
      invoicesUnpaidResult,
      invoicesOverdueResult,
      invoicesPaidResult,
      overdueInvoicesResult,
      outstandingRevenueResult,
      quotesDraftResult,
      quotesAwaitingResult,
      quotesAcceptedResult,
      quotesDeclinedResult,
      quotesExpiringSoonResult,
      purchaseOrdersDraftResult,
      purchaseOrdersUnbilledResult,
      purchaseOrdersBilledResult,
    ] = await Promise.all([
      // Jobs counts
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'in_progress'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('scheduled_date', today).lt('scheduled_date', tomorrow.toISOString()),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('scheduled_date', tomorrowStr).lt('scheduled_date', new Date(tomorrow.setDate(tomorrow.getDate() + 1)).toISOString()),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('scheduled_date', null),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('scheduled_date', today).lte('scheduled_date', oneWeekStr),
      
      // Invoice counts
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'draft'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['sent', 'partial']),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'paid').lt('due_date', now.toISOString()),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'paid'),
      
      // Overdue invoices total (needs data for calculation)
      supabase.from('invoices').select('total, amount_paid').eq('user_id', userId).neq('status', 'paid').lt('due_date', now.toISOString()),
      
      // Outstanding revenue (needs data for calculation)
      supabase.from('invoices').select('total, amount_paid').eq('user_id', userId).neq('status', 'paid'),
      
      // Quote counts
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'draft'),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['sent', 'awaiting acceptance']),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'accepted'),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'declined'),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['sent', 'awaiting acceptance']).lte('valid_until', threeDaysStr),
      
      // Purchase order counts
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'draft'),
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'received'),
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'billed'),
    ])

    // Calculate overdue invoices total
    const overdueInvoicesTotal = (overdueInvoicesResult.data || []).reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid || 0)), 
      0
    )

    // Calculate outstanding revenue
    const outstandingRevenue = (outstandingRevenueResult.data || []).reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid || 0)), 
      0
    )

    const stats = {
      jobsInProgress: jobsInProgressResult.count || 0,
      jobsToday: jobsTodayResult.count || 0,
      jobsTomorrow: jobsTomorrowResult.count || 0,
      unscheduledJobs: unscheduledJobsResult.count || 0,
      scheduledThisWeek: scheduledThisWeekResult.count || 0,
      invoicesDraft: invoicesDraftResult.count || 0,
      invoicesUnpaid: invoicesUnpaidResult.count || 0,
      invoicesOverdue: invoicesOverdueResult.count || 0,
      invoicesPaid: invoicesPaidResult.count || 0,
      overdueInvoices: overdueInvoicesTotal,
      overdueInvoicesCount: invoicesOverdueResult.count || 0,
      outstandingRevenue,
      quotesDraft: quotesDraftResult.count || 0,
      quotesAwaiting: quotesAwaitingResult.count || 0,
      quotesAccepted: quotesAcceptedResult.count || 0,
      quotesDeclined: quotesDeclinedResult.count || 0,
      quotesExpiringSoon: quotesExpiringSoonResult.count || 0,
      purchaseOrdersDraft: purchaseOrdersDraftResult.count || 0,
      purchaseOrdersUnbilled: purchaseOrdersUnbilledResult.count || 0,
      purchaseOrdersBilled: purchaseOrdersBilledResult.count || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    })
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
