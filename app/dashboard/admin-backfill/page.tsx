'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BackfillJobNumbers() {
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [jobResult, setJobResult] = useState<any>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const handleBackfillJobs = async () => {
    setLoadingJobs(true);
    setJobError(null);
    setJobResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setJobError('You must be logged in');
        setLoadingJobs(false);
        return;
      }

      // Fetch business settings
      const { data: settings } = await supabase
        .from('business_settings')
        .select('job_prefix, job_start_number')
        .eq('user_id', user.id)
        .single();

      const jobPrefix = settings?.job_prefix || 'J';
      const startNumber = settings?.job_start_number || 1;

      // Get all jobs without job numbers, ordered by creation date
      const { data: jobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, created_at')
        .eq('user_id', user.id)
        .is('job_number', null)
        .order('created_at', { ascending: true });

      if (fetchError) {
        setJobError(fetchError.message);
        setLoadingJobs(false);
        return;
      }

      if (!jobs || jobs.length === 0) {
        setJobResult({ message: 'No jobs to backfill', updated: 0 });
        setLoadingJobs(false);
        return;
      }

      // Update each job with a sequential job number
      const updates = [];
      for (let i = 0; i < jobs.length; i++) {
        const jobNumber = `${jobPrefix}${String(startNumber + i).padStart(5, '0')}`;
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ job_number: jobNumber })
          .eq('id', jobs[i].id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error updating job ${jobs[i].id}:`, updateError);
        } else {
          updates.push({ id: jobs[i].id, number: jobNumber });
        }
      }

      setJobResult({
        message: `Successfully backfilled ${updates.length} jobs`,
        updated: updates.length,
        items: updates
      });

    } catch (err: any) {
      setJobError(err.message || 'An error occurred');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleBackfillQuotes = async () => {
    setLoadingQuotes(true);
    setQuoteError(null);
    setQuoteResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setQuoteError('You must be logged in');
        setLoadingQuotes(false);
        return;
      }

      // Fetch business settings
      const { data: settings } = await supabase
        .from('business_settings')
        .select('quote_prefix, quote_start_number')
        .eq('user_id', user.id)
        .single();

      const quotePrefix = settings?.quote_prefix || 'Q';
      const startNumber = settings?.quote_start_number || 1;

      // Get all quotes without quote numbers (or with old format), ordered by creation date
      const { data: quotes, error: fetchError } = await supabase
        .from('quotes')
        .select('id, created_at, quote_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        setQuoteError(fetchError.message);
        setLoadingQuotes(false);
        return;
      }

      if (!quotes || quotes.length === 0) {
        setQuoteResult({ message: 'No quotes to backfill', updated: 0 });
        setLoadingQuotes(false);
        return;
      }

      // Update each quote with a sequential quote number
      const updates = [];
      for (let i = 0; i < quotes.length; i++) {
        const quoteNumber = `${quotePrefix}${String(startNumber + i).padStart(3, '0')}`;
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ quote_number: quoteNumber })
          .eq('id', quotes[i].id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error updating quote ${quotes[i].id}:`, updateError);
        } else {
          updates.push({ id: quotes[i].id, number: quoteNumber });
        }
      }

      setQuoteResult({
        message: `Successfully backfilled ${updates.length} quotes`,
        updated: updates.length,
        items: updates
      });

    } catch (err: any) {
      setQuoteError(err.message || 'An error occurred');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleFixInvoiceUserIds = async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    setInvoiceResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setInvoiceError('You must be logged in');
        setLoadingInvoices(false);
        return;
      }

      // Get all invoices with null user_id that have a job_id
      const { data: invoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id, job_id')
        .is('user_id', null)
        .not('job_id', 'is', null);

      if (fetchError) {
        setInvoiceError(fetchError.message);
        setLoadingInvoices(false);
        return;
      }

      if (!invoices || invoices.length === 0) {
        setInvoiceResult({ message: 'No invoices found with missing user_id', updated: 0 });
        setLoadingInvoices(false);
        return;
      }

      const updates = [];
      
      for (const invoice of invoices) {
        // Get user_id from the job
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('user_id')
          .eq('id', invoice.job_id)
          .single();

        if (jobError || !job || !job.user_id) {
          console.log(`Could not get user_id for job ${invoice.job_id}`);
          continue;
        }

        // Update the invoice with the correct user_id
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ user_id: job.user_id })
          .eq('id', invoice.id);

        if (updateError) {
          console.error(`Failed to update invoice ${invoice.id}:`, updateError);
        } else {
          updates.push({ id: invoice.id, user_id: job.user_id });
        }
      }

      setInvoiceResult({
        message: `Successfully fixed ${updates.length} invoices`,
        updated: updates.length,
        items: updates
      });

    } catch (err: any) {
      setInvoiceError(err.message || 'An error occurred');
    } finally {
      setLoadingInvoices(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Backfill Numbering</h1>
        <p className="text-gray-600 mb-8">
          These utilities will assign sequential numbers to existing records based on their creation date.
        </p>

        {/* Job Numbers Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Job Numbers</h2>
          <p className="text-gray-600 mb-4">
            Assign job numbers to all existing jobs that don't have one.
          </p>

          <button
            onClick={handleBackfillJobs}
            disabled={loadingJobs}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingJobs ? 'Processing...' : 'Backfill Job Numbers'}
          </button>

          {jobError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{jobError}</p>
            </div>
          )}

          {jobResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold">{jobResult.message}</p>
              <p className="text-sm text-gray-600 mt-2">Updated {jobResult.updated} jobs</p>
              {jobResult.items && jobResult.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700">Job Numbers Assigned:</p>
                  <ul className="text-sm text-gray-600 mt-2 max-h-60 overflow-y-auto">
                    {jobResult.items.map((item: any) => (
                      <li key={item.id}>{item.number}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quote Numbers Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Quote Numbers</h2>
          <p className="text-gray-600 mb-4">
            Renumber all existing quotes with sequential numbers based on creation date.
          </p>

          <button
            onClick={handleBackfillQuotes}
            disabled={loadingQuotes}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingQuotes ? 'Processing...' : 'Backfill Quote Numbers'}
          </button>

          {quoteError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{quoteError}</p>
            </div>
          )}

          {quoteResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold">{quoteResult.message}</p>
              <p className="text-sm text-gray-600 mt-2">Updated {quoteResult.updated} quotes</p>
              {quoteResult.items && quoteResult.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700">Quote Numbers Assigned:</p>
                  <ul className="text-sm text-gray-600 mt-2 max-h-60 overflow-y-auto">
                    {quoteResult.items.map((item: any) => (
                      <li key={item.id}>{item.number}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice User ID Fix Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Invoice User ID Fix</h2>
          <p className="text-gray-600 mb-4">
            Fix invoices with missing user_id by getting it from their linked job.
          </p>

          <button
            onClick={handleFixInvoiceUserIds}
            disabled={loadingInvoices}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingInvoices ? 'Processing...' : 'Fix Invoice User IDs'}
          </button>

          {invoiceError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{invoiceError}</p>
            </div>
          )}

          {invoiceResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold">{invoiceResult.message}</p>
              <p className="text-sm text-gray-600 mt-2">Updated {invoiceResult.updated} invoices</p>
              {invoiceResult.items && invoiceResult.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700">Fixed Invoices:</p>
                  <ul className="text-sm text-gray-600 mt-2 max-h-60 overflow-y-auto">
                    {invoiceResult.items.map((item: any) => (
                      <li key={item.id}>Invoice {item.id} → User {item.user_id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
