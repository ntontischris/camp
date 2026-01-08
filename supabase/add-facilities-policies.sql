-- Add RLS policies for facilities table

-- Drop existing policies if any
DROP POLICY IF EXISTS "facilities_select_policy" ON facilities;
DROP POLICY IF EXISTS "facilities_insert_policy" ON facilities;
DROP POLICY IF EXISTS "facilities_update_policy" ON facilities;

-- Allow authenticated users to SELECT facilities (filtered by app layer to current org)
CREATE POLICY "facilities_select_policy"
  ON facilities FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to INSERT facilities
CREATE POLICY "facilities_insert_policy"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE facilities
CREATE POLICY "facilities_update_policy"
  ON facilities FOR UPDATE
  TO authenticated
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'facilities'
ORDER BY cmd, policyname;
