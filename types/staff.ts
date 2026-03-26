// Staff & Profile Types
// Demonstrates the proper relationship between profiles (identity) and staff (work roles)

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  user_id: string // FK to profiles.id
  owner_id: string // FK to profiles.id (the business owner)
  role: string | null // e.g., "Tradesperson", "Supervisor", "Admin"
  hourly_cost: number | null // What it costs YOU per hour
  billing_rate: string | null // What you charge clients
  licence_number: string | null
  permissions: Record<string, any> | null
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Deprecated fields - use profile data instead
  name?: string // Use profile.full_name
  email?: string // Use profile.email
  phone?: string
}

// Combined type for displaying staff with user details
export interface StaffWithProfile extends Staff {
  profile: Profile
}

// Helper type for staff queries
export type StaffDisplay = Pick<Staff, 'id' | 'role' | 'hourly_cost' | 'billing_rate' | 'is_active'> & {
  full_name: string
  email: string
  user_id: string
}

// Example query result type
export interface StaffListItem {
  id: string
  user_id: string
  full_name: string
  email: string
  role: string | null
  hourly_cost: number | null
  billing_rate: string | null
  is_active: boolean
}

// For creating new staff
export interface CreateStaffInput {
  user_id: string // Must exist in profiles
  owner_id: string // Current business owner
  role?: string
  hourly_cost?: number
  billing_rate?: string
  licence_number?: string
  permissions?: Record<string, any>
}

// For updating staff
export interface UpdateStaffInput {
  role?: string
  hourly_cost?: number
  billing_rate?: string
  licence_number?: string
  permissions?: Record<string, any>
  is_active?: boolean
}

/*
RECOMMENDED USAGE PATTERNS:

1. Fetching staff list with names:
```typescript
const { data: staff } = await supabase
  .from('staff')
  .select(`
    id,
    user_id,
    role,
    hourly_cost,
    billing_rate,
    is_active,
    profile:profiles!user_id(
      full_name,
      email
    )
  `)
  .eq('owner_id', currentUserId)
  .eq('is_active', true)
```

2. Display pattern:
```typescript
staff.forEach(member => {
  console.log(member.profile.full_name) // ✅ Get name from profile
  console.log(member.role) // ✅ Get work info from staff
})
```

3. Navigation/audit logs (no join needed):
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, email')
  .eq('id', userId)
  .single()
  
console.log(`Action by: ${profile.full_name}`)
```

4. Adding new staff member:
```typescript
// Step 1: User signs up (or you invite them via Supabase Auth)
// Step 2: Profile is auto-created by trigger
// Step 3: Link them as staff
const { data: newStaff } = await supabase
  .from('staff')
  .insert({
    user_id: profileId,
    owner_id: currentUserId,
    role: 'Tradesperson',
    hourly_cost: 85.00,
    billing_rate: '110.00'
  })
  .select()
  .single()
```

5. Check if current user is staff:
```typescript
const { data: isStaff } = await supabase
  .from('staff')
  .select('id, role, permissions')
  .eq('user_id', currentUserId)
  .eq('owner_id', businessOwnerId)
  .eq('is_active', true)
  .maybeSingle()

if (isStaff) {
  // User is active staff member
  console.log(`Role: ${isStaff.role}`)
}
```
*/
