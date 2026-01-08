-- Verify RLS status and policies

-- 1. Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_members', 'users')
  AND schemaname = 'public';

-- 2. Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, cmd, policyname;

-- 3. Test current user
SELECT
  auth.uid() AS current_user_id,
  auth.role() AS current_role;
