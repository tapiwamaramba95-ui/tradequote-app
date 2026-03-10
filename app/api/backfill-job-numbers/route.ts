import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ 
        message: 'No jobs to backfill',
        updated: 0 
      });
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
        updates.push({ id: jobs[i].id, job_number: jobNumber });
      }
    }

    return NextResponse.json({
      message: `Successfully backfilled ${updates.length} jobs`,
      updated: updates.length,
      jobs: updates
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
