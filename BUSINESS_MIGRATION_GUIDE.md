# 🏢 BUSINESS MULTI-TENANCY MIGRATION GUIDE

## ✅ What Was Changed

### **Database:**
1. ✅ Created `businesses` table
2. ✅ Created `user_businesses` junction table with permissions
3. ✅ Added `business_id` to all data tables
4. ✅ Migrated existing users → 1 business per user
5. ✅ Enabled Row Level Security (RLS) with business-scoped policies
6. ✅ Created helper functions for permissions

### **Application:**
1. ✅ Created `/lib/business.ts` - Business context utilities
2. ✅ Created `/lib/hooks/useBusiness.ts` - React hooks for business/permissions
3. ⏳ **TODO:** Update all queries from `user_id` to `business_id`

---

## 🔧 How to Update Your Code

### **BEFORE (User-based):**
```typescript
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('user_id', user.id)  // ❌ OLD WAY
```

### **AFTER (Business-based):**
```typescript
import { getBusinessId } from '@/lib/business'

const businessId = await getBusinessId()
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('business_id', businessId)  // ✅ NEW WAY
```

---

## 📝 Files That Need Updating

### **1. Dashboard Page** (`app/dashboard/page.tsx`)

**OLD:**
```typescript
const { data } = await supabase
  .from('invoices')
  .select('status, payment_status, total_amount, due_date')
  .eq('user_id', userId)
```

**NEW:**
```typescript
import { getBusinessId } from '@/lib/business'

const businessId = await getBusinessId()
const { data } = await supabase
  .from('invoices')
  .select('status, payment_status, total_amount, due_date')
  .eq('business_id', businessId)
```

**Also update:**
- Line ~89: `supabase.from('invoices').select(...).eq('user_id', userId)` → `.eq('business_id', businessId)`
- Line ~90: `supabase.from('quotes').select(...).eq('user_id', userId)` → `.eq('business_id', businessId)`
- Line ~91: `supabase.from('purchase_orders').select(...).eq('user_id', userId)` → `.eq('business_id', businessId)`
- Line ~92: `supabase.from('jobs').select(...).eq('user_id', userId)` → `.eq('business_id', businessId)`
- Line ~153: Overdue invoices query
- Line ~177: Expiring quotes query
- Line ~203: Unscheduled jobs query
- Line ~226: Today's jobs query

---

### **2. Invoices Page** (`app/dashboard/invoices/page.tsx`)

**Find and replace:**
```typescript
// OLD:
.eq('user_id', user.id)

// NEW:
import { getBusinessId } from '@/lib/business'
const businessId = await getBusinessId()
.eq('business_id', businessId)
```

**Also check:**
- Invoice creation: Set `business_id` instead of `user_id`
- Invoice updates: Filter by `business_id`

---

### **3. Jobs Page** (`app/dashboard/jobs/page.tsx`)

Same pattern - replace all `user_id` with `business_id`

---

### **4. Quotes Page** (`app/dashboard/quotes/page.tsx`)

Same pattern - replace all `user_id` with `business_id`

---

### **5. Clients Page** (`app/dashboard/clients/page.tsx`)

Same pattern - replace all `user_id` with `business_id`

---

### **6. Enquiries Page** (`app/dashboard/enquiries/page.tsx`)

Same pattern - replace all `user_id` with `business_id`

---

### **7. Purchase Orders Page** (`app/dashboard/purchase-orders/page.tsx`)

Same pattern - replace all `user_id` with `business_id`

---

## 🎯 Using Hooks in Components

### **Example: Jobs Page with Permission Check**

```typescript
'use client'

import { useBusinessId, usePermission } from '@/lib/hooks/useBusiness'

export default function JobsPage() {
  const { businessId, loading } = useBusinessId()
  const { hasPermission } = usePermission('can_access_jobs')
  
  // Redirect if no access
  if (!loading && !hasPermission) {
    return <div>You don't have permission to view jobs</div>
  }

  // Use businessId in queries
  useEffect(() => {
    if (businessId) {
      fetchJobs(businessId)
    }
  }, [businessId])
  
  const fetchJobs = async (businessId: string) => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId)
    
    setJobs(data || [])
  }
}
```

---

## 🔐 Permission-Based UI

### **Hide features based on permissions:**

```typescript
import { usePermission } from '@/lib/hooks/useBusiness'

export default function InvoicesPage() {
  const { hasPermission: canInvoice } = usePermission('can_access_invoicing')
  
  return (
    <div>
      {canInvoice ? (
        <button>Create Invoice</button>
      ) : (
        <p>You don't have permission to create invoices</p>
      )}
    </div>
  )
}
```

### **Owner/Admin-only features:**

```typescript
import { useIsOwnerOrAdmin } from '@/lib/hooks/useBusiness'

export default function SettingsPage() {
  const { isOwnerOrAdmin } = useIsOwnerOrAdmin()
  
  if (!isOwnerOrAdmin) {
    return <div>Only owners and admins can access settings</div>
  }
  
  return <div>Settings content...</div>
}
```

---

## 📋 Search & Replace Checklist

Run these searches in VS Code to find all instances:

1. **Search:** `.eq('user_id',`
   - **Replace with:** `.eq('business_id',`
   - **Files:** All `app/dashboard/**/*.tsx` files

2. **Search:** `user_id: user.id`
   - **Review each:** Some create operations
   - **Action:** Remove `user_id`, add `business_id`

3. **Search:** `getUser()`
   - **Review each:** Some may need `getBusinessId()` instead

---

## 🚀 New Signup Flow

When a new user signs up, create their business:

```typescript
// During signup/onboarding
import { supabase } from '@/lib/supabase'

const createBusinessForNewUser = async (userId: string, businessName: string) => {
  // 1. Create business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      name: businessName,
    })
    .select()
    .single()

  if (businessError) throw businessError

  // 2. Link user to business as owner
  const { error: linkError } = await supabase
    .from('user_businesses')
    .insert({
      user_id: userId,
      business_id: business.id,
      role: 'owner',
      // All permissions true for owner
      can_access_timesheets: true,
      can_access_jobs: true,
      can_access_invoicing: true,
      can_access_quoting: true,
      can_access_purchases: true,
      can_access_reports: true,
      can_access_scheduling: true,
      can_access_enquiries: true,
      can_access_staff_tracking: true,
      can_access_settings: true,
      can_access_staff_members: true,
      can_access_billing: true,
      joined_at: new Date().toISOString(),
    })

  if (linkError) throw linkError

  return business
}
```

---

## 👥 Team Invitation Flow

To invite team members:

```typescript
import { inviteUserToBusiness } from '@/lib/business'

// Send invitation
await inviteUserToBusiness('new-user@example.com', 'member')

// Or create user_businesses record with specific permissions
const { error } = await supabase
  .from('user_businesses')
  .insert({
    user_id: newUserId,
    business_id: businessId,
    role: 'member',
    can_access_jobs: true,
    can_access_invoicing: true,
    can_access_quoting: true,
    // Other permissions false by default
  })
```

---

## ⚠️ Important Notes

1. **RLS is enabled** - Supabase will automatically filter by business_id based on the user's `user_businesses` record

2. **Old data migrated** - Existing users got their own business created automatically

3. **user_id still exists** - Keep it on tables for audit trails, but filter by `business_id`

4. **Permissions are enforced** - Both in database (RLS) and application (hooks)

---

## 🧪 Testing

After migration, test:

1. ✅ Can see all data from your business
2. ✅ Cannot see data from other businesses
3. ✅ Permission-restricted features are hidden
4. ✅ Owners can invite new users
5. ✅ New users can only see business data
6. ✅ Permission changes take effect immediately

---

## 🎯 Next Steps

1. **Run the migration SQL** in Supabase SQL editor
2. **Update all queries** from user_id → business_id (see checklist above)
3. **Add permission checks** to sensitive UI components
4. **Test thoroughly** with multiple users
5. **Add team invitation UI** for owners/admins
6. **Update onboarding** to create business for new signups

---

## 💡 Benefits

✅ **Multi-user businesses** - Team members share data
✅ **Granular permissions** - Control who sees what
✅ **Better scaling** - Business-based billing and features
✅ **Data isolation** - RLS ensures security
✅ **Future-proof** - Ready for enterprise features
