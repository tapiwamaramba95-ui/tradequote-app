# Logo Storage Setup Instructions

## Quick Setup via Supabase Dashboard (Recommended)

1. **Go to your Supabase dashboard** → Storage
2. **Click "Create Bucket"**
3. **Bucket Name**: `company-logos`
4. **Settings**:
   - ✅ Public bucket
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`
5. **Click Create**

## Alternative: Use the API Endpoint

I've created a one-time setup endpoint that you can visit in your browser:

**Visit**: `http://localhost:3000/api/setup-storage`

This will automatically create the storage bucket with the right settings.

## Test the Logo Upload

1. Go to **Dashboard → Settings → Company**
2. You should now see a **"Choose Logo File"** button instead of the text input
3. Upload an image file (JPG, PNG, max 5MB)
4. The logo should appear on your quotes and invoices

## What Changed

- ✅ **Before**: Users had to upload logos to external hosting
- ✅ **After**: Users upload directly to your Supabase storage
- ✅ **File validation**: Only images, max 5MB
- ✅ **Auto preview**: Shows current logo with remove option
- ✅ **Clean URLs**: No more broken external links

The new system is much more user-friendly and reliable!