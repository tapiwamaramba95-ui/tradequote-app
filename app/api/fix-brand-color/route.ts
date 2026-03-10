import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supaBase = await createSupabaseAdmin()
    
    // Add the missing column using raw SQL
    const { error } = await supaBase.rpc('exec', {
      query: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'business_settings' AND column_name = 'primary_brand_color'
            ) THEN
                ALTER TABLE business_settings ADD COLUMN primary_brand_color TEXT DEFAULT '#0EA5A4';
                
                COMMENT ON COLUMN business_settings.primary_brand_color 
                IS 'Primary brand color in hex format (e.g., #0EA5A4) used in emails and customer-facing documents';
            END IF;
        END $$;
      `
    })

    if (error) {
      console.error('Error adding column:', error)
      return NextResponse.json({ 
        error: 'Failed to add column: ' + error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'primary_brand_color column added successfully!' 
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}