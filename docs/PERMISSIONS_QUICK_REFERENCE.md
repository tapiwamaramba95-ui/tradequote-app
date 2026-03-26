# Staff Permissions Quick Reference

## How to Check Permissions in Code

### Client-Side Components

```typescript
import { hasPermission, isBusinessOwner } from '@/lib/permissions/check'

// Check single permission
const canViewInvoices = await hasPermission('invoicing')

// Check if user is owner
const isOwner = await isBusinessOwner()

// Conditionally render UI
{canViewInvoices && <InvoiceButton />}
{isOwner && <AdminPanel />}
```

### Protect Entire Pages

```typescript
import { PermissionGuard } from '@/components/permissions/PermissionGuard'

export default function InvoicesPage() {
  return (
    <PermissionGuard permission="invoicing">
      {/* Page content here */}
      <div>Invoices content...</div>
    </PermissionGuard>
  )
}
```

### Multiple Permissions (Any Of)

```typescript
<PermissionGuard anyOf={['settings', 'staff_members', 'plan_billing']}>
  <SettingsPage />
</PermissionGuard>
```

### Custom Fallback

```typescript
<PermissionGuard 
  permission="invoicing"
  fallback={<div>You need invoicing access to see this.</div>}
>
  <InvoiceData />
</PermissionGuard>
```

## Permission Keys Reference

| Key | Label | Grants Access To |
|-----|-------|------------------|
| `timesheets` | Timesheets | View and manage timesheets |
| `jobs` | Jobs | Job management and tracking |
| `invoicing` | Invoicing | Create and send invoices |
| `quoting` | Quoting | Create and manage quotes |
| `purchases` | Purchases | Purchase orders and suppliers |
| `reports_financials` | Reports & Financials | Analytics and financial reports |
| `scheduling_dispatch` | Scheduling & Dispatch | Calendar and staff scheduling |
| `enquiries` | Enquiries | View and respond to enquiries |
| `staff_tracking` | Staff Tracking | Real-time staff location tracking |
| `settings` | Settings | Business settings and configuration |
| `staff_members` | Staff Members | Invite and manage staff members |
| `plan_billing` | Plan & Billing | Subscription and payment settings |

## Common Patterns

### Hide Navigation Item

```typescript
// In navigation array
const navigation = [
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    permission: 'invoicing' as PermissionKey,
    icon: <InvoiceIcon />
  }
]

// Filter by permissions
const filteredNav = navigation.filter(item => {
  if (!item.permission) return true
  if (isOwner) return true
  return permissions?.[item.permission]
})
```

### Conditional Feature

```typescript
const permissions = await getCurrentUserPermissions()

if (permissions?.invoicing) {
  // Show invoice features
}

if (permissions?.quoting && permissions?.invoicing) {
  // Show quote-to-invoice conversion
}
```

### Database Query with Permission Check

```typescript
import { has_staff_permission } from 'database'

-- In SQL query
SELECT * FROM invoices 
WHERE business_id = $1 
  AND has_staff_permission($2, $1, 'invoicing')
```

## Setting Permissions

### Via UI (Staff Members Page)

1. Go to Settings → Staff Members
2. Click staff member to edit
3. Switch to "Staff Permissions" tab
4. Toggle permissions on/off
5. Click "Save Changes"

### Via Database

```sql
UPDATE staff 
SET permissions = jsonb_set(
  permissions, 
  '{invoicing}', 
  'true'::jsonb
)
WHERE id = 'staff-id-here';
```

### Programmatically

```typescript
await supabase
  .from('staff')
  .update({
    permissions: {
      ...currentPermissions,
      invoicing: true
    }
  })
  .eq('id', staffId)
```

## Owner Behavior

**Account Owners automatically:**
- Bypass all permission checks
- See all navigation items
- Access all pages
- Cannot have permissions disabled

**To check if user is owner:**
```typescript
const isOwner = await isBusinessOwner()

// Or check role directly
const { data: staff } = await supabase
  .from('staff')
  .select('role')
  .eq('user_id', userId)
  .single()

if (staff.role === 'Owner' || staff.role === 'Account Owner') {
  // Owner access
}
```

## Troubleshooting

### Permission Check Returns False for Owner

**Problem:** Owner isn't seeing features  
**Solution:** Verify `isBusinessOwner()` returns true. Check `role` field in staff table is "Owner" or "Account Owner"

### Navigation Item Not Showing

**Problem:** Menu item hidden even with permission  
**Solution:** Check `filteredNavigation` logic. Ensure permission key matches exactly. Console.log permissions object to verify.

### Permission Guard Shows "Access Denied"

**Problem:** Page blocked even with permission  
**Solution:** 
1. Check permission key spelling
2. Verify permissions loaded (not null)
3. Check user's staff record exists
4. Confirm permission is set to true in database

### Permissions Not Saving

**Problem:** Toggle switch changes but doesn't persist  
**Solution:**
1. Check browser console for errors
2. Verify staff ID is passed correctly
3. Check database update query succeeded
4. Confirm JSONB column exists

### Invitation Not Working

**Problem:** Staff member not receiving email  
**Solution:** 
1. Email sending requires API route (not yet implemented)
2. Check Supabase Auth email templates are configured
3. Verify SMTP settings in Supabase dashboard
4. Implement server-side API route for invitations

## Best Practices

1. **Always check on server-side too** - Client checks are for UX only
2. **Use PermissionGuard for pages** - Centralized access control
3. **Default to restricted** - Require explicit permission grants
4. **Owners bypass everything** - Don't add special owner logic everywhere
5. **Test with non-owner account** - Owners see everything, test restrictions properly
6. **Update permissions atomically** - Use JSONB operations, don't replace entire object
7. **Index your queries** - GIN index is created for JSONB permission queries
8. **Document permission requirements** - Add comments when checking permissions

## Example: Complete Page Protection

```typescript
// app/dashboard/invoices/page.tsx
import { PermissionGuard } from '@/components/permissions/PermissionGuard'
import { hasPermission } from '@/lib/permissions/check'

export default function InvoicesPage() {
  return (
    <PermissionGuard permission="invoicing">
      <div className="p-8">
        <h1>Invoices</h1>
        
        <InvoicesList />
        
        <ConditionalFeatures />
      </div>
    </PermissionGuard>
  )
}

function ConditionalFeatures() {
  const [canCreateInvoice, setCanCreateInvoice] = useState(false)
  
  useEffect(() => {
    hasPermission('invoicing').then(setCanCreateInvoice)
  }, [])
  
  if (!canCreateInvoice) return null
  
  return <CreateInvoiceButton />
}
```

## Related Files

- **Types:** `lib/permissions/types.ts`
- **Utilities:** `lib/permissions/check.ts`
- **Guard:** `components/permissions/PermissionGuard.tsx`
- **Toggle:** `components/permissions/PermissionToggle.tsx`
- **Migration:** `db/migrations/20260326_staff_permissions_and_invitation.sql`
- **Staff Page:** `app/settings/staff-members/page.tsx`
- **Layout:** `app/dashboard/layout.tsx`

## Support

For implementation help, see:
- [STAFF_PERMISSIONS_IMPLEMENTATION.md](./STAFF_PERMISSIONS_IMPLEMENTATION.md) - Full implementation details
- [STAFF_ARCHITECTURE.md](./STAFF_ARCHITECTURE.md) - Staff system architecture
