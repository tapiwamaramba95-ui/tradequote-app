"use client";
import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function NewRecurringJobPage() {
  const [form, setForm] = useState({
    jobType: '',
    jobName: '',
    customer: '',
    reference: '',
    address: '',
    staff: '',
    frequency: 'Daily',
    startTime: '',
    finishTime: '',
    nextOccurrence: '',
    stopDate: '',
    createJobDaysBefore: 2,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save recurring job to backend
    alert('Recurring job submitted!');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Jobs', href: '/dashboard/jobs' },
        { label: 'Recurring Jobs', href: '/dashboard/jobs/recurring' },
        { label: 'New' }
      ]} />
      <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">New Recurring Job</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Job Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <input type="text" name="jobType" value={form.jobType} onChange={handleChange} className="w-full border rounded px-4 py-2" placeholder="Create and Schedule Job" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select name="frequency" value={form.frequency} onChange={handleChange} className="w-full border rounded px-4 py-2">
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Finish Time</label>
                <input type="time" name="finishTime" value={form.finishTime} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Next Occurrence</label>
                <input type="date" name="nextOccurrence" value={form.nextOccurrence} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stop Date</label>
                <input type="date" name="stopDate" value={form.stopDate} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Create Job</label>
                <input type="number" name="createJobDaysBefore" value={form.createJobDaysBefore} onChange={handleChange} className="w-full border rounded px-4 py-2" placeholder="Days before it's due" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-6">Job Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Job Name</label>
                <input type="text" name="jobName" value={form.jobName} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer</label>
                <input type="text" name="customer" value={form.customer} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reference</label>
                <input type="text" name="reference" value={form.reference} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Address</label>
                <AddressInput
                  value={form.address}
                  onChange={(address) => setForm(prev => ({ ...prev, address }))}
                  required={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Staff</label>
                <input type="text" name="staff" value={form.staff} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={6} className="w-full border rounded px-4 py-2" />
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Link href="/dashboard/jobs/recurring">
              <button type="button" className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
            </Link>
            <button type="submit" className="px-6 py-2 rounded bg-cyan-600 text-white font-semibold">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
