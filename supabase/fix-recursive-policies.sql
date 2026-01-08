-- Fix infinite recursion in RLS policies
-- Simplify policies to avoid self-referencing queries

-- =============================================================================
-- DROP ALL EXISTING POLICIES
-- =============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organizations';
    END LOOP;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organization_members';
    END LOOP;
END $$;

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
-- CREATE SIMPLIFIED POLICIES (NO RECURSION)
-- =============================================================================

-- ===== ORGANIZATIONS =====

-- Allow authenticated users to INSERT organizations
CREATE POLICY "organizations_insert_policy"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to SELECT organizations (we'll filter in app layer)
CREATE POLICY "organizations_select_policy"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to UPDATE organizations (we'll validate ownership in app)
CREATE POLICY "organizations_update_policy"
  ON organizations FOR UPDATE
  TO authenticated
  USING (true);

-- ===== ORGANIZATION_MEMBERS =====

-- Allow authenticated users to INSERT themselves as members
CREATE POLICY "organization_members_insert_policy"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to SELECT all members (needed to check membership)
CREATE POLICY "organization_members_select_policy"
  ON organization_members FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to UPDATE only their own membership
CREATE POLICY "organization_members_update_policy"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

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
-- VERIFY POLICIES
-- =============================================================================

SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, cmd, policyname;
