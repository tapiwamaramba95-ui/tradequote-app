// Email Templates for Sign-Up & Cancellation System
// To be used with Resend, SendGrid, or similar email service

export const welcomeEmail = (name: string, trialEndDate: string) => ({
  subject: 'Welcome to TradeQuote! 🎉',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Welcome to TradeQuote, ${name}! 👋</h1>
      
      <p>Thanks for signing up! You're now on a 14-day free trial (no credit card required).</p>
      
      <p><strong>Your trial ends on ${trialEndDate}</strong></p>
      
      <h2>Get started in 3 steps:</h2>
      <ol>
        <li>Create your first quote (2 min)</li>
        <li>Add a client (1 min)</li>
        <li>Schedule your first job (1 min)</li>
      </ol>
      
      <a href="https://tradequote.com/dashboard" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Get Started →
      </a>
      
      <p>Need help? Just reply to this email - we're here for you!</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const trialReminderDay10 = (name: string, daysLeft: number) => ({
  subject: `⏰ ${daysLeft} days left in your trial`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Hi ${name}!</h1>
      
      <p>Just a friendly reminder - you have <strong>${daysLeft} days left</strong> in your TradeQuote trial.</p>
      
      <h2>Getting the most out of TradeQuote:</h2>
      <ul>
        <li>✅ Send professional quotes in minutes</li>
        <li>✅ Track jobs and schedule work</li>
        <li>✅ Generate invoices and get paid faster</li>
        <li>✅ Manage clients and suppliers in one place</li>
      </ul>
      
      <p>Want to keep using TradeQuote after your trial?</p>
      
      <a href="https://tradequote.com/dashboard/settings/billing" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Choose a Plan
      </a>
      
      <p><strong>Plans start at just $20/month</strong> - less than the cost of one coffee per day!</p>
      
      <p>Need help deciding? Reply to this email and we'll help you choose the right plan.</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const trialReminderDay13 = (name: string) => ({
  subject: '⚠️ Trial ending tomorrow',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Hi ${name},</h1>
      
      <p>Your TradeQuote trial ends tomorrow! ⏰</p>
      
      <p>To keep using TradeQuote and maintain access to all your data:</p>
      
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Choose a Plan Today</h3>
        <p style="margin-bottom: 0;">Plans start at $20/month with no lock-in contract</p>
      </div>
      
      <a href="https://tradequote.com/dashboard/settings/billing" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Choose a Plan Now →
      </a>
      
      <h3>What happens if I don't upgrade?</h3>
      <ul>
        <li>Your account will be moved to read-only mode</li>
        <li>You can reactivate anytime within 30 days</li>
        <li>After 30 days, all data will be permanently deleted</li>
      </ul>
      
      <p>Questions? Just reply to this email.</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const trialEnded = (name: string) => ({
  subject: 'Your TradeQuote trial has ended',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Hi ${name},</h1>
      
      <p>Your 14-day trial has ended.</p>
      
      <p>Your account is now in <strong>read-only mode</strong> - you can view your data but can't create new jobs, quotes, or invoices.</p>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #92400e;">⚠️ Important</h3>
        <p style="margin-bottom: 0;">You have <strong>30 days</strong> to reactivate your account. After 30 days, all your data will be permanently deleted.</p>
      </div>
      
      <a href="https://tradequote.com/dashboard/settings/billing/reactivate" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Reactivate Your Account →
      </a>
      
      <p><strong>Plans start at just $20/month</strong></p>
      
      <h3>Not ready to commit?</h3>
      <p>Reply to this email and let's chat. We're happy to:</p>
      <ul>
        <li>Answer any questions</li>
        <li>Help you get set up properly</li>
        <li>Discuss custom pricing for your needs</li>
      </ul>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const cancellationConfirmation = (name: string, deletionDate: string) => ({
  subject: "We've cancelled your subscription",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Hi ${name},</h1>
      
      <p>We've processed your cancellation request. Sorry to see you go! 😢</p>
      
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">What happens now:</h3>
        <ul>
          <li>✅ You can access your data (read-only) for 30 days</li>
          <li>✅ Export all your data from Settings</li>
          <li>✅ Reactivate anytime within 30 days</li>
          <li>⚠️ After ${deletionDate}, all data will be permanently deleted</li>
        </ul>
      </div>
      
      <a href="https://tradequote.com/dashboard/settings/export" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Export My Data →
      </a>
      
      <h3>Changed your mind?</h3>
      <p>You can reactivate your account anytime in the next 30 days.</p>
      
      <a href="https://tradequote.com/dashboard/settings/billing/reactivate">Reactivate Account</a>
      
      <h3>Help us improve</h3>
      <p>We'd love to know why you cancelled. Reply to this email with your thoughts!</p>
      
      <p>Thank you for trying TradeQuote.</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const winBackDay7 = (name: string) => ({
  subject: 'Miss anything about TradeQuote?',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Hi ${name},</h1>
      
      <p>It's been a week since you cancelled TradeQuote. We wanted to check in!</p>
      
      <h3>💡 Did you know?</h3>
      <p>You can still reactivate your account and get <strong>50% off for 3 months</strong> as a welcome back gift!</p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">50% OFF</div>
        <div style="font-size: 18px; margin-bottom: 16px;">for the next 3 months</div>
        <div style="font-size: 16px; opacity: 0.9;">Just $15/month instead of $30</div>
      </div>
      
      <a href="https://tradequote.com/dashboard/settings/billing/reactivate?offer=50off" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Claim My Discount →
      </a>
      
      <p><strong>Your data is still safe!</strong> You have 23 days left before it's permanently deleted.</p>
      
      <p>Reply to this email if you have any questions or need help!</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})

export const finalDeletionWarning = (name: string, deletionDate: string) => ({
  subject: '⚠️ FINAL NOTICE: Data deletion in 5 days',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">⚠️ FINAL WARNING</h1>
      
      <p>Hi ${name},</p>
      
      <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Your data will be deleted on ${deletionDate}</h3>
        <p style="margin-bottom: 0;">This is your <strong>final chance</strong> to reactivate your account or export your data.</p>
      </div>
      
      <h3>What will be deleted:</h3>
      <ul>
        <li>All jobs, quotes & invoices</li>
        <li>All client information</li>
        <li>All documents and files</li>
        <li>All settings and customizations</li>
      </ul>
      
      <p><strong>This action is permanent and cannot be undone.</strong></p>
      
      <div style="margin: 30px 0;">
        <a href="https://tradequote.com/dashboard/settings/billing/reactivate" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-right: 10px;">
          Reactivate Account
        </a>
        
        <a href="https://tradequote.com/dashboard/settings/export" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          Export Data
        </a>
      </div>
      
      <p>If you have any questions, please reply to this email immediately.</p>
      
      <p>- The TradeQuote Team</p>
    </div>
  `,
})
