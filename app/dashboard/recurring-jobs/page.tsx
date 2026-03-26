/**
 * Recurring Jobs List Page
 * Shows all recurring jobs with status and quick actions
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Calendar, Repeat, Clock, DollarSign } from 'lucide-react'
import type { RecurringJob } from '@/lib/recurring-jobs/types'

type RecurringJobWithRelations = RecurringJob & {
  clients?: { name: string }
  _count?: { instances: number; completed: number }
}

export default function RecurringJobsPage() {
  const router = useRouter()
  const [recurringJobs, setRecurringJobs] = useState<RecurringJobWithRelations[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadRecurringJobs()
  }, [statusFilter])
  
  const loadRecurringJobs = async () => {
    setLoading(true)
    
    let query = supabase
      .from('recurring_jobs')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    
    const { data, error } = await query
    
    if (data) {
      // For each recurring job, get instance counts
      const jobsWithCounts = await Promise.all(
        data.map(async (job: any) => {
          const { count: totalCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('recurring_job_id', job.id)
          
          const { count: completedCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('recurring_job_id', job.id)
            .eq('status', 'completed')
          
          return {
            ...job,
            _count: {
              instances: totalCount || 0,
              completed: completedCount || 0
            }
          }
        })
      )
      
      setRecurringJobs(jobsWithCounts)
    }
    
    setLoading(false)
  }
  
  const filteredJobs = recurringJobs.filter(job => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.clients?.name.toLowerCase().includes(searchLower) ||
      job.frequency.toLowerCase().includes(searchLower)
    )
  })
  
  const getFrequencyDisplay = (job: RecurringJob) => {
    if (job.frequency === 'weekly' || job.frequency === 'fortnightly') {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const days = job.days_of_week?.map(d => dayNames[d - 1]).join(', ') || ''
      return `${job.frequency} (${days})`
    } else if (job.frequency === 'monthly' && job.day_of_month) {
      return `Monthly (day ${job.day_of_month})`
    }
    return job.frequency.charAt(0).toUpperCase() + job.frequency.slice(1)
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Jobs</h1>
            <p className="text-gray-600 mt-1">
              Auto-generate job instances on flexible schedules
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/jobs/new?recurring=true')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Job
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, client, or frequency..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      )}
      
      {/* List */}
      {!loading && filteredJobs.length > 0 && (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <Card 
              key={job.id} 
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/recurring-jobs/${job.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Repeat className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-700' :
                      job.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      job.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{job.clients?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{getFrequencyDisplay(job)}</span>
                    </div>
                    {job.auto_invoice && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Auto-invoice</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Progress:</span>
                      <span className="ml-2 font-medium">
                        {job._count?.completed || 0} of {job._count?.instances || 0} completed
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Started:</span>
                      <span className="ml-2 font-medium">
                        {new Date(job.start_date).toLocaleDateString('en-AU')}
                      </span>
                    </div>
                    {job.end_type === 'after_occurrences' && job.end_after_occurrences && (
                      <div>
                        <span className="text-gray-600">Ends after:</span>
                        <span className="ml-2 font-medium">
                          {job.end_after_occurrences} occurrences
                        </span>
                      </div>
                    )}
                    {job.end_type === 'on_date' && job.end_date && (
                      <div>
                        <span className="text-gray-600">Ends:</span>
                        <span className="ml-2 font-medium">
                          {new Date(job.end_date).toLocaleDateString('en-AU')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  className="border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-md transition-colors text-sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    router.push(`/dashboard/recurring-jobs/${job.id}`)
                  }}
                >
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <Card className="p-12 text-center">
          {search || statusFilter !== 'all' ? (
            <>
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No recurring jobs found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <Repeat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No recurring jobs yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first recurring job to automatically generate job instances on a schedule
              </p>
              <Button
                onClick={() => router.push('/dashboard/jobs/new?recurring=true')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Recurring Job
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
