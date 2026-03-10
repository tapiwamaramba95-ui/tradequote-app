// TradeQuote Design System - Modern SaaS Color Palette
// Charcoal Gray Structure + Orange Accent

export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#2d3748',      // Charcoal Gray - Sidebar, navigation structure
    dark: '#1a202c',         // Darker charcoal for hover states
    light: '#4a5568',        // Lighter charcoal for subtle elements
  },

  // Accent Color (use sparingly - primary action buttons only!)
  accent: {
    DEFAULT: '#ea580c',      // Orange - primary action buttons
    hover: '#dc2626',        // Darker orange for hover
    light: 'rgba(234, 88, 12, 0.1)',  // Light orange background for active states
  },

  // Neutral Backgrounds
  background: {
    main: '#f8f9fa',         // Light gray page background
    card: '#ffffff',         // Pure white card backgrounds
    sidebar: '#2d3748',      // Charcoal gray sidebar
    hover: '#f9fafb',        // Very light gray for hover states
    secondary: '#f3f4f6',    // Light gray for secondary buttons
  },

  // Borders & Dividers
  border: {
    DEFAULT: '#e5e7eb',      // Subtle gray borders
    light: '#f3f4f6',        // Very light borders for table rows
    dark: '#d1d5db',         // Slightly darker borders when needed
  },

  // Text Colors - Clear Hierarchy
  text: {
    primary: '#111827',      // Almost black - headings, important content
    secondary: '#6b7280',    // Medium gray - labels, section headers
    muted: '#9ca3af',        // Light gray - timestamps, placeholders, helper text
    inverse: '#ffffff',      // White text on dark backgrounds
    body: '#374151',         // Dark gray for body text/content
  },

  // Semantic Colors (updated for better contrast)
  semantic: {
    success: '#059669',      // Dark green - completed, approved, paid
    warning: '#d97706',      // Dark orange - pending, attention needed
    error: '#dc2626',        // Red - overdue, cancelled, declined
    info: '#0369a1',         // Dark blue - informational
  },

  // Status-specific colors (updated for new color scheme)
  status: {
    // Job Statuses (9 stages)
    enquiry: {
      bg: '#6b7280',         // Medium Gray - Default for new jobs
      text: '#ffffff',
    },
    quoted: {
      bg: '#ea580c',         // Orange - When quote sent (matches accent)
      text: '#ffffff',
    },
    approved: {
      bg: '#0369a1',         // Dark Blue - When quote accepted
      text: '#ffffff',
    },
    scheduledMeasureQuote: {
      bg: '#7c3aed',         // Purple - When scheduled for measure and quote
      text: '#ffffff',
    },
    scheduledWork: {
      bg: '#92400e',         // Brown - When scheduled for work
      text: '#ffffff',
    },
    inProgress: {
      bg: '#d97706',         // Amber - Active work (was teal, now warmer)
      text: '#ffffff',
    },
    completed: {
      bg: '#059669',         // Dark Green - Manual completion (matches semantic)
      text: '#ffffff',
    },
    invoiced: {
      bg: '#1e40af',         // Blue - When invoice created
      text: '#ffffff',
    },
    paid: {
      bg: '#047857',         // Dark Green - When invoice paid
      text: '#ffffff',
    },
    cancelled: {
      bg: '#dc2626',         // Red - Manual or auto on quote decline (matches semantic)
      text: '#ffffff',
    },
    
    // Quote Statuses (6 types)
    draft: {
      bg: '#6b7280',         // Medium gray - Creating/editing
      text: '#ffffff',
    },
    sent: {
      bg: '#ea580c',         // Orange - Sent, waiting for response (matches accent)
      text: '#ffffff',
    },
    viewed: {
      bg: '#0369a1',         // Blue - Client has seen it
      text: '#ffffff',
    },
    accepted: {
      bg: '#059669',         // Dark Green - Quote accepted (matches semantic)
      text: '#ffffff',
    },
    declined: {
      bg: '#dc2626',         // Red - Quote declined (matches semantic)
      text: '#ffffff',
    },
    expired: {
      bg: '#4b5563',         // Darker Gray - Quote expired
      text: '#ffffff',
    },
    
    // Invoice Statuses (6 types)
    partial: {
      bg: '#d97706',         // Amber - Partially paid
      text: '#ffffff',
    },
    overdue: {
      bg: '#dc2626',         // Red - Past due date (matches semantic)
      text: '#ffffff',
    },
    
    // Purchase Order Statuses (4 types)
    received: {
      bg: '#059669',         // Dark Green - PO received (matches semantic)
      text: '#ffffff',
    },
    billed: {
      bg: '#047857',         // Darker Green - Bill created
      text: '#ffffff',
    },
    issued: {
      bg: '#ea580c',         // Orange - PO sent to supplier (matches accent)
      text: '#ffffff',
    },
  },
}

// Helper function to get status colors (Complete 21-status system)
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    // Job statuses (10 stages - split scheduling)
    enquiry: colors.status.enquiry,
    quoted: colors.status.quoted,
    approved: colors.status.approved,
    scheduled_measure_quote: colors.status.scheduledMeasureQuote,
    scheduled_work: colors.status.scheduledWork,
    in_progress: colors.status.inProgress,
    'in progress': colors.status.inProgress,
    completed: colors.status.completed,
    invoiced: colors.status.invoiced,
    paid: colors.status.paid,
    cancelled: colors.status.cancelled,
    
    // Quote statuses (6 types)
    draft: colors.status.draft,
    sent: colors.status.sent,
    viewed: colors.status.viewed,
    accepted: colors.status.accepted,
    declined: colors.status.declined,
    expired: colors.status.expired,
    pending: colors.status.sent,        // Alias for sent
    rejected: colors.status.declined,   // Alias for declined
    
    // Invoice statuses (6 types - reuse some from jobs)
    // draft: already defined above
    // sent: already defined above
    partial: colors.status.partial,
    // paid: already defined above (from jobs)
    overdue: colors.status.overdue,
    unpaid: colors.status.sent,         // Alias for sent (orange)
    
    // Purchase Order statuses (4 types)
    received: colors.status.received,
    billed: colors.status.billed,
    issued: colors.status.issued,
  }

  return statusMap[status.toLowerCase()] || colors.status.draft
}