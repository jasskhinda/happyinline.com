-- Add hiring feature fields to shops table
-- Run this in Supabase SQL Editor

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_hiring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS careers_form_url TEXT,
ADD COLUMN IF NOT EXISTS hiring_title TEXT DEFAULT 'JOIN OUR TEAM!',
ADD COLUMN IF NOT EXISTS hiring_subtitle TEXT DEFAULT 'Schedule your Zoom or In Person Interview here',
ADD COLUMN IF NOT EXISTS hiring_tagline TEXT DEFAULT 'Your New Career, STARTS HERE!';

-- Create index for faster lookups of shops that are hiring
CREATE INDEX IF NOT EXISTS idx_shops_is_hiring ON shops(is_hiring) WHERE is_hiring = true;
