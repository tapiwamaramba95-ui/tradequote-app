# Staff & Profile Architecture

## Design Decision: Separate Identity from Work Roles

### Tables

**`profiles` (Identity - Who you are)**
- `id` (FK to auth.users.id)
- `email`
- `full_name` - For everyone (admin, staff, clients)
- `company_name` - If they're a business owner
- Created automatically when user signs up

**`staff` (Work Relationship - What you do)**
- `id`
- `user_id` → profiles.id (FK)
- `owner_id` → profiles.id (FK to business owner)
- `role`, `hourly_cost`, `billing_rate`, `permissions`
- Work-specific data only

### Why This Design?

#### ✅ Benefits

1. **Performance**
   - Navigation shows name without JOIN: `SELECT full_name FROM profiles WHERE id = user_id`
   - Audit logs don't need JOIN: "Invoice created by {profile.full_name}"
   - Most queries only need profiles table
   
2. **Flexibility**
   - Business owner: ✅ Has profile, may/may not be in staff
   - Staff member: ✅ Has profile + staff record  
   - Future clients with portal: ✅ Just profile, no staff record
   - Multi-business: ✅ One profile, multiple staff records (different owners)

3. **Data Integrity**
   - Single source of truth for name/email (profiles)
   - No duplicate data
   - User updates name once, shows everywhere
   - Staff record only manages work relationship

4. **Standard Pattern**
   - Follows industry best practices
   - Identity separate from roles
   - Matches Supabase Auth structure (auth.users → profiles)

#### ❌ Alternative (Why NOT duplicate name in staff)

```sql
-- BAD - Duplicates identity data
staff {
  name VARCHAR  -- ❌ Duplicate
  email VARCHAR -- ❌ Duplicate  
  role VARCHAR
}

Problems:
- User updates name: must update profiles AND staff
- Multiple staff records: name out of sync
- Navigation requires JOIN anyway for consistency
- More storage, more maintenance
```

### Query Patterns

#### Simple queries (no JOIN)
```typescript
// Navigation, audit logs, created_by
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, email')
  .eq('id', userId)
  .single()
```

#### Staff list with names
```typescript
const { data: staff } = await supabase
  .from('staff')
  .select(`
    id,
    role,
    hourly_cost,
    is_active,
    profile:profiles!user_id(full_name, email)
  `)
  .eq('owner_id', currentUserId)
```

#### Check permissions
```typescript
const { data: staffRecord } = await supabase
  .from('staff')
  .select('role, permissions')
  .eq('user_id', currentUserId)
  .eq('owner_id', businessId)
  .single()
```

### Migration Path

1. **Current state**: `staff` table has `name` and `email` columns
2. **New migration**: Adds `user_id` FK to profiles
3. **Transition**: 
   - Keep old `name`/`email` nullable for backward compatibility
   - Mark as DEPRECATED in comments
   - New code uses `profiles.full_name` via `user_id`
4. **Future cleanup**: Remove deprecated columns after migration complete

### Usage Examples

#### Adding new staff member

```typescript
// Step 1: Invite user via Supabase Auth
const { data: newUser } = await supabase.auth.admin.inviteUserByEmail(
  'newstaff@example.com',
  { 
    data: { full_name: 'John Smith' }
  }
)

// Step 2: Profile created automatically by trigger

// Step 3: Create staff record
const { data: staff } = await supabase
  .from('staff')
  .insert({
    user_id: newUser.user.id,
    owner_id: currentUserId,
    role: 'Tradesperson',
    hourly_cost: 85.00,
    is_active: true
  })
```

#### Displaying staff in UI

```tsx
function StaffList() {
  const { data: staff } = useQuery(['staff'], async () => {
    const { data } = await supabase
      .from('staff')
      .select(`
        id,
        role,
        hourly_cost,
        is_active,
        profile:profiles!user_id(
          full_name,
          email
        )
      `)
      .eq('owner_id', currentUserId)
    return data
  })

  return (
    <table>
      {staff?.map(member => (
        <tr key={member.id}>
          <td>{member.profile.full_name}</td>
          <td>{member.profile.email}</td>
          <td>{member.role}</td>
          <td>${member.hourly_cost}/hr</td>
          <td>{member.is_active ? '✓' : '✗'}</td>
        </tr>
      ))}
    </table>
  )
}
```

#### Audit logging

```typescript
// Created by field - no JOIN needed!
async function createInvoice(data) {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get creator name from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      ...data,
      created_by: user.id,
      created_by_name: profile.full_name // Cached for display
    })
}
```

### Multi-Tenant Support

One user can work for multiple businesses:

```sql
-- User A works for two different businesses
staff:
  id: 1, user_id: 'A', owner_id: 'Business1', role: 'Tradesperson'
  id: 2, user_id: 'A', owner_id: 'Business2', role: 'Supervisor'

-- Query: Get which businesses user A works for
SELECT 
  s.role,
  p.company_name as business_name
FROM staff s
JOIN profiles p ON s.owner_id = p.id
WHERE s.user_id = 'A'
AND s.is_active = true
```

### Summary

**profiles** = Identity (1 per user, rarely changes)  
**staff** = Work relationship (can be multiple, changes often)

This gives you:
- ✅ Fast queries (most don't need JOIN)
- ✅ Single source of truth (name in one place)
- ✅ Flexible (supports staff, owners, clients)
- ✅ Future-proof (multi-tenant ready)
