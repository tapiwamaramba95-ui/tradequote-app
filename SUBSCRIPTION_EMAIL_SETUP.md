# Subscription Email Integration Guide

## ✅ What's Been Connected

The subscription email system is now fully integrated with Resend! All TODO comments have been replaced with actual email sending.

### Files Created/Modified:
1. **`lib/email-sender.ts`** - Centralized Resend email utility
2. **`app/api/cron/trial-reminders/route.ts`** - Now sends 5 types of emails:
   - Day 10 trial reminders (4 days before expiry)
   - Day 13 trial reminders (1 day before expiry)
   - Trial ended notifications
   - Win-back emails (7 days after cancellation)
   - Final deletion warnings (5 days before deletion)

### Email Templates (Already Existed in `lib/emails.ts`):
- ✅ `welcomeEmail()` - Welcome new users
- ✅ `trialReminderDay10()` - 4 days before trial ends
- ✅ `trialReminderDay13()` - 1 day before trial ends
- ✅ `trialEnded()` - Trial expired notification
- ✅ `cancellationConfirmation()` - After cancellation
- ✅ `winBackDay7()` - 7 days after cancellation (with 50% off offer)
- ✅ `finalDeletionWarning()` - 5 days before data deletion

## 🚀 Deployment Steps

### 1. Set Environment Variable

The cron job requires a secret for authentication. Add to your `.env.local` and production environment:

```bash
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```powershell
# PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
```

### 2. Deploy to Vercel with Cron

Create or update `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/data-deletion",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Format:**
- Trial reminders: `0 10 * * *` = Daily at 10:00 AM UTC
- Data deletion: `0 2 * * *` = Daily at 2:00 AM UTC

### 3. Add CRON_SECRET to Vercel

```bash
vercel env add CRON_SECRET
# Paste your secret when prompted
# Select: Production, Preview, Development
```

Or via Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `CRON_SECRET` with your generated value
3. Apply to Production, Preview, and Development

### 4. Deploy

```bash
git add .
git commit -m "Connect subscription emails to Resend"
git push

# Or deploy directly
vercel --prod
```

## 🧪 Testing the Cron Job

### Option 1: Manual Testing (Recommended)

Test the endpoint directly before deploying:

```powershell
# Replace YOUR_SECRET with your CRON_SECRET value
$headers = @{
    "Authorization" = "Bearer YOUR_SECRET"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/cron/trial-reminders" -Headers $headers -Method GET
```

Expected response:
```json
{
  "success": true,
  "day10Reminders": 0,
  "day13Reminders": 0,
  "expiredTrials": 0,
  "winBackEmails": 0,
  "deletionWarnings": 0
}
```

### Option 2: Test with Test Users

1. Create a test user in your database
2. Manually set `trial_ends_at` to test different scenarios:

```sql
-- Test Day 10 reminder (4 days from now)
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '4 days',
    subscription_status = 'trial'
WHERE email = 'test@example.com';

-- Test Day 13 reminder (1 day from now)
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '1 day',
    subscription_status = 'trial'
WHERE email = 'test@example.com';

-- Test expired trial
UPDATE profiles 
SET trial_ends_at = NOW() - INTERVAL '1 day',
    subscription_status = 'trial'
WHERE email = 'test@example.com';

-- Test win-back (7 days after cancellation)
UPDATE profiles 
SET cancelled_at = NOW() - INTERVAL '7 days',
    subscription_status = 'cancelled'
WHERE email = 'test@example.com';

-- Test deletion warning (5 days before deletion)
UPDATE profiles 
SET deletion_scheduled_at = NOW() + INTERVAL '5 days',
    subscription_status = 'cancelled'
WHERE email = 'test@example.com';
```

3. Run the cron endpoint manually (see Option 1)
4. Check if email arrived at test@example.com

### Option 3: Test in Production

After deploying to Vercel with cron configuration:

```powershell
# Test production endpoint
$headers = @{
    "Authorization" = "Bearer YOUR_PRODUCTION_SECRET"
}

Invoke-WebRequest -Uri "https://your-app.vercel.app/api/cron/trial-reminders" -Headers $headers -Method GET
```

## 📊 Monitoring

### Check Cron Logs in Vercel:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → Functions
3. Find `/api/cron/trial-reminders`
4. View logs and invocation history

### Check Email Delivery:
1. Go to Resend Dashboard (resend.com)
2. Navigate to Emails
3. View sent emails, delivery status, and bounces

## 🔧 Troubleshooting

### Emails Not Sending:
- ✅ Check `RESEND_API_KEY` is set correctly
- ✅ Verify "from" address is verified in Resend
- ✅ Check Resend dashboard for errors
- ✅ Review cron job logs in Vercel

### Cron Not Running:
- ✅ Verify `CRON_SECRET` is set in Vercel
- ✅ Check `vercel.json` is in project root
- ✅ Ensure you've deployed to production (crons only run in production)
- ✅ Verify Vercel plan supports cron jobs

### Wrong Timezone:
- Cron runs in UTC by default
- Adjust schedule in `vercel.json` to match your desired local time
- Example: For 10 AM EST (UTC-5), use `0 15 * * *` (3 PM UTC)

## 📝 Next Steps (Optional)

### Additional Features to Build:

1. **Welcome Email on Signup**
   - Add to signup/onboarding flow
   - Use `emails.welcomeEmail()` template
   - Call `sendEmail()` from `lib/email-sender`

2. **Cancellation Confirmation**
   - Add to cancellation page (when built)
   - Use `emails.cancellationConfirmation()` template
   - Send immediately after user confirms cancellation

3. **Email Preferences**
   - Add user preferences for notifications
   - Allow users to opt-out of marketing emails
   - Keep transactional emails (trial ending, deletion warnings)

4. **Analytics Dashboard**
   - Track email open rates
   - Monitor trial-to-paid conversion
   - Win-back campaign effectiveness

## 🎯 Current Status

✅ **Ready for Production**
- Email templates connected to Resend
- Cron job sends 5 automated email types
- Centralized email utility for consistency
- Error handling and logging in place

⏸️ **Pending (Manual Setup Required)**
- Set CRON_SECRET environment variable
- Deploy with vercel.json cron configuration
- Test with real users or test data

🔜 **Future Enhancements**
- Build cancellation UI pages
- Add welcome email to signup flow
- Implement email preferences/unsubscribe
- Add Stripe subscription webhooks (when Stripe account created)
