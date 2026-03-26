/**
 * Auto-invoicing Logic for Recurring Jobs
 * Automatically creates invoices when jobs complete or on schedule
 */

import { createClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email-sender'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter,
  addDays,
  format
} from 'date-fns'
import type { LineItem } from './types'

/**
 * Handle job completion - check if auto-invoicing should trigger
 * Called when a job status changes to 'completed'
 */
export async function handleJobCompletion(jobId: string) {
  const supabase = await createClient()
  
  // Get job details
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      recurring_jobs (*)
    `)
    .eq('id', jobId)
    .single()
  
  if (!job || !job.is_recurring_instance) {
    console.log('Job is not a recurring instance, skipping auto-invoice check')
    return // Not a recurring job instance
  }
  
  const recurringJob = job.recurring_jobs
  
  if (!recurringJob || !recurringJob.auto_invoice) {
    console.log('Auto-invoicing not enabled for this recurring job')
    return // Auto-invoicing not enabled
  }
  
  // Handle based on invoice timing
  switch (recurringJob.invoice_timing) {
    case 'on_completion':
      await createInvoiceForInstance(job)
      break
      
    case 'batch_monthly':
    case 'batch_quarterly':
      // Check if it's batch invoice day
      const today = new Date()
      if (today.getDate() === recurringJob.invoice_batch_day) {
        await checkAndCreateBatchInvoice(recurringJob, job)
      }
      break
      
    default:
      console.log(`Unknown invoice timing: ${recurringJob.invoice_timing}`)
      break
  }
}

/**
 * Create invoice for a single job instance
 */
async function createInvoiceForInstance(job: any) {
  const supabase = await createClient()
  
  console.log(`Creating invoice for job instance ${job.id}`)
  
  // Check if invoice already exists for this job
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('job_id', job.id)
    .single()
  
  if (existingInvoice) {
    console.log(`Invoice already exists for job ${job.id}`)
    return existingInvoice
  }
  
  // Calculate totals
  const lineItems = job.line_items || []
  const subtotal = calculateSubtotal(lineItems)
  const taxAmount = calculateTax(lineItems)
  const totalAmount = calculateTotal(lineItems)
  
  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      business_id: job.business_id,
      client_id: job.client_id,
      job_id: job.id,
      line_items: lineItems,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'sent',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd')
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create invoice:', error)
    throw new Error(`Failed to create invoice: ${error.message}`)
  }
  
  if (invoice) {
    console.log(`Invoice ${invoice.id} created for job ${job.id}`)
    
    // Get client details for email
    const { data: client } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', job.client_id)
      .single()
    
    if (client?.email) {
      await sendInvoiceEmail(invoice, client)
    }
  }
  
  return invoice
}

/**
 * Check if it's time to create a batch invoice and do so if needed
 */
async function checkAndCreateBatchInvoice(recurringJob: any, triggeringJob: any) {
  const today = new Date()
  const shouldCreateBatch = today.getDate() === recurringJob.invoice_batch_day
  
  if (!shouldCreateBatch) {
    console.log('Not batch invoice day yet')
    return
  }
  
  const supabase = await createClient()
  
  // Determine period
  const periodStart = recurringJob.invoice_timing === 'batch_monthly'
    ? startOfMonth(today)
    : startOfQuarter(today)
  
  const periodEnd = recurringJob.invoice_timing === 'batch_monthly'
    ? endOfMonth(today)
    : endOfQuarter(today)
  
  console.log(`Checking for batch invoice from ${format(periodStart, 'yyyy-MM-dd')} to ${format(periodEnd, 'yyyy-MM-dd')}`)
  
  // Check if batch invoice already exists for this period
  const { data: existingBatch } = await supabase
    .from('recurring_invoice_batches')
    .select('id')
    .eq('recurring_job_id', recurringJob.id)
    .eq('batch_period_start', format(periodStart, 'yyyy-MM-dd'))
    .eq('batch_period_end', format(periodEnd, 'yyyy-MM-dd'))
    .single()
  
  if (existingBatch) {
    console.log('Batch invoice already exists for this period')
    return
  }
  
  // Get all completed instances in period
  const { data: instances } = await supabase
    .from('jobs')
    .select('*')
    .eq('recurring_job_id', recurringJob.id)
    .eq('status', 'completed')
    .gte('completion_date', format(periodStart, 'yyyy-MM-dd'))
    .lte('completion_date', format(periodEnd, 'yyyy-MM-dd'))
  
  if (!instances || instances.length === 0) {
    console.log('No completed instances in this period')
    return
  }
  
  console.log(`Found ${instances.length} completed instances for batch invoice`)
  
  // Combine line items from all instances
  const combinedLineItems = instances.flatMap((i: any) => i.line_items || [])
  
  // Calculate totals
  const subtotal = calculateSubtotal(combinedLineItems)
  const taxAmount = calculateTax(combinedLineItems)
  const totalAmount = calculateTotal(combinedLineItems)
  
  // Create batch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      business_id: recurringJob.business_id,
      client_id: recurringJob.client_id,
      line_items: combinedLineItems,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'sent',
      issue_date: format(today, 'yyyy-MM-dd'),
      due_date: format(addDays(today, 14), 'yyyy-MM-dd')
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create batch invoice:', error)
    throw new Error(`Failed to create batch invoice: ${error.message}`)
  }
  
  if (invoice) {
    console.log(`Batch invoice ${invoice.id} created for ${instances.length} instances`)
    
    // Track batch
    await supabase
      .from('recurring_invoice_batches')
      .insert({
        recurring_job_id: recurringJob.id,
        invoice_id: invoice.id,
        job_instance_ids: instances.map((i: any) => i.id),
        instance_count: instances.length,
        batch_period_start: format(periodStart, 'yyyy-MM-dd'),
        batch_period_end: format(periodEnd, 'yyyy-MM-dd')
      })
    
    // Get client details for email
    const { data: client } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', recurringJob.client_id)
      .single()
    
    if (client?.email) {
      await sendInvoiceEmail(invoice, client, instances.length)
    }
  }
  
  return invoice
}

/**
 * Calculate subtotal from line items
 */
function calculateSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price)
  }, 0)
}

/**
 * Calculate total tax from line items
 */
function calculateTax(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price
    const itemTax = itemTotal * (item.tax_rate / 100)
    return sum + itemTax
  }, 0)
}

/**
 * Calculate total amount (subtotal + tax)
 */
function calculateTotal(lineItems: LineItem[]): number {
  return calculateSubtotal(lineItems) + calculateTax(lineItems)
}

/**
 * Send invoice email to client
 */
async function sendInvoiceEmail(
  invoice: any, 
  client: { name: string; email: string },
  instanceCount?: number
) {
  const batchText = instanceCount ? ` (${instanceCount} jobs)` : ''
  
  try {
    await sendEmail({
      to: client.email,
      subject: `Invoice from Your Service Provider${batchText}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .invoice-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #f97316; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Invoice${batchText}</h1>
            </div>
            <div class="content">
              <p>Hi ${client.name},</p>
              
              <p>Your invoice is ready for payment.</p>
              
              ${instanceCount ? `<p><strong>This invoice covers ${instanceCount} completed jobs.</strong></p>` : ''}
              
              <div class="invoice-info">
                <p><strong>Invoice Amount:</strong></p>
                <div class="amount">$${invoice.total_amount.toFixed(2)}</div>
                <p style="margin-top: 15px;"><strong>Due Date:</strong> ${format(new Date(invoice.due_date), 'dd MMMM yyyy')}</p>
              </div>
              
              <p>You can view and pay your invoice by clicking the button below:</p>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}" class="button">
                  View Invoice
                </a>
              </center>
              
              <p>Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    console.log(`Invoice email sent to ${client.email}`)
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    // Don't throw - invoice was created successfully, email is secondary
  }
}

/**
 * Process all recurring jobs that need batch invoicing today
 * Called from cron job
 */
export async function processBatchInvoices() {
  const supabase = await createClient()
  const today = new Date()
  const todayDay = today.getDate()
  
  console.log(`Processing batch invoices for day ${todayDay}`)
  
  // Get all active recurring jobs with batch invoicing enabled for today
  const { data: recurringJobs } = await supabase
    .from('recurring_jobs')
    .select('*')
    .eq('status', 'active')
    .eq('auto_invoice', true)
    .in('invoice_timing', ['batch_monthly', 'batch_quarterly'])
    .eq('invoice_batch_day', todayDay)
  
  if (!recurringJobs || recurringJobs.length === 0) {
    console.log('No recurring jobs need batch invoicing today')
    return
  }
  
  console.log(`Found ${recurringJobs.length} recurring jobs for batch invoicing`)
  
  const results = []
  
  for (const recurringJob of recurringJobs) {
    try {
      const invoice = await checkAndCreateBatchInvoice(recurringJob, null)
      if (invoice) {
        results.push({ recurringJobId: recurringJob.id, invoiceId: invoice.id, success: true })
      }
    } catch (error) {
      console.error(`Error processing batch invoice for recurring job ${recurringJob.id}:`, error)
      results.push({ recurringJobId: recurringJob.id, success: false, error })
    }
  }
  
  return results
}
