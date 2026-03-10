# Complete Status Color System

This document defines the comprehensive status color system used across the TradeQuote application.

## Overview
- **Total Statuses:** 25+ unique status values
- **Entities:** Jobs (9), Quotes (6), Invoices (6), Purchase Orders (4)
- **Design Principle:** Consistent colors across entities for similar states

---

## 📋 Jobs - 9-Stage Workflow

| Status | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Enquiry** | Gray/Slate | `#94A3B8` | Default for new jobs |
| **Quoted** | Orange/Amber | `#F59E0B` | When quote sent |
| **Approved** | Blue | `#3B82F6` | When quote accepted |
| **Scheduled** | Purple/Violet | `#8B5CF6` | Scheduled in calendar |
| **In Progress** | Teal (Brand) | `#0EA5A4` | First staff clock-in |
| **Completed** | Green/Emerald | `#10B981` | Manual completion |
| **Invoiced** | Dark Blue | `#0369A1` | Invoice created |
| **Paid** | Dark Green | `#059669` | Invoice paid |
| **Cancelled** | Red | `#EF4444` | Manual or auto decline |

---

## 📝 Quotes - 6 Status Types

| Status | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Draft** | Slate Gray | `#64748B` | Creating/editing |
| **Sent** | Orange | `#F59E0B` | Sent, waiting response |
| **Viewed** | Blue | `#3B82F6` | Client has seen it |
| **Accepted** | Green | `#10B981` | Quote accepted |
| **Declined** | Red | `#EF4444` | Quote declined |
| **Expired** | Gray | `#6B7280` | Quote expired |

**Aliases:**
- `Pending` → Uses Sent color (`#F59E0B`)
- `Rejected` → Uses Declined color (`#EF4444`)

---

## 💰 Invoices - 6 Status Types

| Status | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Draft** | Slate Gray | `#64748B` | Creating/editing |
| **Sent** | Orange | `#F59E0B` | Sent, waiting payment |
| **Partial** | Teal | `#0EA5A4` | Partially paid |
| **Paid** | Dark Green | `#059669` | Fully paid |
| **Overdue** | Red | `#EF4444` | Past due date |

**Aliases:**
- `Unpaid` → Uses Sent color (`#F59E0B`)
- `Pending` → Uses Sent color (`#F59E0B`)

---

## 📦 Purchase Orders - 4 Status Types

| Status | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Draft** | Slate Gray | `#64748B` | Creating/editing |
| **Issued** | Orange | `#F59E0B` | Sent to supplier |
| **Received** | Green | `#10B981` | Products received |
| **Cancelled** | Red | `#EF4444` | Order cancelled |

**Aliases:**
- `Sent` → Uses Issued color (`#F59E0B`)
- `Completed` → Uses Received color (`#10B981`)

---

## 🎨 Color Usage Guidelines

### Semantic Meaning
- **Gray/Slate (#64748B, #94A3B8, #6B7280)** - Draft, pending action, neutral states
- **Orange (#F59E0B)** - Sent/waiting for response, attention needed
- **Blue (#3B82F6)** - Information, viewed, approved stages
- **Purple (#8B5CF6)** - Scheduled, planned activities
- **Teal (#0EA5A4)** - Active work, brand color, partial completion
- **Green (#10B981, #059669)** - Completed, paid, successful states
- **Dark Blue (#0369A1)** - Invoiced, financial milestones
- **Red (#EF4444)** - Declined, cancelled, overdue, errors

### Implementation
All status colors are defined in:
- `lib/colors.ts` - Central color definitions
- `components/StatusBadge.tsx` - Reusable badge component
- Individual page components - Inline status rendering

### Consistency Rules
1. Same color for similar states across entities
2. Draft always uses `#64748B` (slate gray)
3. Sent/Pending always uses `#F59E0B` (orange)
4. Cancelled/Declined always uses `#EF4444` (red)
5. Completed/Paid always uses green variants
6. Case-insensitive matching (handles `Paid`, `PAID`, `paid`)
7. Underscore to space conversion (`in_progress` → `in progress`)

---

## 📊 Status Badge Display

All status badges use:
- **Text:** White (`#FFFFFF`)
- **Background:** Full color from table above
- **Style:** Rounded pill, small/medium text, semibold font
- **Case:** Display as-is from database (capitalized)

Example HTML:
```html
<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 text-white"
      style="background-color: #0EA5A4">
  In Progress
</span>
```

---

## 🔄 Status Transitions

### Job Lifecycle
```
Enquiry → Quoted → Approved → Scheduled → In Progress → Completed → Invoiced → Paid
         └─────────────────────────────────────────────────────────┘
                                                                 └→ Cancelled
```

### Quote Lifecycle
```
Draft → Sent → Viewed → Accepted
                      └→ Declined
                      └→ Expired
```

### Invoice Lifecycle
```
Draft → Sent → Partial → Paid
             └→ Overdue
```

### Purchase Order Lifecycle
```
Draft → Issued → Received
              └→ Cancelled
```

---

**Last Updated:** February 23, 2026  
**Version:** 1.0  
**Maintained by:** TradeQuote Development Team
