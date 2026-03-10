"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function EnquiriesPage() {
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [search, setSearch] = useState('');
  // Example data
  const enquiries = [
    {
      id: '1',
      name: 'Tapiwa',
      phone: '0420595663',
      email: '',
      received: '12 Feb 2026',
      location: '44 honour avenue, lilydale, vic, 3140',
      source: 'Entered by Tapiwa Maramba',
      action: 'Quote Created',
      status: 'done',
    },
  ];

  const filtered = enquiries.filter(e =>
    (!search || e.name.toLowerCase().includes(search.toLowerCase())) &&
    (activeTab === 'todo' ? e.status !== 'done' : e.status === 'done')
  );

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <span>Enquiries</span>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-0 mb-6 border-b">
          <button 
            className={`px-6 py-2 font-semibold text-base ${
              activeTab === 'todo' 
                ? 'bg-white text-cyan-700 border-b-2 border-cyan-700' 
                : 'bg-gray-100 text-gray-500'
            }`} 
            onClick={() => setActiveTab('todo')}
          >
            To-Do
          </button>
          <button 
            className={`px-6 py-2 font-semibold text-base ${
              activeTab === 'done' 
                ? 'bg-white text-cyan-700 border-b-2 border-cyan-700' 
                : 'bg-gray-100 text-gray-500'
            }`} 
            onClick={() => setActiveTab('done')}
          >
            Done
          </button>
        </div>
        <div className="flex items-center mb-4 gap-4">
          <Link href="/enquiries/new">
            <button className="bg-cyan-600 text-white px-6 py-2 rounded font-semibold shadow">New Enquiry</button>
          </Link>
          <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-4 py-2 flex-1 max-w-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone Number</th>
                <th className="px-4 py-2 text-left">Email Address</th>
                <th className="px-4 py-2 text-left">Received</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Action taken</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    <div className="border rounded p-6 bg-gray-50 inline-block">
                      <div className="mb-2 font-semibold">Enquiries are not set-up</div>
                      <div className="text-sm">Set-up Enquiries or publish your Website to get customer emails, website enquiries and work orders straight into Tradify</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className="border-b last:border-none">
                    <td className="px-4 py-2 text-cyan-700 font-semibold"><Link href="#">{e.name}</Link></td>
                    <td className="px-4 py-2">{e.phone}</td>
                    <td className="px-4 py-2">{e.email}</td>
                    <td className="px-4 py-2">{e.received}</td>
                    <td className="px-4 py-2">{e.location}</td>
                    <td className="px-4 py-2">{e.source}</td>
                    <td className="px-4 py-2"><span className="bg-purple-200 text-purple-700 px-3 py-1 rounded text-xs font-semibold">{e.action}</span></td>
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
