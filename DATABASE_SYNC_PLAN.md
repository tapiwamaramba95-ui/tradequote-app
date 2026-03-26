# Database Sync to Production - Action Plan

## Current Status
Your local backup has been restored and the dev server is running at http://localhost:3000.

## What's Deployed on GitHub (Last Commit)
- **Commit**: `25dbc9a` - "Fix AddressInput component bugs"
- **Date**: Recent deployment with full production features
- **Key Components**:
  - Clients, Jobs, Quotes, Invoices (full CRUD)
  - Structured addresses (street_address, suburb, state, postcode)
  - Purchase Orders system
  - Enquiries module
  - Dashboard with stats and action items

## Required Database Tables & Key Fields

### 1. **profiles** (extends auth.users)
- id, email, full_name, company_name
- RLS enabled for user isolation

### 2. **clients** (with structured addresses)
- user_id, name, email, phone, mobile
- **address** (legacy), **street_address**, **suburb**, **state**, **postcode**
- notes, created_at, updated_at

### 3. **jobs** (with structured addresses)
- user_id, job_number, **job_name**, title, status
- client_id (FK to clients)
- scheduled_date, completion_date, total_amount
- **street_address**, **suburb**, **state**, **postcode**
- notes, created_at, updated_at

### 4. **quotes** (with line items)
- user_id, quote_number, client_id, job_id, status
- subtotal, tax, total
- **line_items** (JSONB array)
- terms, valid_until
- view_token, token_expires_at
- sent_at, viewed_at, accepted_at, declined_at
- notes, created_at, updated_at

### 5. **invoices** (with line items)
- user_id, invoice_number, client_id, job_id, status
- issue_date, due_date
- subtotal, tax, total, amount_paid
- **line_items** (JSONB array)
- terms
- view_token, token_expires_at
- notes, created_at, updated_at

### 6. **purchase_orders**
- user_id, reference, supplier_id, status, total
- notes, created_at, updated_at

### 7. **enquiries**
- user_id, client_id, subject, description
- status, priority
- created_at, updated_at

## Critical Fields Added in Production

### Structured Addresses (Migration: 20260310_structured_addresses.sql)
- Replaced single `address` field with:
  - **street_address**: Free-form street address
  - **suburb**: City/suburb
  - **state**: State/province
  - **postcode**: Postal/ZIP code
- Applied to both `clients` and `jobs` tables

### Line Items (Migration: 20260226_add_line_items_to_quotes_invoices.sql)
- **line_items** JSONB column on quotes and invoices
- Stores array of: `[{description, quantity, rate, amount, tax}]`
- Replaces old description-only quotes

### User Isolation
- **user_id** column on ALL tables
- FK to profiles(id) ON DELETE CASCADE
- RLS policies: `auth.uid() = user_id`

## Steps to Sync Supabase

### Option 1: Run Migration Script (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `/db/migrations/20260317_sync_to_production.sql`
3. Execute the script
4. Review verification queries at the end
5. Check for any errors in the output

### Option 2: Run All Migrations in Order
Execute these migrations in sequence:
1. `20260223_complete_setup.sql` (foundation)
2. `20260226_add_line_items_to_quotes_invoices.sql` (line items)
3. `20260310_structured_addresses.sql` (addresses)
4. Any other recent migrations from /db/migrations/

## Verification Checklist

After running migrations, verify:

- [ ] All tables exist (profiles, clients, jobs, quotes, invoices, purchase_orders, enquiries)
- [ ] user_id column exists on all main tables
- [ ] Structured address fields exist (street_address, suburb, state, postcode)
- [ ] line_items JSONB column exists on quotes and invoices
- [ ] RLS policies are enabled and configured
- [ ] Foreign key constraints are properly set
- [ ] Indexes exist for performance (user_id, client_id, job_id)

## Testing After Migration

1. **Login** - Ensure authentication works
2. **Dashboard** - Check stats load (counts for unpaid invoices, pending quotes, etc.)
3. **Clients** - Create/edit client with structured address
4. **Jobs** - Create job linked to client with job address
5. **Quotes** - Create quote with line items
6. **Invoices** - Create invoice with line items
7. **Enquiries** - View enquiries page

## Current App Status

✅ **Dev server running** at http://localhost:3000
✅ **Backup restored** from tradequote-app-BACKUP-2026-03-17-080934
✅ **Sentry disabled** (was causing Turbopack errors)
⚠️ **Database sync pending** - run migration script

## Next Steps

1. **Run the migration script** in Supabase SQL Editor
2. **Verify all tables** have the correct structure
3. **Test the application** with the synced database
4. **If issues persist**, compare production env variables with local .env.local

## Notes

- The last deployment uses Next.js 16.1.6 with Turbopack
- Sentry integration was causing build errors (now commented out in next.config.ts)
- All migrations use `IF NOT EXISTS` and `DO $$` blocks to be idempotent (safe to run multiple times)
- Production uses structured addresses for better data integrity
- Line items allow detailed quotes/invoices instead of single description fields
