-- ============================================
-- PITTSBORO CLIP JOINT - ACTIVATE BASIC PLAN (30 DAYS)
-- Run this in the Supabase SQL Editor
-- ============================================

UPDATE profiles SET
  name = 'Aleksei Tavassoli',
  role = 'owner',
  business_name = 'Pittsboro Clip Joint',
  subscription_plan = 'basic',
  subscription_status = 'active',
  subscription_start_date = NOW(),
  next_billing_date = NOW() + INTERVAL '30 days',
  max_licenses = 2,
  license_count = 0
WHERE id = 'aa33723b-c8a3-42da-a953-29b96464eb2f';

-- Verify
SELECT id, name, email, role, subscription_plan, subscription_status, next_billing_date, max_licenses
FROM profiles
WHERE id = 'aa33723b-c8a3-42da-a953-29b96464eb2f';
