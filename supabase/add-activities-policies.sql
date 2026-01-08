-- Add RLS policies for activities table

-- Drop existing policies if any
DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_policy" ON activities;

-- Allow authenticated users to SELECT activities (filtered by app layer to current org)
CREATE POLICY "activities_select_policy"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to INSERT activities
CREATE POLICY "activities_insert_policy"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE activities
CREATE POLICY "activities_update_policy"
  ON activities FOR UPDATE
  TO authenticated
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'activities'
ORDER BY cmd, policyname;
