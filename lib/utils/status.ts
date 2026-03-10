type StatusConfig = {
  bg: string
  text: string
  label: string
}

export type JobStatus = 'enquiry' | 'quoted' | 'approved' | 'scheduled_measure_quote' | 'scheduled_work' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'unpaid' | 'overdue' | 'paid'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

export const getJobStatusConfig = (status: JobStatus): StatusConfig => {
  const configs: Record<JobStatus, StatusConfig> = {
    enquiry: { bg: '#f3f4f6', text: '#6b7280', label: 'Enquiry' },
    quoted: { bg: '#dbeafe', text: '#1e40af', label: 'Quoted' },
    approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
    scheduled_measure_quote: { bg: '#f3e8ff', text: '#6b21a8', label: 'M&Q Scheduled' },
    scheduled_work: { bg: '#fef3c7', text: '#92400e', label: 'Work Scheduled' },
    in_progress: { bg: '#cffafe', text: '#155e75', label: 'In Progress' },
    completed: { bg: '#dcfce7', text: '#16a34a', label: 'Completed' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
  }
  return configs[status] || configs.enquiry
}

export const getInvoiceStatusConfig = (status: InvoiceStatus): StatusConfig => {
  const configs: Record<InvoiceStatus, StatusConfig> = {
    draft: { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
    unpaid: { bg: '#dbeafe', text: '#1e40af', label: 'Unpaid' },
    overdue: { bg: '#fee2e2', text: '#991b1b', label: 'Overdue' },
    paid: { bg: '#dcfce7', text: '#16a34a', label: 'Paid' },
  }
  return configs[status] || configs.draft
}

export const getQuoteStatusConfig = (status: QuoteStatus): StatusConfig => {
  const configs: Record<QuoteStatus, StatusConfig> = {
    draft: { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
    sent: { bg: '#dbeafe', text: '#1e40af', label: 'Sent' },
    accepted: { bg: '#dcfce7', text: '#16a34a', label: 'Accepted' },
    declined: { bg: '#fee2e2', text: '#991b1b', label: 'Declined' },
  }
  return configs[status] || configs.draft
}
