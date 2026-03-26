/**
 * Cron Job: Generate Recurring Job Instances
 * Runs daily to auto-generate job instances for active recurring jobs
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-recurring-jobs",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateRecurringJobInstances } from '@/lib/recurring-jobs/generate'
import { processBatchInvoices } from '@/lib/recurring-jobs/auto-invoice'

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('Starting recurring jobs cron...')
  
  const supabase = await createClient()
  
  try {
    // 1. Get all active recurring jobs
    const { data: recurringJobs, error } = await supabase
      .from('recurring_jobs')
      .select('id, title, status')
      .eq('status', 'active')
    
    if (error) {
      console.error('Error fetching recurring jobs:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch recurring jobs' 
      }, { status: 500 })
    }
    
    if (!recurringJobs || recurringJobs.length === 0) {
      console.log('No active recurring jobs found')
      return NextResponse.json({ 
        success: true,
        message: 'No active recurring jobs to process',
        generated: 0,
        processed: 0
      })
    }
    
    console.log(`Found ${recurringJobs.length} active recurring jobs`)
    
    // 2. Generate instances for each recurring job
    let totalGenerated = 0
    const results = []
    
    for (const job of recurringJobs) {
      try {
        console.log(`Processing recurring job: ${job.title} (${job.id})`)
        const instances = await generateRecurringJobInstances(job.id)
        totalGenerated += instances.length
        
        results.push({
          recurringJobId: job.id,
          title: job.title,
          generated: instances.length,
          success: true
        })
        
        console.log(`Generated ${instances.length} instances for ${job.title}`)
      } catch (error) {
        console.error(`Error generating instances for ${job.id}:`, error)
        results.push({
          recurringJobId: job.id,
          title: job.title,
          generated: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // 3. Process batch invoices (if any are due today)
    console.log('Processing batch invoices...')
    let batchInvoicesProcessed = 0
    
    try {
      const batchResults = await processBatchInvoices()
      batchInvoicesProcessed = batchResults?.length || 0
      console.log(`Processed ${batchInvoicesProcessed} batch invoices`)
    } catch (error) {
      console.error('Error processing batch invoices:', error)
    }
    
    // Return summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalRecurringJobs: recurringJobs.length,
        totalInstancesGenerated: totalGenerated,
        batchInvoicesProcessed: batchInvoicesProcessed,
        successfulJobs: results.filter(r => r.success).length,
        failedJobs: results.filter(r => !r.success).length
      },
      results: results
    }
    
    console.log('Cron completed:', summary)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('Fatal error in cron job:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
