// Centralized email sender using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend
 * @param options Email options (to, subject, html)
 * @returns Promise with success status and error if any
 */
export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: 'TradeQuote <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send multiple emails (for batch operations like cron jobs)
 * @param emails Array of email options
 * @returns Promise with results for each email
 */
export async function sendBatchEmails(emails: EmailOptions[]) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - successful

  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}
