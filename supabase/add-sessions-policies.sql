-- Add RLS policies for sessions table

-- Drop existing policies if any
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;

-- Allow authenticated users to SELECT sessions (filtered by app layer to current org)
CREATE POLICY "sessions_select_policy"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to INSERT sessions
CREATE POLICY "sessions_insert_policy"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE sessions
CREATE POLICY "sessions_update_policy"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY cmd, policyname;
