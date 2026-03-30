import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessName,
      customerName,
      customerEmail,
      customerPhone,
      streetAddress,
      suburb,
      state,
      postcode,
      description,
      jobType,
    } = body

    if (!businessName || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseAdmin = await createSupabaseAdmin()

    // Helper function to generate slug from company name
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // Find the business by company name slug
    const { data: allBusinesses } = await supabaseAdmin
      .from('business_settings')
      .select('user_id, company_name')

    if (!allBusinesses || allBusinesses.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const matchingBusiness = allBusinesses.find(
      (business) =>
        business.company_name && generateSlug(business.company_name) === businessName
    )

    if (!matchingBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const userId = matchingBusiness.user_id

    // Check if enquiry form is enabled (defaults to true if no settings exist)
    const { data: enquirySettings } = await supabaseAdmin
      .from('enquiry_settings')
      .select('form_enabled')
      .eq('user_id', userId)
      .maybeSingle()

    // Only reject if settings exist AND form_enabled is explicitly false
    if (enquirySettings && enquirySettings.form_enabled === false) {
      return NextResponse.json(
        { error: 'Enquiry form is not enabled' },
        { status: 403 }
      )
    }

    // Get business_id for the user
    const { data: userBusiness } = await supabaseAdmin
      .from('user_businesses')
      .select('business_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!userBusiness || !userBusiness.business_id) {
      return NextResponse.json(
        { error: 'No business found for user' },
        { status: 400 }
      )
    }

    const businessId = userBusiness.business_id

    // Step 1: Find or create client
    let clientId: string | null = null

    if (customerEmail) {
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('business_id', businessId)
        .eq('email', customerEmail)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
      }
    }

    // Create new client if not found
    if (!clientId) {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          business_id: businessId,
          name: customerName,
          email: customerEmail || null,
          phone: customerPhone || null,
          street_address: streetAddress || null,
          suburb: suburb || null,
          state: state || null,
          postcode: postcode || null,
        })
        .select('id')
        .single()

      if (clientError) {
        console.error('Error creating client:', clientError)
        return NextResponse.json(
          { error: 'Failed to create client', details: clientError.message },
          { status: 500 }
        )
      }

      if (!newClient) {
        return NextResponse.json(
          { error: 'Failed to create client' },
          { status: 500 }
        )
      }

      clientId = newClient.id
    }

    // Step 2: Get job settings to generate job number
    const { data: jobSettings } = await supabaseAdmin
      .from('business_settings')
      .select('job_prefix')
      .eq('user_id', userId)
      .maybeSingle()

    const prefix = jobSettings?.job_prefix || 'ENQ'

    // Find the highest job number for this user with this prefix
    // Order by job_number DESC to get the actual highest number, not most recent by date
    const { data: allJobs } = await supabaseAdmin
      .from('jobs')
      .select('job_number')
      .eq('business_id', businessId)
      .ilike('job_number', `${prefix}%`)

    let nextNumber = 1
    if (allJobs && allJobs.length > 0) {
      // Extract all numbers and find the maximum
      const numbers = allJobs
        .map(job => {
          const match = job.job_number?.match(/\d+$/)
          return match ? parseInt(match[0], 10) : 0
        })
        .filter(num => !isNaN(num))
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1
      }
    }

    const jobNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`

    // Step 3: Create enquiry record in enquiries table
    const fullAddress = [streetAddress, suburb, state, postcode]
      .filter(Boolean)
      .join(', ') || null

    const { data: newEnquiry, error: enquiryError } = await supabaseAdmin
      .from('enquiries')
      .insert({
        user_id: userId,
        client_id: clientId,
        enquiry_number: jobNumber,
        name: customerName,
        email: customerEmail || null,
        phone: customerPhone || null,
        address: fullAddress,
        message: description || null,
        job_type: jobType || null,
        status: 'new',
      })
      .select('id')
      .single()

    if (enquiryError) {
      console.error('Error creating enquiry:', enquiryError)
      return NextResponse.json(
        { error: 'Failed to create enquiry', details: enquiryError.message },
        { status: 500 }
      )
    }

    if (!newEnquiry) {
      return NextResponse.json(
        { error: 'Failed to create enquiry' },
        { status: 500 }
      )
    }

    // Step 4: Create job with status='enquiry' (automatically from enquiry)
    const { data: newJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        business_id: businessId,
        client_id: clientId,
        job_number: jobNumber,
        enquiry_number: jobNumber,
        title: jobNumber,
        job_name: jobNumber,
        street_address: streetAddress || null,
        suburb: suburb || null,
        state: state || null,
        postcode: postcode || null,
        description: description || null,
        enquiry_source: 'website_form',
        enquiry_date: new Date().toISOString(),
        status: 'enquiry',
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create enquiry', details: jobError.message },
        { status: 500 }
      )
    }

    if (!newJob) {
      return NextResponse.json(
        { error: 'Failed to create enquiry' },
        { status: 500 }
      )
    }

    // Step 5: Link enquiry to job
    await supabaseAdmin
      .from('enquiries')
      .update({
        converted_to_job_id: newJob.id,
      })
      .eq('id', newEnquiry.id)

    return NextResponse.json({
      success: true,
      enquiryId: newEnquiry.id,
      jobId: newJob.id,
      clientId: clientId,
    })
  } catch (error) {
    console.error('Error processing enquiry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
