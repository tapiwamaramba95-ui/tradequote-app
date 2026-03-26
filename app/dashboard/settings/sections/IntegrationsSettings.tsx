'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'

export default function IntegrationsSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  useEffect(() => {
    checkConnection()
    handleCallbackMessages()
  }, [])
  
  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('profiles')
        .select('google_calendar_tokens')
        .eq('id', user.id)
        .single()
      
      setIsConnected(data?.google_calendar_tokens !== null)
    } catch (error) {
      console.error('Error checking connection:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCallbackMessages = () => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success === 'calendar_connected') {
      setMessage({
        type: 'success',
        text: 'Successfully connected Google Calendar! Your jobs will now sync automatically.'
      })
      // Clear URL params
      router.replace('/dashboard/settings/integrations')
    }
    
    if (error === 'access_denied') {
      setMessage({
        type: 'error',
        text: 'You cancelled the connection. Click "Connect Calendar" to try again.'
      })
      router.replace('/dashboard/settings/integrations')
    }
    
    if (error && error !== 'access_denied') {
      setMessage({
        type: 'error',
        text: 'Failed to connect calendar. Please try again.'
      })
      router.replace('/dashboard/settings/integrations')
    }
  }
  
  const connectCalendar = async () => {
    try {
      window.location.href = '/api/auth/google/connect'
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to start connection flow'
      })
    }
  }
  
  const disconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Future jobs will no longer sync.')) {
      return
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await supabase
        .from('profiles')
        .update({ google_calendar_tokens: null })
        .eq('id', user.id)
      
      setIsConnected(false)
      setMessage({
        type: 'success',
        text: 'Google Calendar has been disconnected'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to disconnect calendar'
      })
    }
  }
  
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
          Integrations
        </h1>
        <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
          Connect TradeQuote with your favorite tools and services.
        </p>
        <div className="rounded-lg border p-8 text-center" style={{
          backgroundColor: colors.background.card,
          borderColor: colors.border.DEFAULT
        }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: colors.accent.DEFAULT }}></div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
        Integrations
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Connect TradeQuote with your favorite tools and services.
      </p>
      
      {/* Message Banner */}
      {message && (
        <div 
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            borderColor: message.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? '#d1fae5' : '#fee2e2'}`,
            borderLeftWidth: '4px'
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm" style={{ color: message.type === 'success' ? '#047857' : '#991b1b' }}>
                {message.text}
              </p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto flex-shrink-0"
              style={{ color: message.type === 'success' ? '#059669' : '#dc2626' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Google Calendar Card */}
      <div className="rounded-lg border p-6" style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.DEFAULT
      }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Calendar Icon */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
              <svg className="w-8 h-8" style={{ color: '#0284c7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                Google Calendar
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                Automatically sync your TradeQuote jobs to your Google Calendar
              </p>
              
              {/* Connection Status */}
              {isConnected ? (
                <div className="flex items-center gap-2 mb-4" style={{ color: '#10b981' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4" style={{ color: colors.text.muted }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Not connected</span>
                </div>
              )}
              
              {/* Features List */}
              <ul className="text-sm space-y-1 mb-4" style={{ color: colors.text.secondary }}>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Jobs appear on your calendar automatically
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Updates when job times change
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.accent.DEFAULT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Shows job location and client details
                </li>
              </ul>
            </div>
          </div>
          
          {/* Action Button */}
          <div>
            {isConnected ? (
              <button
                onClick={disconnectCalendar}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
                style={{
                  color: colors.text.secondary,
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.main
                }}
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectCalendar}
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                Connect Calendar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
