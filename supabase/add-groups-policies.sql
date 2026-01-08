-- Add RLS policies for groups table

-- Drop existing policies if any
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;

-- Allow authenticated users to SELECT groups (filtered by app layer through session)
CREATE POLICY "groups_select_policy"
  ON groups FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to INSERT groups
CREATE POLICY "groups_insert_policy"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE groups
CREATE POLICY "groups_update_policy"
  ON groups FOR UPDATE
  TO authenticated
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;
