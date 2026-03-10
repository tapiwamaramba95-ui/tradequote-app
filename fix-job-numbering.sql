-- =====================================================
-- FIX JOB NUMBERING FORMAT
-- Update trigger to match invoice/quote format:
-- - No hyphen
-- - 5-digit padding (J00001, J00002, etc.)
-- - Reads from business_settings
-- =====================================================

CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
  last_job_number TEXT;
BEGIN
  -- Only set if job_number is null
  IF NEW.job_number IS NULL THEN
    -- Get prefix from business_settings or use default
    SELECT COALESCE(job_prefix, 'J') INTO prefix
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- If no prefix found, use default
    IF prefix IS NULL THEN
      prefix := 'J';
    END IF;
    
    -- Get settings for start number
    SELECT COALESCE(job_start_number, 1) INTO next_number
    FROM business_settings
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    IF next_number IS NULL THEN
      next_number := 1;
    END IF;
    
    -- Get the last job number with this prefix to determine next number
    SELECT job_number INTO last_job_number
    FROM jobs
    WHERE user_id = NEW.user_id
      AND job_number ~ ('^' || prefix || '\d+$')
    ORDER BY job_number DESC
    LIMIT 1;
    
    -- If we found a previous job, extract the number and increment
    IF last_job_number IS NOT NULL THEN
      next_number := SUBSTRING(last_job_number FROM (length(prefix) + 1))::INTEGER + 1;
    END IF;
    
    -- Set the job number with 5-digit padding (matches invoice format)
    NEW.job_number := prefix || LPAD(next_number::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing job with wrong format (JOB-0001 -> J00003)
-- This finds any job with the old format and updates it
UPDATE jobs 
SET job_number = (
  SELECT 
    COALESCE(bs.job_prefix, 'J') || 
    LPAD(
      (
        -- Get the highest existing number
        SELECT COALESCE(MAX(
          SUBSTRING(j2.job_number FROM (length(COALESCE(bs.job_prefix, 'J')) + 1))::INTEGER
        ), 0) + 1
        FROM jobs j2
        WHERE j2.user_id = jobs.user_id
          AND j2.id != jobs.id
          AND j2.job_number ~ ('^' || COALESCE(bs.job_prefix, 'J') || '\d+$')
      )::TEXT, 
      5, 
      '0'
    )
  FROM business_settings bs
  WHERE bs.user_id = jobs.user_id
)
WHERE job_number LIKE '%-%'; -- Only update jobs with old hyphenated format
