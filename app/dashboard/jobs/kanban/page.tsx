'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

type Job = {
  id: string
  title: string
  status: string
  total_amount: number | null
  scheduled_date: string | null
  clients: {
    name: string
  } | null
}

const COLUMNS = [
  { 
    id: 'quoted', 
    title: 'Quoted', 
    color: colors.status.quoted,
    gradient: 'from-gray-50 to-gray-100',
    icon: '📝'
  },
  { 
    id: 'approved', 
    title: 'Approved', 
    color: colors.status.approved,
    gradient: 'from-blue-50 to-blue-100',
    icon: '✅'
  },
  { 
    id: 'scheduled', 
    title: 'Scheduled', 
    color: colors.status.scheduled,
    gradient: 'from-yellow-50 to-yellow-100',
    icon: '📅'
  },
  { 
    id: 'in_progress', 
    title: 'In Progress', 
    color: colors.status.inProgress,
    gradient: 'from-purple-50 to-purple-100',
    icon: '⚡'
  },
  { 
    id: 'completed', 
    title: 'Completed', 
    color: colors.status.completed,
    gradient: 'from-green-50 to-green-100',
    icon: '🎉'
  },
]

export default function KanbanPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        clients (
          name
        )
      `)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data)
    }
    setLoading(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id)
    setActiveJob(job || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveJob(null)
    
    if (!over) return

    const jobId = active.id as string
    const newStatus = over.id as string

    // Don't update if dropped in same column
    const job = jobs.find(j => j.id === jobId)
    if (job?.status === newStatus) return

    // Update local state immediately (optimistic update)
    setJobs((jobs) =>
      jobs.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    )

    // Update database
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)

    if (error) {
      // Revert on error
      console.error('Error updating job:', error)
      fetchJobs()
    }
  }

  const getJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  const totalJobs = jobs.length
  const totalValue = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Job Pipeline
            </h1>
            <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
              Drag jobs between columns to update their status
            </p>
          </div>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Job
          </Link>
        </div>

        {/* Stats */}
        {totalJobs > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border.DEFAULT 
              }}
            >
              <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Total Jobs
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: colors.text.primary }}>
                {totalJobs}
              </p>
            </div>
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border.DEFAULT 
              }}
            >
              <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Total Value
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: colors.accent.DEFAULT }}>
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {COLUMNS.map((column) => (
            <Column
              key={column.id}
              column={column}
              jobs={getJobsByStatus(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <JobCard job={activeJob} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {jobs.length === 0 && (
        <div 
          className="text-center py-16 rounded-lg border-2 border-dashed"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: `${colors.accent.DEFAULT}15` }}>
            <svg
              className="h-8 w-8"
              style={{ color: colors.accent.DEFAULT }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
            No jobs in your pipeline yet
          </h3>
          <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
            Get started by creating your first job and watch it move through your workflow
          </p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center px-6 py-3 rounded-md text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Job
          </Link>
        </div>
      )}
    </div>
  )
}

function Column({ column, jobs }: { column: typeof COLUMNS[0]; jobs: Job[] }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-shrink-0 w-80 snap-start">
      {/* Column Header with Gradient */}
      <div
        className={`bg-gradient-to-r ${column.gradient} rounded-t-lg px-4 py-3 border-b-2`}
        style={{ 
          borderColor: column.id === 'completed' ? colors.semantic.success : colors.border.DEFAULT 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{column.icon}</span>
            <h3 className="font-semibold" style={{ color: column.color.text }}>
              {column.title}
            </h3>
          </div>
          <span 
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: column.color.bg,
              color: column.color.text 
            }}
          >
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Column Body (Droppable Area) */}
      <div
        ref={setNodeRef}
        className="rounded-b-lg min-h-[500px] p-3 space-y-3 transition-colors"
        style={{ backgroundColor: colors.background.main }}
      >
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <svg 
              className="h-8 w-8 mb-2" 
              style={{ color: colors.text.muted }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xs font-medium" style={{ color: colors.text.muted }}>
              No jobs in this status
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        )}
      </div>
    </div>
  )
}

function JobCard({ job, isDragging = false }: { job: Job; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: job.id,
  })

  const cardStyle = {
    backgroundColor: colors.background.card,
    borderLeft: `4px solid ${colors.accent.DEFAULT}`,
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : {}),
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-lg shadow-sm p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:scale-[1.02] ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
      style={cardStyle}
    >
      {/* Job Title */}
      <h4 className="font-semibold mb-2 line-clamp-2" style={{ color: colors.text.primary }}>
        {job.title}
      </h4>

      {/* Job Details */}
      <div className="space-y-2">
        {/* Client Name */}
        {job.clients && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" style={{ color: colors.text.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm truncate" style={{ color: colors.text.secondary }}>
              {job.clients.name}
            </p>
          </div>
        )}

        {/* Scheduled Date */}
        {job.scheduled_date && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" style={{ color: colors.text.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              {new Date(job.scheduled_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Job Value */}
      {job.total_amount && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: colors.border.light }}>
          <p className="text-sm font-bold" style={{ color: colors.accent.DEFAULT }}>
            ${job.total_amount.toLocaleString()}
          </p>
          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="text-xs font-medium hover:underline"
            style={{ color: colors.accent.DEFAULT }}
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </Link>
        </div>
      )}

      {/* View Link (if no amount) */}
      {!job.total_amount && (
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="mt-3 pt-3 border-t block text-xs font-medium hover:underline"
          style={{ 
            color: colors.accent.DEFAULT,
            borderColor: colors.border.light 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          View Details →
        </Link>
      )}
    </div>
  )
}