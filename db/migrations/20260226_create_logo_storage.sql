-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for company logos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload logos to their own folder
CREATE POLICY "Users can upload logos to their own folder" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'company-logos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own logos
CREATE POLICY "Users can update their own logos" ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'company-logos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'company-logos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);