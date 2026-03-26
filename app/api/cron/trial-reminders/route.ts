import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email-sender'
import * as emails from '@/lib/emails'

// This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
// Example cron setup in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/trial-reminders",
//     "schedule": "0 10 * * *"
//   }]
// }

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin access
    )

    const now = new Date()

    // Find trials ending in 4 days (Day 10 reminder)
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
    const { data: day10Users } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', fourDaysFromNow.toISOString())
      .lt('trial_ends_at', new Date(fourDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString())

    // Send Day 10 reminder emails
    if (day10Users && day10Users.length > 0) {
      for (const user of day10Users) {
        const daysLeft = 4
        const emailContent = emails.trialReminderDay10(user.full_name || 'there', daysLeft)
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
    console.log(`Day 10 reminders sent: ${day10Users?.length || 0} users`)

    // Find trials ending tomorrow (Day 13 reminder)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const { data: day13Users } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', tomorrow.toISOString())
      .lt('trial_ends_at', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString())

    // Send Day 13 reminder emails
    if (day13Users && day13Users.length > 0) {
      for (const user of day13Users) {
        const emailContent = emails.trialReminderDay13(user.full_name || 'there')
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
    console.log(`Day 13 reminders sent: ${day13Users?.length || 0} users`)

    // Find expired trials
    const { data: expiredUsers } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now.toISOString())

    // Update to cancelled status
    if (expiredUsers && expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            cancelled_at: now.toISOString(),
            access_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            deletion_scheduled_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', user.id)

        // Send trial ended email
        const emailContent = emails.trialEnded(user.full_name || 'there')
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
        console.log(`Trial ended email sent to: ${user.email}`)
      }
    }

    // Find cancelled users for win-back emails (Day 7)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: winBackUsers } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'cancelled')
      .gte('cancelled_at', sevenDaysAgo.toISOString())
      .lt('cancelled_at', new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString())

    // Send win-back emails
    if (winBackUsers && winBackUsers.length > 0) {
      for (const user of winBackUsers) {
        const emailContent = emails.winBackDay7(user.full_name || 'there')
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
    console.log(`Win-back emails sent: ${winBackUsers?.length || 0} users`)

    // Find users approaching deletion (5 days warning)
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const { data: deletionWarningUsers } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'cancelled')
      .gte('deletion_scheduled_at', fiveDaysFromNow.toISOString())
      .lt('deletion_scheduled_at', new Date(fiveDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .is('data_deleted_at', null)

    // Send final deletion warning emails
    if (deletionWarningUsers && deletionWarningUsers.length > 0) {
      for (const user of deletionWarningUsers) {
        const deletionDate = new Date(user.deletion_scheduled_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        const emailContent = emails.finalDeletionWarning(user.full_name || 'there', deletionDate)
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
    console.log(`Deletion warnings sent: ${deletionWarningUsers?.length || 0} users`)

    return NextResponse.json({
      success: true,
      day10Reminders: day10Users?.length || 0,
      day13Reminders: day13Users?.length || 0,
      expiredTrials: expiredUsers?.length || 0,
      winBackEmails: winBackUsers?.length || 0,
      deletionWarnings: deletionWarningUsers?.length || 0,
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
