/**
 * Setup script for Supabase Storage - Company Logos
 * Run this script to create the company-logos storage bucket
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This should be set in your environment
);

async function setupStorage() {
  console.log('Setting up company logos storage bucket...');

  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('company-logos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error && error.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', error);
      return;
    }

    if (data) {
      console.log('✅ Created company-logos bucket');
    } else {
      console.log('✅ company-logos bucket already exists');
    }

    console.log('Storage setup complete!');
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupStorage();
}

module.exports = { setupStorage };