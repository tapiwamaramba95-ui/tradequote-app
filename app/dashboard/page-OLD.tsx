"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButtons } from '@/components/ActionButtons';
import { colors } from '@/lib/colors';

type QuickStats = {
  outstandingRevenue: number;
  jobsToday: number;
  needsAction: number;
};

type ActionItem = {
  id: string;
  type: 'invoice' | 'quote' | 'job';
  urgency: 'urgent' | 'warning' | 'info';
  title: string;
  subtitle: string;
  entityId: string;
  daysOverdue?: number;
};

type TodaysJob = {
  id: string;
  job_number: string;
  job_name: string;
  scheduled_date: string;
  clients: {
    name: string;
  } | null;
};

type Activity = {
  id: string;
  type: 'invoice' | 'quote' | 'job' | 'payment';
  title: string;
  subtitle: string;
  time: string;
  icon: string;
};

type StatusOverview = {
  invoices: { draft: number; unpaid: number; overdue: number; paid: number };
  quotes: { draft: number; sent: number; accepted: number; declined: number };
  purchaseOrders: { draft: number; unbilled: number; billed: number };
};

export default function DashboardPage() {
  const router = useRouter()
  
  const [quickStats, setQuickStats] = useState<QuickStats>({
    outstandingRevenue: 0,
    jobsToday: 0,
    needsAction: 0,
  });
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [todaysJobs, setTodaysJobs] = useState<TodaysJob[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [statusOverview, setStatusOverview] = useState<StatusOverview>({
    invoices: { draft: 0, unpaid: 0, overdue: 0, paid: 0 },
    quotes: { draft: 0, sent: 0, accepted: 0, declined: 0 },
    purchaseOrders: { draft: 0, unbilled: 0, billed: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    // Refresh data when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    };

    // Refresh data every 30 seconds when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Load all dashboard data in parallel
      await Promise.all([
        loadQuickStats(session.user.id),
        loadActionItems(session.user.id),
        loadTodaysJobs(session.user.id),
        loadRecentActivity(session.user.id),
        loadStatusOverview(session.user.id),
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadQuickStats = async (userId: string) => {
    try {
      // Get outstanding revenue
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', userId)
        .in('status', ['unpaid', 'overdue']);

      const outstandingRevenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      // Get jobs today
      const today = new Date().toISOString().split('T')[0];
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .gte('scheduled_date', today)
        .lt('scheduled_date', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

      const jobsToday = jobs?.length || 0;

      // Count action items
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'overdue');

      const { data: expiringQuotes } = await supabase
        .from('quotes')
        .select('id, valid_until')
        .eq('user_id', userId)
        .eq('status', 'sent');

      const quotesExpiring = expiringQuotes?.filter(q => {
        if (!q.valid_until) return false;
        const daysUntilExpiry = Math.ceil((new Date(q.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
      }).length || 0;

      const { data: unscheduledJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .is('scheduled_date', null);

      const needsAction = (overdueInvoices?.length || 0) + quotesExpiring + (unscheduledJobs?.length || 0);

      setQuickStats({
        outstandingRevenue,
        jobsToday,
        needsAction,
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const loadActionItems = async (userId: string) => {
    try {
      const items: ActionItem[] = [];

      // Overdue invoices (urgent - red)
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total,
          due_date,
          jobs!job_id (
            job_name,
            clients!client_id (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true })
        .limit(5);

      overdueInvoices?.forEach(inv => {
        const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
        const client = Array.isArray(inv.jobs) && inv.jobs.length > 0 && Array.isArray(inv.jobs[0].clients) && inv.jobs[0].clients.length > 0 ? inv.jobs[0].clients[0] : null;
        items.push({
          id: inv.id,
          type: 'invoice',
          urgency: 'urgent',
          title: `Invoice ${inv.invoice_number} overdue`,
          subtitle: client?.name || 'Unknown client',
          entityId: inv.id,
          daysOverdue,
        });
      });

      // Expiring quotes (warning - orange)
      const { data: expiringQuotes } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          total,
          valid_until,
          jobs!job_id (
            job_name,
            clients!client_id (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'sent')
        .not('valid_until', 'is', null)
        .order('valid_until', { ascending: true });

      const now = Date.now();
      expiringQuotes?.forEach(quote => {
        if (!quote.valid_until) return;
        const daysUntilExpiry = Math.ceil((new Date(quote.valid_until).getTime() - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
          const client = Array.isArray(quote.jobs) && quote.jobs.length > 0 && Array.isArray(quote.jobs[0].clients) && quote.jobs[0].clients.length > 0 ? quote.jobs[0].clients[0] : null;
          items.push({
            id: quote.id,
            type: 'quote',
            urgency: 'warning',
            title: `Quote ${quote.quote_number} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            subtitle: client?.name || 'Unknown client',
            entityId: quote.id,
          });
        }
      });

      // Unscheduled jobs (info - blue)
      const { data: unscheduledJobs } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_name,
          clients!client_id (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .is('scheduled_date', null)
        .limit(5);

      unscheduledJobs?.forEach(job => {
        const client = Array.isArray(job.clients) && job.clients.length > 0 ? job.clients[0] : null;
        items.push({
          id: job.id,
          type: 'job',
          urgency: 'info',
          title: `Schedule job ${job.job_number}`,
          subtitle: client?.name || 'Unknown client',
          entityId: job.id,
        });
      });

      // Sort by urgency
      items.sort((a, b) => {
        const urgencyOrder = { urgent: 0, warning: 1, info: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setActionItems(items);
    } catch (error) {
      console.error('Error loading action items:', error);
    }
  };

  const loadTodaysJobs = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_name,
          scheduled_date,
          clients!client_id (
            name
          )
        `)
        .eq('user_id', userId)
        .gte('scheduled_date', today)
        .lt('scheduled_date', tomorrow)
        .order('scheduled_date', { ascending: true });

      const transformedJobs = jobs?.map(job => ({
        ...job,
        clients: Array.isArray(job.clients) && job.clients.length > 0 ? job.clients[0] : null
      })) || [];

      setTodaysJobs(transformedJobs);
    } catch (error) {
      console.error('Error loading today\'s jobs:', error);
    }
  };

  const loadRecentActivity = async (userId: string) => {
    try {
      const activities: Activity[] = [];

      // Recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          created_at,
          jobs!job_id (
            clients!client_id (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      invoices?.forEach(inv => {
        const client = Array.isArray(inv.jobs) && inv.jobs.length > 0 && Array.isArray(inv.jobs[0].clients) && inv.jobs[0].clients.length > 0 ? inv.jobs[0].clients[0] : null;
        activities.push({
          id: inv.id,
          type: 'invoice',
          title: `Invoice ${inv.invoice_number} created`,
          subtitle: client?.name || 'Unknown client',
          time: new Date(inv.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          icon: '📄',
        });
      });

      // Recent quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          created_at,
          jobs!job_id (
            clients!client_id (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      quotes?.forEach(quote => {
        const client = Array.isArray(quote.jobs) && quote.jobs.length > 0 && Array.isArray(quote.jobs[0].clients) && quote.jobs[0].clients.length > 0 ? quote.jobs[0].clients[0] : null;
        activities.push({
          id: quote.id,
          type: 'quote',
          title: `Quote ${quote.quote_number} created`,
          subtitle: client?.name || 'Unknown client',
          time: new Date(quote.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          icon: '📋',
        });
      });

      // Sort by created_at
      activities.sort((a, b) => {
        const timeA = invoices?.find(i => i.invoice_number === a.title.match(/\d+/)?.[0])?.created_at ||
                      quotes?.find(q => q.quote_number === b.title.match(/\d+/)?.[0])?.created_at || '';
        const timeB = invoices?.find(i => i.invoice_number === b.title.match(/\d+/)?.[0])?.created_at ||
                      quotes?.find(q => q.quote_number === b.title.match(/\d+/)?.[0])?.created_at || '';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadStatusOverview = async (userId: string) => {
    try {
      // Invoices by status
      const { data: invoiceStats } = await supabase
        .from('invoices')
        .select('status')
        .eq('user_id', userId);

      const invoices = {
        draft: invoiceStats?.filter(i => i.status === 'draft').length || 0,
        unpaid: invoiceStats?.filter(i => i.status === 'unpaid').length || 0,
        overdue: invoiceStats?.filter(i => i.status === 'overdue').length || 0,
        paid: invoiceStats?.filter(i => i.status === 'paid').length || 0,
      };

      // Quotes by status
      const { data: quoteStats } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', userId);

      const quotes = {
        draft: quoteStats?.filter(q => q.status === 'draft').length || 0,
        sent: quoteStats?.filter(q => q.status === 'sent').length || 0,
        accepted: quoteStats?.filter(q => q.status === 'accepted').length || 0,
        declined: quoteStats?.filter(q => q.status === 'declined').length || 0,
      };

      // Purchase Orders by status
      const { data: poStats } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('user_id', userId);

      const purchaseOrders = {
        draft: poStats?.filter(po => po.status === 'draft').length || 0,
        unbilled: poStats?.filter(po => po.status === 'ordered').length || 0,
        billed: poStats?.filter(po => po.status === 'billed').length || 0,
      };

      setStatusOverview({
        invoices,
        quotes,
        purchaseOrders,
      });
    } catch (error) {
      console.error('Error loading status overview:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    return urgency === 'urgent' ? 'border-red-500' : urgency === 'warning' ? 'border-orange-500' : 'border-blue-500';
  };

  const getUrgencyBg = (urgency: string) => {
    return urgency === 'urgent' ? 'bg-red-50' : urgency === 'warning' ? 'bg-orange-50' : 'bg-blue-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary.DEFAULT }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>Dashboard</h1>
      </div>

      <div className="p-8 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Outstanding Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Outstanding Revenue
                </div>
                <div className="text-3xl font-bold mt-2" style={{ color: colors.text.primary }}>
                  ${quickStats.outstandingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.primary.light }}>
                <svg className="w-8 h-8" style={{ color: colors.accent.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Jobs Today */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Jobs Today
                </div>
                <div className="text-3xl font-bold mt-2" style={{ color: colors.text.primary }}>
                  {quickStats.jobsToday}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Needs Action */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Needs Action
                </div>
                <div className="text-3xl font-bold mt-2" style={{ color: colors.text.primary }}>
                  {quickStats.needsAction}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-100">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 2/3 left, 1/3 right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Required */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Action Required
                </h2>
                <Link href="/dashboard/jobs" className="text-sm font-medium" style={{ color: colors.primary.DEFAULT }}>
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {actionItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                      All caught up!
                    </p>
                    <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                      No items need your attention right now
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border-l-4 ${getUrgencyBg(item.urgency)} ${getUrgencyColor(item.urgency)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium" style={{ color: colors.text.primary }}>
                              {item.title}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                              {item.subtitle}
                            </p>
                            {item.daysOverdue && (
                              <p className="text-xs mt-1 font-medium text-red-600">
                                {item.daysOverdue} days overdue
                              </p>
                            )}
                          </div>
                          <ActionButtons
                            type={item.type}
                            id={item.entityId}
                            onActionComplete={() => loadDashboard()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      No recent activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium" style={{ color: colors.text.primary }}>
                            {activity.title}
                          </p>
                          <p className="text-sm" style={{ color: colors.text.secondary }}>
                            {activity.subtitle}
                          </p>
                        </div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Today's Schedule
                </h2>
                <Link href="/dashboard/schedule" className="text-sm font-medium" style={{ color: colors.primary.DEFAULT }}>
                  Calendar →
                </Link>
              </div>
              <div className="p-6">
                {/* Calendar Date */}
                <div className="mb-6">
                  <div className="rounded-xl p-6 text-white text-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary.DEFAULT}, ${colors.primary.dark})` }}>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                      {new Date().toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-5xl font-bold my-1">
                      {new Date().getDate()}
                    </div>
                    <div className="text-xs opacity-90">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                </div>

                {/* Jobs List */}
                {todaysJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      No jobs scheduled today
                    </p>
                    <Link href="/dashboard/schedule" className="text-xs font-medium mt-2 inline-block" style={{ color: colors.primary.DEFAULT }}>
                      Schedule a job
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/dashboard/jobs/${job.id}`}
                        className="block p-3 hover:bg-gray-50 rounded-lg transition group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.status.completed.bg }}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium group-hover:text-cyan-600" style={{ color: colors.text.primary }}>
                              {job.job_number}
                            </div>
                            <div className="text-sm truncate" style={{ color: colors.text.secondary }}>
                              {job.clients?.name || 'No client'}
                            </div>
                            <div className="text-xs truncate mt-1" style={{ color: colors.text.secondary }}>
                              {job.job_name}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Create */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                Quick Create
              </h2>
              <div className="space-y-2">
                <Link
                  href="/enquiries/new"
                  className="w-full px-4 py-3 rounded-lg font-medium text-sm transition flex items-center gap-2 hover:bg-gray-50"
                  style={{ color: colors.text.primary, border: `1px solid ${colors.border.DEFAULT}` }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Enquiry
                </Link>
                <Link
                  href="/dashboard/quotes/new"
                  className="w-full px-4 py-3 rounded-lg font-medium text-sm transition flex items-center gap-2 hover:bg-gray-50"
                  style={{ color: colors.text.primary, border: `1px solid ${colors.border.DEFAULT}` }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Quote
                </Link>
                <Link
                  href="/dashboard/invoices/new"
                  className="w-full px-4 py-3 rounded-lg font-medium text-sm transition flex items-center gap-2 hover:bg-gray-50"
                  style={{ color: colors.text.primary, border: `1px solid ${colors.border.DEFAULT}` }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  New Invoice
                </Link>
                <Link
                  href="/dashboard/timesheets"
                  className="w-full px-4 py-3 rounded-lg text-white font-medium text-sm transition flex items-center gap-2"
                  style={{ backgroundColor: colors.primary.DEFAULT }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Clock In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Status Overview - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoices */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.text.secondary }}>
                Invoices
              </h3>
              <Link href="/dashboard/invoices" className="text-xs font-medium" style={{ color: colors.primary.DEFAULT }}>
                View →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>DRAFT</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.draft.bg, color: colors.status.draft.text }}>
                  {statusOverview.invoices.draft}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>UNPAID</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.sent.bg, color: colors.status.sent.text }}>
                  {statusOverview.invoices.unpaid}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>OVERDUE</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  {statusOverview.invoices.overdue}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>PAID</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.paid.bg, color: colors.status.paid.text }}>
                  {statusOverview.invoices.paid}
                </span>
              </div>
            </div>
          </div>

          {/* Quotes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.text.secondary }}>
                Quotes
              </h3>
              <Link href="/dashboard/quotes" className="text-xs font-medium" style={{ color: colors.primary.DEFAULT }}>
                View →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>DRAFT</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.draft.bg, color: colors.status.draft.text }}>
                  {statusOverview.quotes.draft}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>SENT</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.sent.bg, color: colors.status.sent.text }}>
                  {statusOverview.quotes.sent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>ACCEPTED</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.accepted.bg, color: colors.status.accepted.text }}>
                  {statusOverview.quotes.accepted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>DECLINED</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  {statusOverview.quotes.declined}
                </span>
              </div>
            </div>
          </div>

          {/* Purchase Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.text.secondary }}>
                Purchase Orders
              </h3>
              <Link href="/dashboard/purchase-orders" className="text-xs font-medium" style={{ color: colors.primary.DEFAULT }}>
                View →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>DRAFT</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.draft.bg, color: colors.status.draft.text }}>
                  {statusOverview.purchaseOrders.draft}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>UNBILLED</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.sent.bg, color: colors.status.sent.text }}>
                  {statusOverview.purchaseOrders.unbilled}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: colors.text.primary }}>BILLED</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.status.billed.bg, color: colors.status.billed.text }}>
                  {statusOverview.purchaseOrders.billed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}