/**
 * Types for the Connections (Subcontractor Management) system
 */

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'disconnected'

export type Connection = {
  id: string
  invited_by_user_id: string
  invited_by_business_id: string
  email: string
  name?: string
  company_name?: string
  phone?: string
  mobile?: string
  connected_user_id?: string
  status: ConnectionStatus
  invitation_sent_at: string
  accepted_at?: string
  declined_at?: string
  disconnected_at?: string
  trade?: string
  hourly_rate?: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ConnectionInvitation = {
  email: string
  name?: string
  company_name?: string
  phone?: string
  mobile?: string
  trade?: string
  hourly_rate?: number
  notes?: string
}

export type Appointment = {
  id: string
  business_id: string
  job_id?: string
  assigned_staff_id?: string
  assigned_connection_id?: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  all_day: boolean
  street_address?: string
  suburb?: string
  state?: string
  postcode?: string
  connection_status?: 'pending' | 'accepted' | 'declined'
  connection_responded_at?: string
  connection_notes?: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reminder_sent: boolean
  reminder_sent_at?: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export type ConnectionWithDetails = Connection & {
  // Join with connected user data if accepted
  connected_user?: {
    email: string
    full_name?: string
  }
  // Stats
  total_appointments?: number
  accepted_appointments?: number
  completed_appointments?: number
  pending_appointments?: number
}
