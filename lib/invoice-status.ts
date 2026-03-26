export type InvoiceDisplayStatus = 
  | 'draft' 
  | 'awaiting_payment' 
  | 'overdue' 
  | 'partially_paid' 
  | 'paid'

interface Invoice {
  status: 'draft' | 'sent'
  payment_status: 'unpaid' | 'partial' | 'paid'
  due_date: string | null
  issue_date?: string
  paid_at: string | null
  created_at: string
  total_amount: number
  amount_paid: number
}

export function getInvoiceDisplayStatus(invoice: Invoice): InvoiceDisplayStatus {
  // Draft invoices are always "draft"
  if (invoice.status === 'draft') {
    return 'draft'
  }
  
  // Paid invoices are always "paid"
  if (invoice.payment_status === 'paid') {
    return 'paid'
  }
  
  // Partially paid
  if (invoice.payment_status === 'partial') {
    return 'partially_paid'
  }
  
  // Check if overdue (sent, unpaid, and past due date)
  if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
    return 'overdue'
  }
  
  // Default: sent but unpaid and not overdue
  return 'awaiting_payment'
}

export function getInvoiceStatusConfig(status: InvoiceDisplayStatus) {
  const configs = {
    draft: {
      label: 'Draft',
      bg: '#f3f4f6',
      text: '#6b7280',
      dotColor: '#9ca3af',
      icon: null,
    },
    awaiting_payment: {
      label: 'Awaiting Payment',
      bg: '#fef3c7',
      text: '#92400e',
      dotColor: '#fbbf24',
      icon: null,
    },
    overdue: {
      label: 'Overdue',
      bg: '#fee2e2',
      text: '#991b1b',
      dotColor: '#ef4444',
      icon: '⚠️',
    },
    partially_paid: {
      label: 'Partially Paid',
      bg: '#dbeafe',
      text: '#1e40af',
      dotColor: '#3b82f6',
      icon: null,
    },
    paid: {
      label: 'Paid',
      bg: '#dcfce7',
      text: '#16a34a',
      dotColor: '#22c55e',
      icon: '✓',
    },
  }
  
  return configs[status]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export function getInvoiceDateInfo(invoice: Invoice): string {
  const displayStatus = getInvoiceDisplayStatus(invoice)
  
  // Draft: show when created
  if (displayStatus === 'draft') {
    const createdDate = new Date(invoice.created_at)
    const today = new Date()
    const daysDiff = getDaysDifference(today, createdDate)
    
    if (daysDiff === 0) return 'Created today'
    if (daysDiff === 1) return 'Created yesterday'
    return `Created ${formatDate(invoice.created_at)}`
  }
  
  // Paid: show when paid
  if (displayStatus === 'paid' && invoice.paid_at) {
    return `Paid ${formatDate(invoice.paid_at)}`
  }
  
  // Partially paid: show amount paid
  if (displayStatus === 'partially_paid') {
    return `$${invoice.amount_paid.toLocaleString()} paid`
  }
  
  // Overdue: show how many days overdue
  if (displayStatus === 'overdue' && invoice.due_date) {
    const daysOverdue = getDaysDifference(new Date(), new Date(invoice.due_date))
    const issueDate = invoice.issue_date || invoice.created_at
    return `Sent ${formatDate(issueDate)} (${daysOverdue} days overdue)`
  }
  
  // Awaiting payment: show when sent
  if (displayStatus === 'awaiting_payment') {
    const issueDate = invoice.issue_date || invoice.created_at
    return `Sent ${formatDate(issueDate)}`
  }
  
  return ''
}

export function getInvoiceSortPriority(invoice: Invoice): number {
  const displayStatus = getInvoiceDisplayStatus(invoice)
  const priorities = {
    overdue: 1,
    awaiting_payment: 2,
    partially_paid: 3,
    draft: 4,
    paid: 5,
  }
  return priorities[displayStatus]
}
