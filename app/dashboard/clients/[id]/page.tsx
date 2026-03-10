"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';
import Link from "next/link";
import Breadcrumb from '@/components/Breadcrumb';
import { StatusBadge } from '@/components/StatusBadge';

type Job = {
  id: string;
  job_number: string;
  job_name: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
};

type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  created_at: string;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [client, setClient] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!clientId) return;
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    // Fetch client details including structured address fields
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*, street_address, suburb, state, postcode')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error('Client fetch error:', clientError);
      setClient(null);
      setLoading(false);
      return;
    }

    setClient(clientData);
    setForm(clientData);

    // Fetch related jobs with job_number
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('id, job_number, job_name, status, total_amount, scheduled_date')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    setJobs(jobsData || []);

    // Fetch related quotes through jobs relationship
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id, 
        quote_number, 
        status, 
        total, 
        created_at,
        jobs!inner(client_id)
      `)
      .eq('jobs.client_id', clientId)
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error('Quotes fetch error:', {
        error: quotesError,
        message: quotesError.message,
        details: quotesError.details,
        hint: quotesError.hint,
        code: quotesError.code,
        clientId: clientId
      });
    }
    setQuotes(quotesData || []);
    setLoading(false);
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('clients')
      .update(form)
      .eq('id', clientId);
    
    if (!error) {
      setClient(form);
      setEdit(false);
    } else {
      console.error('Error updating client:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (!error) {
      router.push('/dashboard/clients');
    } else {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Make sure there are no related jobs or quotes.');
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
  
  if (!client) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        Client not found.
      </div>
      <Link href="/dashboard/clients" className="text-blue-600 hover:underline mt-4 inline-block">
        ← Back to Clients
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <Breadcrumb items={[
          { label: 'Clients', href: '/dashboard/clients' },
          { label: client?.name || clientId }
        ]} />
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600 mt-1">
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} • {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" 
              onClick={() => setEdit((v) => !v)}
            >
              {edit ? "Cancel" : "Edit"}
            </button>
            {edit && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" 
                onClick={handleSave}
              >
                Save Changes
              </button>
            )}
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium" 
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Contact & Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      {edit ? (
                        <input 
                          name="name" 
                          value={form.name || ''} 
                          onChange={handleChange} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                          required
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{client.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      {edit ? (
                        <input 
                          name="email" 
                          type="email"
                          value={form.email || ''} 
                          onChange={handleChange} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                        />
                      ) : (
                        <p className="text-gray-900">{client.email || <span className="text-gray-400">Not provided</span>}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      {edit ? (
                        <input 
                          name="phone" 
                          value={form.phone || ''} 
                          onChange={handleChange} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                        />
                      ) : (
                        <p className="text-gray-900">{client.phone || <span className="text-gray-400">Not provided</span>}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      {edit ? (
                        <input 
                          name="mobile" 
                          value={form.mobile || ''} 
                          onChange={handleChange} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                        />
                      ) : (
                        <p className="text-gray-900">{client.mobile || <span className="text-gray-400">Not provided</span>}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      {edit ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                            <input 
                              name="street_address" 
                              value={form.street_address || ''} 
                              onChange={handleChange} 
                              placeholder="45 Workshop Street"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Suburb</label>
                            <input 
                              name="suburb" 
                              value={form.suburb || ''} 
                              onChange={handleChange} 
                              placeholder="Melbourne"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                              <select 
                                name="state" 
                                value={form.state || ''} 
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              >
                                <option value="">Select State</option>
                                <option value="NSW">NSW</option>
                                <option value="VIC">VIC</option>
                                <option value="QLD">QLD</option>
                                <option value="SA">SA</option>
                                <option value="WA">WA</option>
                                <option value="TAS">TAS</option>
                                <option value="NT">NT</option>
                                <option value="ACT">ACT</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Postcode</label>
                              <input 
                                name="postcode" 
                                value={form.postcode || ''} 
                                onChange={handleChange} 
                                placeholder="3000"
                                maxLength={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900">
                          {(client.street_address || client.suburb || client.state || client.postcode) ? (
                            <div className="space-y-1">
                              {client.street_address && <div>{client.street_address}</div>}
                              {(client.suburb || client.state || client.postcode) && (
                                <div>
                                  {[client.suburb, client.state, client.postcode].filter(Boolean).join(' ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            client.address ? (
                              <div className="whitespace-pre-wrap">{client.address}</div>
                            ) : (
                              <span className="text-gray-400">Not provided</span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="p-6">
                <textarea 
                  name="notes" 
                  value={form.notes || ''} 
                  onChange={handleChange} 
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none" 
                  placeholder="Add notes about this client..."
                  disabled={!edit}
                />
              </div>
            </div>

            {/* Related Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Related Jobs ({jobs.length})</h2>
                <Link 
                  href={`/dashboard/jobs/new?client_id=${clientId}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + New Job
                </Link>
              </div>
              <div className="p-6">
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No jobs yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create the first job for this client</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/dashboard/jobs/${job.id}`} className="text-blue-600 hover:underline font-semibold">
                              {job.job_number || `JOB-${job.id.slice(0, 8)}`}
                            </Link>
                            <StatusBadge status={job.status} />
                          </div>
                          <p className="text-gray-900 font-medium">{job.job_name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Value: <span className="font-medium">${job.total_amount?.toFixed(2) || '0.00'}</span>
                            {job.scheduled_date && (
                              <> • Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <Link href={`/dashboard/jobs/${job.id}`} className="ml-4 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium">
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Related Quotes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Related Quotes ({quotes.length})</h2>
                <Link 
                  href={`/dashboard/quotes/new?client_id=${clientId}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + New Quote
                </Link>
              </div>
              <div className="p-6">
                {quotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No quotes yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create the first quote for this client</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/dashboard/quotes/${quote.id}`} className="text-blue-600 hover:underline font-semibold">
                              {quote.quote_number}
                            </Link>
                            <StatusBadge status={quote.status} />
                          </div>
                          <p className="text-sm text-gray-600">
                            Total: <span className="font-medium">${quote.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            • Created: {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        <Link href={`/dashboard/quotes/${quote.id}`} className="ml-4 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium">
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Jobs</span>
                  <span className="font-semibold text-gray-900">{jobs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Quotes</span>
                  <span className="font-semibold text-gray-900">{quotes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Job Value</span>
                  <span className="font-semibold text-gray-900">
                    ${jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quote Value</span>
                  <span className="font-semibold text-gray-900">
                    ${quotes.reduce((sum, quote) => sum + (quote.total || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Client created</p>
                      <p className="text-xs text-gray-600">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  {client.updated_at && client.updated_at !== client.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Profile updated</p>
                        <p className="text-xs text-gray-600">
                          {new Date(client.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
