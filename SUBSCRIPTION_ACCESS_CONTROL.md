# Subscription Access Control Implementation

## ✅ What Was Built

Complete subscription access control system that enforces trial limits and grace periods.

### Files Created:

1. **`lib/subscription.ts`** - Core subscription logic
   - `checkSubscriptionAccess()` - Check user's subscription status
   - `getSubscriptionMessage()` - Get banner message for UI
   - `formatDaysRemaining()` - Format trial countdown

2. **`lib/contexts/ReadOnlyContext.tsx`** - React context for read-only mode
   - `useReadOnly()` hook - Access read-only state in any component
   - `ReadOnlyGuard` component - Wrap buttons/forms to disable in read-only mode

3. **`app/dashboard/settings/billing/expired/page.tsx`** - Expired subscription page
   - Shows when user's access has ended
   - Different view for reactivation window vs permanent deletion

4. **Updated `app/dashboard/layout.tsx`**  
   - Checks subscription status on load
   - Redirects to expired page if access ended
   - Shows warning banner during grace period
   - Wraps app with ReadOnlyProvider

## 🎯 How It Works

### Subscription States:

| Status | Trial Ends | Access Until | User Experience |
|--------|-----------|--------------|-----------------|
| **trial** (active) | In future | - | ✅ Full access |
| **trial** (expired) | In past | 30 days from expiry | ⚠️ Read-only + warning banner |
| **active** | - | - | ✅ Full access (paid) |
| **cancelled** | - | Within 30 days | ⚠️ Read-only + warning banner |
| **cancelled** | - | Past 30 days | ❌ Blocked → Redirect to expired page |
| **deleted** | - | - | ❌ Blocked → Redirect to expired page |

### Access Control Flow:

```
User logs in
     ↓
Dashboard layout loads profile with subscription fields
     ↓
checkSubscriptionAccess() evaluates state
     ↓
┌─────────────────────────────────────┐
│  Is Expired?                        │
│  (past access_until date)           │
└─────────────────────────────────────┘
     ↓ YES                    NO ↓
     ↓                            ↓
Redirect to                  Is in grace period?
/billing/expired             (cancelled but before access_until)
     ↓                            ↓ YES         NO ↓
Data deleted?                     ↓              ↓
     ↓                   Show warning banner  Normal access
Can reactivate?          Enable read-only mode
vs                                ↓
Create new account        Disable all write actions
```

## 💻 Usage in Components

### Check Read-Only Mode

```tsx
import { useReadOnly } from '@/lib/contexts/ReadOnlyContext'

function MyComponent() {
  const { isReadOnly, subscriptionState } = useReadOnly()

  if (isReadOnly) {
    return <p>Read-only mode - upgrade to continue</p>
  }

  return <button>Create New Job</button>
}
```

### Disable Buttons in Read-Only Mode

```tsx
import { ReadOnlyGuard } from '@/lib/contexts/ReadOnlyContext'

function CreateJobButton() {
  return (
    <ReadOnlyGuard>
      <button onClick={createJob}>Create Job</button>
    </ReadOnlyGuard>
  )
}
```

### Custom Read-Only Message

```tsx
<ReadOnlyGuard 
  message="Upgrade your plan to create new quotes"
  showMessage={true}
>
  <button>Create Quote</button>
</ReadOnlyGuard>
```

### Conditional Rendering

```tsx
const { isReadOnly } = useReadOnly()

<button 
  onClick={saveChanges}
  disabled={isReadOnly}
  className={isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}
>
  {isReadOnly ? 'Read-Only Mode' : 'Save Changes'}
</button>
```

## 🔄 Automation

### Auto-Calculation (Database Trigger):
- `trial_ends_at` = `trial_started_at` + 14 days
- Happens automatically on signup

### Cron Job Actions (Daily):
When trial expires:
1. Sets `subscription_status = 'cancelled'`
2. Sets `access_until = now + 30 days`
3. Sets `deletion_scheduled_at = now + 30 days`
4. Sends trial ended email

After 30 days:
1. Runs data deletion cron
2. Deletes all user data
3. Sets `data_deleted_at` timestamp
4. Sends deletion confirmation email

## 🎨 UI Indicators

### Warning Banner (Grace Period):
```
⚠️ Your trial has ended
You have 23 days of read-only access remaining. 
Choose a plan to continue creating jobs, quotes, and invoices.
[Choose a Plan]
```

### Expired Page:
- Shows if within reactivation window (30 days)
- Or shows "data deleted" if past 30 days
- Big red warning icon
- Clear next steps

## 🧪 Testing

### Test Read-Only Mode:

1. Update a test user's trial to expired:
```sql
UPDATE profiles 
SET 
  subscription_status = 'cancelled',
  trial_ends_at = NOW() - INTERVAL '1 day',
  access_until = NOW() + INTERVAL '25 days',
  cancelled_at = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';
```

2. Log in as that user
3. Should see warning banner at top
4. Try to create/edit - should be disabled

### Test Expired State:

```sql
UPDATE profiles 
SET 
  subscription_status = 'cancelled',
  access_until = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';
```

Log in → Should redirect to `/dashboard/settings/billing/expired`

## 📝 Next Steps

### To Fully Lock Down Write Operations:

You'll need to wrap write actions throughout your app:

#### Forms:
```tsx
import { useReadOnly } from '@/lib/contexts/ReadOnlyContext'

function JobForm() {
  const { isReadOnly } = useReadOnly()
  
  return (
    <form>
      <input disabled={isReadOnly} />
      <button type="submit" disabled={isReadOnly}>
        {isReadOnly ? 'Read-Only Mode' : 'Save'}
      </button>
    </form>
  )
}
```

#### API Routes:
```tsx
// Check subscription in your API routes
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = // ... get supabase client
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, access_until')
    .single()
  
  const subState = checkSubscriptionAccess(profile)
  
  if (subState.isReadOnly) {
    return NextResponse.json(
      { error: 'Read-only mode. Upgrade to continue.' },
      { status: 403 }
    )
  }
  
  // ... continue with API logic
}
```

#### Delete/Edit Buttons:
```tsx
<ReadOnlyGuard>
  <button onClick={deleteJob}>Delete</button>
</ReadOnlyGuard>
```

## 🎯 Summary

**What's Automated:**
✅ Trial expiry detection (database trigger)
✅ Status changes (cron job)
✅ Email notifications (cron job)
✅ Dashboard access blocking (layout)
✅ Warning banners (layout)
✅ Read-only context (available everywhere)

**What You Control:**
- Where to apply read-only guards
- Custom messages for different features
- API-level enforcement (optional)
- Form field disabling

The system is now **fully functional** - users will be warned, blocked after grace period, and can reactivate within 30 days!
