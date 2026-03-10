# Vercel Deployment Guide

## Prerequisites

1. Vercel account (free or paid)
2. Supabase project set up with all migrations run
3. Stripe account (optional - for payments)
4. Resend account (optional - for emails)

## Quick Start

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Production

```bash
vercel --prod
```

The CLI will guide you through:
- Linking to existing project or creating new one
- Setting up environment variables
- Choosing region (Sydney: syd1)

## Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

### Required (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Required (Site)
```
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
CRON_SECRET=generate_random_32_char_string
```

### Optional (Stripe)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Optional (Email)
```
RESEND_API_KEY=re_...
```

## Post-Deployment Steps

### 1. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: 
  - `https://your-app.vercel.app/**`
  - `https://your-app.vercel.app/auth/callback`

### 2. Run Database Migrations (if not already done)

Go to Supabase Dashboard → SQL Editor and run:
- `db/migrations/20260308_dashboard_actions.sql`

This creates the `client_communications` table and adds action tracking columns.

### 3. Test Your Deployment

- [ ] Visit your production URL
- [ ] Test sign up / login
- [ ] Create a client
- [ ] Create a job/enquiry
- [ ] Create a quote
- [ ] Test sending quote
- [ ] Test dashboard action buttons

## Troubleshooting

### Build Errors
```bash
# Test build locally first
npm run build
```

### Environment Variable Issues
- Ensure all variables are set for Production environment
- Redeploy after adding variables: `vercel --prod`

### Authentication Issues
- Check Supabase redirect URLs match exactly
- Verify NEXT_PUBLIC_SITE_URL is correct

### CRON Job Not Running
- Verify CRON_SECRET is set
- Check Vercel logs for cron execution

## Custom Domain (Optional)

In Vercel Dashboard → Project → Settings → Domains:
1. Add your custom domain
2. Update DNS records as instructed
3. Update NEXT_PUBLIC_SITE_URL
4. Update Supabase redirect URLs

## Monitoring

- **Logs**: Vercel Dashboard → Project → Logs
- **Analytics**: Vercel Dashboard → Project → Analytics
- **Performance**: Vercel Dashboard → Project → Speed Insights

## Development vs Production

- **Development**: `npm run dev` (uses .env.local)
- **Preview**: Push to branch, auto-deploys preview
- **Production**: `vercel --prod` or push to main branch (if GitHub connected)
