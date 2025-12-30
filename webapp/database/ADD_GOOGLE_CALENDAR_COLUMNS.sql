-- Add Google Calendar integration columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMPTZ;

-- Add column to bookings table to store the calendar event ID
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar ON profiles(google_calendar_connected) WHERE google_calendar_connected = true;
