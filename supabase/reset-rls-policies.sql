-- COMPLETE RLS RESET for organizations, organization_members, and users
-- Run this to fix all RLS policies from scratch

-- =============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (clean slate)
-- =============================================================================

-- Drop all policies on organizations
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organizations';
    END LOOP;
END $$;

-- Drop all policies on organization_members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organization_members';
    END LOOP;
END $$;

-- Drop all policies on users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: CREATE NEW POLICIES
-- =============================================================================

-- ===== ORGANIZATIONS =====

-- Allow authenticated users to INSERT (create) organizations
CREATE POLICY "organizations_insert_policy"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to SELECT organizations they are members of
CREATE POLICY "organizations_select_policy"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.is_active = true
    )
  );

-- Allow owners/admins to UPDATE organizations
CREATE POLICY "organizations_update_policy"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.is_active = true
    )
  );

-- ===== ORGANIZATION_MEMBERS =====

-- Allow authenticated users to INSERT themselves as members
CREATE POLICY "organization_members_insert_policy"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to SELECT members of organizations they belong to
CREATE POLICY "organization_members_select_policy"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- Allow owners/admins to UPDATE members
CREATE POLICY "organization_members_update_policy"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.is_active = true
    )
  );

-- ===== USERS =====

-- Allow authenticated users to INSERT their own record
CREATE POLICY "users_insert_policy"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to SELECT their own record
CREATE POLICY "users_select_policy"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to UPDATE their own record
CREATE POLICY "users_update_policy"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================================================
-- STEP 3: VERIFY POLICIES WERE CREATED
-- =============================================================================

SELECT
  'VERIFICATION RESULTS' AS section,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, cmd, policyname;
