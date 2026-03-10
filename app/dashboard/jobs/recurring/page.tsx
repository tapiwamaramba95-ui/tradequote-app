"use client";
import { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function RecurringJobsPage() {
  // Example data
  const recurringJobs: Array<{id: string, name: string, customer: string, reference: string, address: string, staff: string, lastOccurrence: string, nextOccurrence: string}> = [];
  const [search, setSearch] = useState('');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Jobs', href: '/dashboard/jobs' },
        { label: 'Recurring Jobs' }
      ]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Recurring Jobs</h1>
          <p className="text-sm text-gray-700">Manage your recurring and scheduled jobs</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6 w-full">
        <div className="flex gap-0 mb-6">
          <Link href="/dashboard/jobs">
            <button className="px-6 py-2 rounded-t font-semibold text-base bg-gray-100 text-gray-500">Jobs</button>
          </Link>
          <button className="px-6 py-2 rounded-t font-semibold text-base bg-white text-cyan-700 border-b-2 border-cyan-700">Recurring Jobs</button>
        </div>
        <div className="flex items-center mb-4 gap-4">
          <Link href="/dashboard/jobs/recurring/new">
            <button className="bg-cyan-600 text-white px-6 py-2 rounded font-semibold shadow">New Recurring Job</button>
          </Link>
          <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-4 py-2 flex-1 max-w-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Job</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Customer</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Reference</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Last Occurrence</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Next Occurrence</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 border-b">
                    No recurring jobs found.{' '}
                    <Link href="/dashboard/jobs/recurring/new" className="text-blue-600 hover:underline font-medium">
                      Create your first recurring job
                    </Link>
                  </td>
                </tr>
              ) : (
                recurringJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-5 whitespace-nowrap font-medium text-blue-700">
                      <Link href="#" className="hover:underline">{job.name}</Link>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">{job.customer}</td>
                    <td className="px-4 py-5 whitespace-nowrap">{job.reference}</td>
                    <td className="px-4 py-5 whitespace-nowrap">{job.lastOccurrence}</td>
                    <td className="px-4 py-5 whitespace-nowrap">{job.nextOccurrence}</td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <Link href={`/dashboard/jobs/recurring/${job.id}`} className="text-blue-600 hover:text-blue-900 font-semibold">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
