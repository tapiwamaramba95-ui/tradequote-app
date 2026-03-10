"use client";
import Breadcrumb from '@/components/Breadcrumb';
import Table from '@/components/Table';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'

type Invoice = {
  id: string;
  invoice_number: string;
};
type Client = {
  name: string;
  address?: string;
};
type Job = {
  id: string;
  job_number: string;
  job_name: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  client_id: string;
  clients?: Client;
  invoices?: Invoice[];
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState('jobs');
  const [showActionsMenu, setShowActionsMenu] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, clients(name, address)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Exception in fetchJobs:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      quoted: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      scheduled_measure_quote: 'bg-purple-100 text-purple-800',
      scheduled_work: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.quoted;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-8">
        <Breadcrumb items={[{ label: 'Jobs' }]} />
        <div className="p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Jobs', href: '/dashboard/jobs' }]} />
      
      {/* Tabs */}
      <div className="bg-white border-b mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'jobs'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Jobs ({jobs.length})
          </button>
          <Link href="/dashboard/jobs/recurring">
            <button
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            >
              Recurring Jobs
            </button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center rounded bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          New Job
        </Link>
        <div className="flex flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-l border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button className="rounded-r bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="enquiry">Enquiry</option>
          <option value="quoted">Quoted</option>
          <option value="approved">Approved</option>
          <option value="scheduled_measure_quote">Scheduled for Measure & Quote</option>
          <option value="scheduled_work">Scheduled for Work</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={[
            {
              key: 'job_number',
              label: 'Job #',
              align: 'left',
              render: (job: Job) => (
                <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline font-medium text-blue-700">
                  {job.job_number || 'No Job #'}
                </Link>
              )
            },
            {
              key: 'job_name',
              label: 'Job Name',
              align: 'left',
              render: (job: Job) => job.job_name || '-'
            },
            {
              key: 'customer',
              label: 'Customer',
              align: 'left',
              render: (job: Job) => (
                <Link href={job.clients?.name ? `/dashboard/clients/${job.client_id}` : '#'} className="hover:underline text-blue-700">
                  {job.clients?.name || 'N/A'}
                </Link>
              )
            },
            {
              key: 'status',
              label: 'Status',
              align: 'center',
              render: (job: Job) => {
                const status = job.status?.toLowerCase().replace(/_/g, ' ').trim() || '';
                const bgColor = (() => {
                  if (status === 'enquiry') return '#94A3B8';
                  if (status === 'quoted') return '#F59E0B';
                  if (status === 'approved') return '#3B82F6';
                  if (status === 'scheduled measure quote') return '#8B5CF6';
                  if (status === 'scheduled work') return '#7C2D12';
                  if (status === 'in progress') return '#0EA5A4';
                  if (status === 'completed') return '#10B981';
                  if (status === 'invoiced') return '#0369A1';
                  if (status === 'paid') return '#059669';
                  if (status === 'cancelled') return '#EF4444';
                  return '#94A3B8';
                })();
                return (
                  <span 
                    className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 text-white"
                    style={{ backgroundColor: bgColor }}
                  >
                    {job.status}
                  </span>
                );
              }
            },
            {
              key: 'total_amount',
              label: 'Job Value',
              align: 'center',
              render: (job: Job) => (
                <span className="font-medium">
                  {typeof job.total_amount === 'number' ? `$${job.total_amount.toFixed(2)}` : '-'}
                </span>
              )
            },
            {
              key: 'address',
              label: 'Job Address',
              align: 'left',
              render: (job: Job) => job.clients?.address || '-'
            },
            {
              key: 'scheduled_date',
              label: 'Scheduled',
              align: 'center',
              render: (job: Job) => formatDate(job.scheduled_date)
            },
            {
              key: 'invoice_status',
              label: 'Invoice Status',
              align: 'center',
              render: (job: Job) => (
                job.invoices && job.invoices.length > 0 ? (
                  <Link href={`/dashboard/invoices/${job.invoices[0].id}`} className="text-blue-600 hover:text-blue-900 font-semibold">
                    Invoice: {job.invoices[0].invoice_number || job.invoices[0].id}
                  </Link>
                ) : '-'
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'center',
              render: (job: Job) => (
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowActionsMenu(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all"
                    style={{
                      backgroundColor: colors.accent.DEFAULT,
                      color: 'white',
                    }}
                  >
                    More Actions
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showActionsMenu[job.id] && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <Link
                          href={`/dashboard/invoices/new?job_id=${job.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowActionsMenu({})}
                        >
                          Create Invoice
                        </Link>
                        <Link
                          href={`/dashboard/quotes/new?job_id=${job.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowActionsMenu({})}
                        >
                          Create Quote
                        </Link>
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowActionsMenu({})}
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          ]}
          data={(statusFilter === 'all' ? jobs : jobs.filter(job => job.status === statusFilter))
            .filter(job => !search || job.job_name?.toLowerCase().includes(search.toLowerCase()) || job.job_number?.toLowerCase().includes(search.toLowerCase()))}
          loading={loading}
          emptyMessage="No jobs yet. Create your first job!"
        />
      </div>
    </div>
  );
}