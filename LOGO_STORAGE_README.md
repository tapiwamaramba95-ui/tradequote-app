# Logo Storage Setup

This update replaces the old "Logo URL" text input with a proper file upload system using Supabase Storage.

## Setup Instructions

### Option 1: SQL Migration (Recommended)
Run the SQL migration in your Supabase SQL editor:
```bash
db/migrations/20260226_create_logo_storage.sql
```

### Option 2: JavaScript Setup
If you prefer to set up via JavaScript:

1. Add your Supabase service role key to your environment variables:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Run the setup script:
```bash
node scripts/setup-storage.js
```

## Features

✅ **File Upload**: Users can now upload image files directly  
✅ **File Validation**: Checks file type (images only) and size (max 5MB)  
✅ **Preview**: Shows current logo with remove option  
✅ **Auto-cleanup**: Removes old logos when new ones are uploaded  
✅ **Secure**: Users can only manage their own logos  

## Storage Structure

Logos are stored in the `company-logos` bucket with the following structure:
```
company-logos/
├── user-id-1/
│   └── logo-timestamp.jpg
├── user-id-2/
│   └── logo-timestamp.png
```

Each user gets their own folder identified by their user ID.

## Migration Notes

- Existing external logo URLs will continue to work
- When users upload a new logo, it will replace any existing logo (including external URLs)
- The old "Logo URL" input has been completely replaced