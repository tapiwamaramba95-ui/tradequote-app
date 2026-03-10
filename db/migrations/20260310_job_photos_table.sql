-- Job Photos Table for Cloudinary Integration
-- Created: 2026-03-10
-- Purpose: Store job photos uploaded to Cloudinary with metadata and categorization

-- Job Photos Table
CREATE TABLE job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Cloudinary data
  photo_url text NOT NULL,
  public_id text NOT NULL,
  
  -- Metadata
  file_name text,
  file_size integer,
  width integer,
  height integer,
  
  -- Photo type
  photo_type varchar(20) DEFAULT 'during', -- 'before', 'during', 'after', 'other'
  description text,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  -- Constraints
  UNIQUE(public_id)
);

-- Indexes for performance
CREATE INDEX idx_job_photos_job ON job_photos(job_id, created_at DESC);
CREATE INDEX idx_job_photos_user ON job_photos(user_id, created_at DESC);
CREATE INDEX idx_job_photos_type ON job_photos(job_id, photo_type);

-- Enable Row Level Security
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own job photos"
  ON job_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload job photos"
  ON job_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job photos"
  ON job_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job photos"
  ON job_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_job_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_photos_updated_at
  BEFORE UPDATE ON job_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_job_photos_updated_at();

-- Add column to existing tables for easier queries (optional - for photo count in jobs list)
-- This will help show photo count in the jobs list without complex joins
-- Note: We'll use a computed query instead to avoid schema changes to existing tables

COMMENT ON TABLE job_photos IS 'Stores job photos uploaded to Cloudinary with metadata and categorization';
COMMENT ON COLUMN job_photos.photo_type IS 'Category: before, during, after, or other';
COMMENT ON COLUMN job_photos.public_id IS 'Cloudinary public_id for managing the asset';
COMMENT ON COLUMN job_photos.photo_url IS 'Cloudinary secure_url for displaying the image';