# 🚀 Hybrid Onboarding System - Testing Checklist

## Overview
This checklist helps you test the complete hybrid onboarding system implementation, including the full-screen wizard, persistent dashboard widget, automatic progress tracking, and database integration.

## 📋 Pre-Testing Setup

### 1. Database Migration
```bash
# Run the onboarding migration
node run-onboarding-migration.js
```

**Expected Results:**
- ✅ `onboarding_progress` table created
- ✅ RLS policies applied
- ✅ Triggers and functions created
- ✅ Existing users initialized with current progress

### 2. Environment Check
Verify these files exist:
- ✅ `app/onboarding/page.tsx` - Full-screen wizard
- ✅ `components/OnboardingChecklist.tsx` - Persistent widget
- ✅ `components/WelcomeBanner.tsx` - First-visit banner
- ✅ `lib/hooks/useOnboarding.ts` - Auto-completion hooks
- ✅ Dashboard integration in `app/dashboard/page.tsx`

---

## 🧪 Testing Scenarios

### Scenario A: New User Journey
**Goal:** Test complete onboarding flow for a fresh user

#### Step A1: User Registration
1. Create a new test account or clear existing user data
2. Navigate to `/dashboard` after signup
3. **Expected:** Welcome banner appears with colorful gradient design
4. **Expected:** Onboarding checklist widget shows 1/5 steps complete

#### Step A2: Onboarding Wizard Access
1. Click "Complete Setup" button in welcome banner OR navigate to `/onboarding`
2. **Expected:** Professional 3-step wizard loads with:
   - Step indicators at top
   - "Company Profile" as first step
   - Form fields with validation
   - Gradient "Next Step" button

#### Step A3: Company Profile Completion
1. Fill in company profile form:
   - Business name: "Test Trades Co"
   - ABN: "12 345 678 901"
   - Business address: "123 Test St, Sydney NSW 2000"
   - Upload a test logo (optional)
2. Click "Next Step"
3. **Expected:** Progress updates to Step 2
4. **Expected:** Database `onboarding_progress.company_profile_completed` = true

#### Step A4: Invoice Settings Completion
1. Fill in bank details:
   - Account name: "Test Trades Co"
   - BSB: "123-456"
   - Account number: "12345678"
   - Payment terms: "Net 30"
2. Click "Next Step"
3. **Expected:** Progress to Step 3
4. **Expected:** Database `onboarding_progress.invoice_settings_completed` = true

#### Step A5: First Quote Creation
1. Click "Create Your First Quote"
2. **Expected:** Redirects to `/dashboard/quotes/new`
3. Create a test quote and save
4. Navigate back to `/dashboard`
5. **Expected:** Onboarding progress shows 5/5 completed
6. **Expected:** Onboarding widget disappears from dashboard

---

### Scenario B: Returning User with Partial Progress
**Goal:** Test widget behavior for users mid-onboarding

#### Step B1: Simulate Partial Progress
1. Manually update database or use partially completed account
2. Set `onboarding_progress` to:
   - `account_created` = true
   - `business_details_added` = true
   - `company_profile_completed` = false
   - `invoice_settings_completed` = false
   - `first_quote_created` = false

#### Step B2: Dashboard Verification
1. Navigate to `/dashboard`
2. **Expected:** Onboarding checklist shows 2/5 completed (40% progress)
3. **Expected:** "Complete your company profile" highlighted as next step
4. **Expected:** Progress bar shows 40% filled with cyan gradient

#### Step B3: Next Step Navigation
1. Click on "Complete your company profile" step
2. **Expected:** Navigates to `/dashboard/settings/company`
3. Complete remaining profile fields
4. Return to dashboard
5. **Expected:** Progress automatically updates to 3/5

---

### Scenario C: Widget Dismissal and Re-appearance
**Goal:** Test widget dismissal behavior

#### Step C1: Dismiss Widget
1. With incomplete onboarding progress, navigate to `/dashboard`
2. Click the "X" button on onboarding checklist widget
3. **Expected:** Widget disappears immediately
4. **Expected:** Database `onboarding_progress.widget_dismissed` = true

#### Step C2: Same Session Behavior
1. Navigate to different pages and return to `/dashboard`
2. **Expected:** Widget remains hidden during same session

#### Step C3: New Session Behavior
1. Close browser/clear session storage OR restart dev server
2. Navigate to `/dashboard` again
3. **Expected:** Widget reappears (dismissal is per-session, not permanent)

---

### Scenario D: Auto-Completion Testing
**Goal:** Verify automatic progress tracking

#### Step D1: Profile Auto-Complete
1. Navigate to `/dashboard/settings/company`
2. Fill in business name and ABN
3. Save changes
4. Navigate to `/dashboard`
5. **Expected:** Onboarding progress automatically increases
6. **Expected:** Company profile step shows as completed

#### Step D2: Quote Auto-Complete
1. Navigate to `/dashboard/quotes/new`
2. Create and save a quote
3. Navigate to `/dashboard`
4. **Expected:** "Create your first quote" step automatically completes
5. **Expected:** Progress updates immediately

#### Step D3: Settings Auto-Complete
1. Navigate to `/dashboard/settings/invoice`
2. Fill in bank details and save
3. Return to dashboard
4. **Expected:** Invoice settings step completes automatically

---

### Scenario E: Welcome Banner Testing
**Goal:** Test first-visit welcome banner

#### Step E1: First Visit Detection
1. Clear localStorage with dev tools or use incognito mode
2. Login and navigate to `/dashboard` for first time
3. **Expected:** Welcome banner appears with gradient background
4. **Expected:** Shows business name or "Welcome there!" if no name set

#### Step E2: Banner Dismissal
1. Click "X" button on welcome banner
2. **Expected:** Banner disappears immediately
3. Navigate away and back to dashboard
4. **Expected:** Banner stays hidden during session

#### Step E3: Banner Re-appearance
1. Start new session (clear sessionStorage or new browser)
2. Navigate to `/dashboard`
3. **Expected:** Banner reappears on first visit of new session

---

## 🔧 Technical Validation

### Database Queries to Verify
```sql
-- Check onboarding progress table structure
SELECT * FROM onboarding_progress LIMIT 5;

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'onboarding_progress';

-- Check triggers exist
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'onboarding_progress';

-- View user progress
SELECT 
  user_id,
  account_created,
  business_details_added,
  company_profile_completed,
  invoice_settings_completed,
  first_quote_created,
  widget_dismissed,
  completion_date
FROM onboarding_progress;
```

### Performance Verification
- ✅ Dashboard loads in under 2 seconds
- ✅ Onboarding widgets render without layout shift
- ✅ Progress updates happen in real-time
- ✅ No console errors in browser dev tools

### Mobile Responsiveness
- ✅ Welcome banner responsive on mobile
- ✅ Onboarding checklist readable on small screens
- ✅ Wizard form works on touch devices
- ✅ Progress indicators scale appropriately

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Widget Not Appearing
**Symptoms:** OnboardingChecklist component doesn't render
**Check:**
- Database migration ran successfully
- User has `onboarding_progress` record
- Not all steps are completed (widget hides at 100%)
- Widget not dismissed in current session

#### 2. Progress Not Updating
**Symptoms:** Manual form completion doesn't auto-update progress
**Check:**
- `useOnboardingAutoCompletion` hook is imported and used
- Database triggers are working
- RLS policies allow user to update their own progress
- Network tab shows successful API calls

#### 3. Welcome Banner Always/Never Shows
**Symptoms:** Banner behavior inconsistent
**Check:**
- `localStorage.getItem('last_dashboard_visit')` value
- `sessionStorage.getItem('welcome_banner_dismissed')` value
- User profile data exists

#### 4. Migration Errors
**Symptoms:** Migration script fails
**Check:**
- Supabase service role key is correct
- `user_profiles` table exists (referenced by migration)
- Postgres version supports required features

### Debug Commands
```javascript
// Check localStorage
console.log('Last visit:', localStorage.getItem('last_dashboard_visit'))
console.log('Banner dismissed:', sessionStorage.getItem('welcome_banner_dismissed'))

// Check user progress
const { data } = await supabase
  .from('onboarding_progress')
  .select('*')
  .single()
console.log('Progress:', data)

// Force reset progress (for testing)
await supabase
  .from('onboarding_progress')
  .update({ 
    business_details_added: false,
    company_profile_completed: false,
    invoice_settings_completed: false,
    first_quote_created: false,
    widget_dismissed: false 
  })
  .eq('user_id', user.id)
```

---

## ✅ Success Criteria

### Core Functionality
- [ ] New users see welcome banner on first dashboard visit
- [ ] Onboarding wizard guides users through 3-step process
- [ ] Persistent widget tracks progress and shows next steps
- [ ] Auto-completion works for profile, settings, and quotes
- [ ] Widget dismissal works per-session, not permanently
- [ ] Progress updates in real-time across components

### User Experience
- [ ] Professional design with Lucide icons (no emoji)
- [ ] Responsive design works on all screen sizes
- [ ] Clear visual progress indicators and completion states
- [ ] Intuitive navigation between onboarding steps
- [ ] Helpful next step highlighting and links

### Technical Implementation
- [ ] Database migration runs without errors
- [ ] RLS policies secure user data properly
- [ ] Real-time subscriptions update UI automatically
- [ ] No memory leaks or performance issues
- [ ] Error handling gracefully manages edge cases

---

## 🎉 Completion

When all scenarios pass and success criteria are met, the hybrid onboarding system is ready for production! The system provides:

1. **📋 Full-Screen Wizard** - Guided 3-step onboarding experience
2. **🔔 Persistent Widget** - Dashboard progress tracking with next steps  
3. **🎊 Welcome Banner** - First-visit welcome with dismissal
4. **⚡ Auto-Completion** - Automatic progress updates based on user actions
5. **🔒 Secure Database** - RLS policies and trigger-based tracking
6. **📱 Mobile Ready** - Responsive design for all devices

**Next Steps:**
- Deploy to staging environment for user testing
- Monitor onboarding completion rates
- Gather user feedback for further improvements
- Consider adding additional onboarding steps based on user needs