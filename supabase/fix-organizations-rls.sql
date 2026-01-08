-- Fix RLS policies for organizations and organization_members tables
-- Allow authenticated users to create organizations and become members

-- ===== ORGANIZATIONS =====
-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create INSERT policy for organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ===== ORGANIZATION_MEMBERS =====
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
DROP POLICY IF EXISTS "Owners/admins can manage members" ON organization_members;

-- Users can view members of orgs they belong to
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  USING (
    user_has_org_access(organization_id)
  );

-- Users can insert themselves as members (for onboarding)
CREATE POLICY "Users can insert themselves as members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners/admins can manage members (invite, remove, change roles)
CREATE POLICY "Owners/admins can manage members"
  ON organization_members FOR ALL
  USING (user_org_role(organization_id) IN ('owner', 'admin'));

-- ===== USERS TABLE =====
-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

-- Users can insert their own user record
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, cmd, policyname;
