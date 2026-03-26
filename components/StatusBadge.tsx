import { colors } from '@/lib/colors'

type StatusBadgeProps = {
  status: string
}

// Complete 21-status color system + Purchase Orders + Enquiries
const STATUS_COLORS: Record<string, string> = {
  // Job statuses (10 stages - split scheduling)
  enquiry: '#94A3B8',
  quoted: '#F59E0B',
  approved: '#3B82F6',
  scheduled_measure_quote: '#8B5CF6',
  scheduled_work: '#7C2D12',
  'in progress': '#0EA5A4',
  in_progress: '#0EA5A4',
  completed: '#10B981',
  invoiced: '#0369A1',
  paid: '#059669',
  cancelled: '#EF4444',
  
  // Quote statuses (6 types)
  draft: '#64748B',
  sent: '#F59E0B',
  viewed: '#3B82F6',
  accepted: '#10B981',
  declined: '#EF4444',
  expired: '#6B7280',
  pending: '#F59E0B',      // Alias for sent
  rejected: '#EF4444',     // Alias for declined
  
  // Invoice statuses (6 types)
  partial: '#0EA5A4',
  overdue: '#EF4444',
  unpaid: '#F59E0B',       // Alias for sent (orange)
  
  // Purchase Order statuses (4 types)
  received: '#10B981',     // Green - PO received
  billed: '#059669',       // Dark Green - Bill created
  issued: '#F59E0B',       // Orange - PO sent to supplier
  
  // Enquiry statuses (5 types)
  new: '#F59E0B',          // Orange - New enquiry
  contacted: '#3B82F6',    // Blue - Contacted customer
  converted: '#10B981',    // Green - Converted to job/quote
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusLower = status.toLowerCase().replace(/_/g, ' ')
  const color = STATUS_COLORS[statusLower] || colors.text.muted

  return (
    <span
      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize"
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {statusLower}
    </span>
  )
}
