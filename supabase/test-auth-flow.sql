-- Test the complete authentication and organization creation flow
-- This simulates what happens when a user signs up and creates an org

-- First, let's check the current user
SELECT
  'Current authenticated user' AS test,
  auth.uid() AS user_id,
  auth.role() AS role;

-- Check if we can see any organizations (should be empty or show only user's orgs)
SELECT
  'Organizations visible' AS test,
  COUNT(*) AS count
FROM organizations;

-- Check if we can see organization_members
SELECT
  'Organization members visible' AS test,
  COUNT(*) AS count
FROM organization_members;

-- Check policies on organizations table
SELECT
  'Policies on organizations' AS test,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY cmd;

-- Check policies on organization_members table
SELECT
  'Policies on organization_members' AS test,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY cmd;

-- Check policies on users table
SELECT
  'Policies on users' AS test,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;
