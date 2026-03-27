/**
 * Recurring Job Detail Page
 * Shows overview, stats, and list of all instances for a recurring job
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pause, Play, XCircle, Edit, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react'
import type { RecurringJob } from '@/lib/recurring-jobs/types'

type RecurringJobWithClient = RecurringJob & {
  clients?: { name: string }
}

type JobInstance = {
  id: string
  title: string
  status: string
  scheduled_date: string
  completion_date?: string
  total_amount?: number
  recurrence_instance_number: number
}

export default function RecurringJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [recurringJob, setRecurringJob] = useState<RecurringJobWithClient | null>(null)
  const [instances, setInstances] = useState<JobInstance[]>([])
  const [stats, setStats] = useState({ completed: 0, total: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadRecurringJob()
    loadInstances()
  }, [params.id])
  
  const loadRecurringJob = async () => {
    const { data } = await supabase
      .from('recurring_jobs')
      .select('*, clients(name)')
      .eq('id', params.id)
      .single()
    
    setRecurringJob(data)
    setLoading(false)
  }
  
  const loadInstances = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('recurring_job_id', params.id)
      .order('scheduled_date', { ascending: true })
    
    setInstances(data || [])
    
    // Calculate stats
    const completed = data?.filter((j: any) => j.status === 'completed').length || 0
    const total = data?.length || 0
    const revenue = data
      ?.filter((j: any) => j.status === 'completed')
      .reduce((sum: number, j: any) => sum + (j.total_amount || 0), 0) || 0
    
    setStats({ completed, total, revenue })
  }
  
  const pauseRecurring = async () => {
    await supabase
      .from('recurring_jobs')
      .update({ 
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    loadRecurringJob()
  }
  
  const resumeRecurring = async () => {
    await supabase
      .from('recurring_jobs')
      .update({ 
        status: 'active',
        paused_at: null
      })
      .eq('id', params.id)
    
    loadRecurringJob()
  }
  
  const cancelRecurring = async () => {
    if (!confirm('Are you sure you want to cancel this recurring job? All scheduled instances will be deleted.')) {
      return
    }
    
    await supabase
      .from('recurring_jobs')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    // Delete scheduled instances
    await supabase
      .from('jobs')
      .delete()
      .eq('recurring_job_id', params.id)
      .eq('status', 'scheduled')
    
    loadRecurringJob()
    loadInstances()
  }
  
  const getFrequencyDisplay = (job: RecurringJob) => {
    let display = job.frequency
    if (job.frequency === 'weekly' || job.frequency === 'fortnightly') {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const days = job.days_of_week?.map(d => dayNames[d - 1]).join(', ') || ''
      display += days ? ` (${days})` : ''
    } else if (job.frequency === 'monthly' && job.day_of_month) {
      display += ` (day ${job.day_of_month})`
    }
    return display
  }
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }
  
  if (!recurringJob) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recurring job not found</h2>
          <button 
            onClick={() => router.push('/dashboard/recurring-jobs')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Back to Recurring Jobs
          </button>
        </div>
      </div>
    )
  }
  
  const upcomingInstances = instances.filter(i => i.status === 'scheduled')
  const completedInstances = instances.filter(i => i.status === 'completed')
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/dashboard/recurring-jobs')} 
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Recurring Jobs
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{recurringJob.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                recurringJob.status === 'active' ? 'bg-green-100 text-green-700' :
                recurringJob.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {recurringJob.status.charAt(0).toUpperCase() + recurringJob.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600">
              {recurringJob.clients?.name} • {getFrequencyDisplay(recurringJob)}
            </p>
          </div>
          
          <div className="flex gap-2">
            {recurringJob.status === 'active' ? (
              <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded flex items-center" onClick={pauseRecurring}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </button>
            ) : recurringJob.status === 'paused' ? (
              <button onClick={resumeRecurring} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </button>
            ) : null}
            
            <button 
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded flex items-center"
              onClick={() => router.push(`/dashboard/recurring-jobs/${params.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            
            {recurringJob.status !== 'cancelled' && (
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center" onClick={cancelRecurring}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Series
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Progress</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {stats.completed} of {stats.total}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
          <div className="text-3xl font-bold">
            ${stats.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            ${stats.completed > 0 ? (stats.revenue / stats.completed).toFixed(2) : '0.00'} per job
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Next Instance</span>
          </div>
          <div className="text-lg font-semibold">
            {upcomingInstances[0]?.scheduled_date 
              ? new Date(upcomingInstances[0].scheduled_date).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'None scheduled'
            }
          </div>
        </div>
      </div>
      
      {/* Upcoming Instances */}
      {upcomingInstances.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Instances</h2>
          
          <div className="space-y-3">
            {upcomingInstances.map(instance => (
              <div key={instance.id} 
                   className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">
                      {new Date(instance.scheduled_date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      Instance #{instance.recurrence_instance_number}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/jobs/${instance.id}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Completed Instances */}
      {completedInstances.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Completed Instances</h2>
          
          <div className="space-y-3">
            {completedInstances.map(instance => (
              <div key={instance.id} 
                   className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {instance.completion_date ? new Date(instance.completion_date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'Completed'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Instance #{instance.recurrence_instance_number}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {instance.total_amount && (
                    <div className="text-right">
                      <div className="font-medium">${instance.total_amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Invoiced</div>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/jobs/${instance.id}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Empty State */}
      {instances.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No instances generated yet
          </h3>
          <p className="text-gray-600 mb-4">
            Job instances will be automatically generated based on your schedule.
          </p>
        </Card>
      )}
    </div>
  )
}
