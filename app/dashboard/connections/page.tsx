'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Breadcrumb from '@/components/Breadcrumb'
import { Plus, UserCheck, UserX, Clock, MoreVertical, Mail, Phone, Briefcase } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { InviteConnectionDialog } from '@/components/connections/InviteConnectionDialog'
import type { Connection } from '@/lib/connections/types'

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    loadConnections()
  }, [])
  
  const loadConnections = async () => {
    try {
      const response = await fetch('/api/connections')
      if (!response.ok) throw new Error('Failed to load connections')
      
      const data = await response.json()
      setConnections(data.connections || [])
    } catch (error) {
      console.error('Error loading connections:', error)
      toast('error', 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }
  
  const handleResend = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/resend`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to resend invitation')
      
      toast('success', 'Invitation resent successfully')
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast('error', 'Failed to resend invitation')
    }
  }
  
  const handleDisconnect = async (connectionId: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name || 'this connection'}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to disconnect')
      
      toast('success', 'Connection disconnected')
      loadConnections()
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast('error', 'Failed to disconnect connection')
    }
  }
  
  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        label: 'Pending', 
        icon: Clock, 
        bgColor: 'bg-yellow-100', 
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600'
      },
      accepted: { 
        label: 'Active', 
        icon: UserCheck, 
        bgColor: 'bg-green-100', 
        textColor: 'text-green-700',
        iconColor: 'text-green-600'
      },
      declined: { 
        label: 'Declined', 
        icon: UserX, 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-700',
        iconColor: 'text-red-600'
      },
      disconnected: { 
        label: 'Disconnected', 
        icon: UserX, 
        bgColor: 'bg-gray-100', 
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600'
      }
    }
    
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        {config.label}
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Connections', href: '/dashboard/connections' }]} />
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
              <p className="text-sm text-gray-500 mt-1">
                {connections.length} {connections.length === 1 ? 'connection' : 'connections'} • Invite and manage subcontractors
              </p>
            </div>
          </div>
          
          {/* Right: Action Button */}
          <button
            onClick={() => setShowInviteDialog(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all w-full sm:w-auto"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            Invite Connection
          </button>
        </div>
        
        {/* Empty State */}
        {connections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Invite subcontractors to collaborate on jobs. They'll get a free limited account to view appointments and accept job invitations.
            </p>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
              style={{ backgroundColor: colors.accent.DEFAULT }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
            >
              <Plus className="w-4 h-4" />
              Invite Your First Connection
            </button>
          </div>
        ) : (
          /* Connections List */
          <div className="grid gap-4">
            {connections.map(connection => (
              <div 
                key={connection.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {connection.name || connection.email}
                        </h3>
                        {getStatusBadge(connection.status)}
                      </div>
                      
                      {connection.company_name && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {connection.company_name}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {connection.email}
                        </span>
                        
                        {connection.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {connection.phone}
                          </span>
                        )}
                        
                        {connection.trade && (
                          <span className="text-gray-600 font-medium">
                            • {connection.trade}
                          </span>
                        )}
                        
                        {connection.hourly_rate && (
                          <span className="text-gray-600">
                            • ${connection.hourly_rate}/hr
                          </span>
                        )}
                      </div>
                      
                      {connection.notes && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {connection.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {connection.status === 'pending' && (
                      <button
                        onClick={() => handleResend(connection.id)}
                        className="px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                      >
                        Resend
                      </button>
                    )}
                    
                    <div className="relative group">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => {
                          if (connection.status !== 'disconnected') {
                            handleDisconnect(connection.id, connection.name || connection.email)
                          }
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteConnectionDialog
          onClose={() => setShowInviteDialog(false)}
          onInvited={() => {
            setShowInviteDialog(false)
            loadConnections()
          }}
        />
      )}
    </div>
  )
}
