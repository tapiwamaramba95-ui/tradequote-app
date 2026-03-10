import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdmin()

    // Create the company-logos bucket
    const { data, error } = await supabase.storage.createBucket('company-logos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    })

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: data 
        ? 'Successfully created company-logos storage bucket!' 
        : 'company-logos storage bucket already exists!'
    })

  } catch (error: any) {
    console.error('Error setting up storage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup storage' },
      { status: 500 }
    )
  }
}