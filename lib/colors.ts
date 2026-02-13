// TradeQuote Design System - Color Palette
// Based on refined professional CRM aesthetic

export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#1E293B',      // Main headings, primary text
    dark: '#0F172A',         // Sidebar background
    light: '#334155',        // Hover states
  },

  // Accent Color (use sparingly - buttons, links, active states)
  accent: {
    DEFAULT: '#0EA5A4',      // Teal - action color
    hover: '#0D9493',        // Darker teal for hover
    light: '#5EEAD4',        // Light teal for subtle highlights
  },

  // Neutral Backgrounds
  background: {
    main: '#F8FAFC',         // Main page background
    card: '#FFFFFF',         // Card backgrounds
    sidebar: '#0F172A',      // Sidebar dark background
    hover: '#F1F5F9',        // Hover states on light backgrounds
  },

  // Borders & Dividers
  border: {
    DEFAULT: '#E2E8F0',      // Standard borders
    light: '#F1F5F9',        // Very light borders
    dark: '#CBD5E1',         // Darker borders for emphasis
  },

  // Text Colors
  text: {
    primary: '#1E293B',      // Main text
    secondary: '#64748B',    // Supporting text
    muted: '#94A3B8',        // Very muted text
    inverse: '#FFFFFF',      // Text on dark backgrounds
  },

  // Semantic Colors (use sparingly, only when meaningful)
  semantic: {
    success: '#16A34A',      // Green - completed, approved
    warning: '#F59E0B',      // Orange - pending, attention needed
    error: '#DC2626',        // Red - overdue, cancelled
    info: '#2563EB',         // Blue - informational
  },

  // Status-specific colors (for job/quote statuses)
  status: {
    draft: {
      bg: '#F1F5F9',
      text: '#475569',
    },
    quoted: {
      bg: '#DBEAFE',
      text: '#1E40AF',
    },
    approved: {
      bg: '#D1FAE5',
      text: '#065F46',
    },
    scheduled: {
      bg: '#FEF3C7',
      text: '#92400E',
    },
    inProgress: {
      bg: '#E9D5FF',
      text: '#6B21A8',
    },
    completed: {
      bg: '#D1FAE5',
      text: '#065F46',
    },
    cancelled: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },
    overdue: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },
  },
}

// Helper function to get status colors
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    draft: colors.status.draft,
    quoted: colors.status.quoted,
    approved: colors.status.approved,
    scheduled: colors.status.scheduled,
    in_progress: colors.status.inProgress,
    completed: colors.status.completed,
    cancelled: colors.status.cancelled,
    overdue: colors.status.overdue,
    // Invoice statuses
    unpaid: colors.status.quoted,
    paid: colors.status.completed,
    // Quote statuses
    sent: colors.status.quoted,
    accepted: colors.status.approved,
    rejected: colors.status.cancelled,
    declined: colors.status.cancelled,
  }

  return statusMap[status.toLowerCase()] || colors.status.draft
}