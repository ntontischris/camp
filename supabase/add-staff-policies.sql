-- Add RLS policies for staff table

-- Drop existing policies if any
DROP POLICY IF EXISTS "staff_select_policy" ON staff;
DROP POLICY IF EXISTS "staff_insert_policy" ON staff;
DROP POLICY IF EXISTS "staff_update_policy" ON staff;

-- Allow authenticated users to SELECT staff (filtered by app layer to current org)
CREATE POLICY "staff_select_policy"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to INSERT staff
CREATE POLICY "staff_insert_policy"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE staff
CREATE POLICY "staff_update_policy"
  ON staff FOR UPDATE
  TO authenticated
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY cmd, policyname;
