-- Database Testing & Verification Script
-- Run this to verify everything works correctly

-- ============================================
-- 1. VERIFY ALL TABLES EXIST
-- ============================================

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: ~40 tables

-- ============================================
-- 2. VERIFY ALL ENUMS EXIST
-- ============================================

SELECT
  t.typname as enum_name,
  COUNT(e.enumlabel) as value_count
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%_%'
GROUP BY t.typname
ORDER BY t.typname;

-- Expected: ~20 enums

-- ============================================
-- 3. VERIFY RLS IS ENABLED
-- ============================================

SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All should have rls_enabled = true

-- ============================================
-- 4. VERIFY HELPER FUNCTIONS EXIST
-- ============================================

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('user_has_org_access', 'user_org_role', 'update_updated_at_column')
ORDER BY routine_name;

-- Expected: 3 functions

-- ============================================
-- 5. VERIFY INDEXES
-- ============================================

SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- Expected: 50+ indexes

-- ============================================
-- 6. CREATE TEST DATA
-- ============================================

-- Create a test user (you'll need to do this via Supabase Auth UI first)
-- For now, we'll simulate with a UUID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  test_org_id UUID;
  test_session_id UUID;
  test_group_id UUID;
  test_activity_id UUID;
  test_facility_id UUID;
  test_staff_id UUID;
  test_tag_intensity_id UUID;
  test_tag_type_id UUID;
BEGIN
  -- Insert test organization
  INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
  VALUES (
    uuid_generate_v4(),
    'Test Camp Organization',
    'test-camp',
    'pro',
    'active'
  )
  RETURNING id INTO test_org_id;

  RAISE NOTICE 'Created organization: %', test_org_id;

  -- Insert test organization member
  INSERT INTO users (id, email, full_name)
  VALUES (test_user_id, 'test@example.com', 'Test User')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO organization_members (organization_id, user_id, role, is_active, accepted_at)
  VALUES (test_org_id, test_user_id, 'owner', true, NOW());

  RAISE NOTICE 'Added user as owner';

  -- Create test tags
  INSERT INTO tags (organization_id, name, slug, category, color, is_system)
  VALUES
    (test_org_id, 'Έντονη', 'entoni', 'intensity', '#ef4444', true),
    (test_org_id, 'Ήπια', 'ipia', 'intensity', '#10b981', true),
    (test_org_id, 'Αθλητική', 'athlitiki', 'type', '#3b82f6', true),
    (test_org_id, 'Δημιουργική', 'dimioyrgiki', 'type', '#8b5cf6', true)
  RETURNING id INTO test_tag_intensity_id;

  SELECT id INTO test_tag_type_id FROM tags WHERE organization_id = test_org_id AND slug = 'athlitiki';

  RAISE NOTICE 'Created tags';

  -- Create test session
  INSERT INTO sessions (organization_id, name, start_date, end_date, status, created_by)
  VALUES (
    test_org_id,
    'Summer Camp 2025',
    '2025-07-01',
    '2025-07-15',
    'planning',
    test_user_id
  )
  RETURNING id INTO test_session_id;

  RAISE NOTICE 'Created session: %', test_session_id;

  -- Create test groups
  INSERT INTO groups (session_id, name, code, color, icon, age_min, age_max, capacity)
  VALUES
    (test_session_id, 'Eagles', 'EAGL', '#3b82f6', '🦅', 8, 10, 20),
    (test_session_id, 'Wolves', 'WOLV', '#ef4444', '🐺', 11, 13, 20)
  RETURNING id INTO test_group_id;

  RAISE NOTICE 'Created groups';

  -- Create test facility
  INSERT INTO facilities (organization_id, name, code, capacity, indoor, is_active)
  VALUES (test_org_id, 'Swimming Pool', 'POOL', 30, false, true)
  RETURNING id INTO test_facility_id;

  RAISE NOTICE 'Created facility: %', test_facility_id;

  -- Create test activities
  INSERT INTO activities (
    organization_id,
    name,
    code,
    duration_minutes,
    min_participants,
    max_participants,
    required_staff_count,
    is_active
  )
  VALUES (
    test_org_id,
    'Swimming',
    'SWIM',
    45,
    8,
    20,
    2,
    true
  )
  RETURNING id INTO test_activity_id;

  -- Link activity to tags
  INSERT INTO activity_tags (activity_id, tag_id)
  VALUES
    (test_activity_id, test_tag_intensity_id),
    (test_activity_id, test_tag_type_id);

  RAISE NOTICE 'Created activity: %', test_activity_id;

  -- Create test staff
  INSERT INTO staff (
    organization_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    is_active
  )
  VALUES (
    test_org_id,
    'S001',
    'John',
    'Doe',
    'john@example.com',
    'instructor',
    true
  )
  RETURNING id INTO test_staff_id;

  RAISE NOTICE 'Created staff: %', test_staff_id;

  -- Create day template
  DECLARE
    template_id UUID;
    slot1_id UUID;
  BEGIN
    INSERT INTO day_templates (organization_id, name, is_default, is_active)
    VALUES (test_org_id, 'Normal Day', true, true)
    RETURNING id INTO template_id;

    INSERT INTO day_template_slots (
      day_template_id,
      name,
      start_time,
      end_time,
      slot_type,
      is_schedulable,
      sort_order
    )
    VALUES
      (template_id, 'Activity 1', '09:00', '09:45', 'activity', true, 1),
      (template_id, 'Activity 2', '09:50', '10:35', 'activity', true, 2),
      (template_id, 'Break', '10:35', '11:00', 'break', false, 3),
      (template_id, 'Activity 3', '11:00', '11:45', 'activity', true, 4)
    RETURNING id INTO slot1_id;

    RAISE NOTICE 'Created day template with % slots', 4;
  END;

  RAISE NOTICE '✅ Test data created successfully!';
  RAISE NOTICE 'Organization ID: %', test_org_id;
  RAISE NOTICE 'Session ID: %', test_session_id;
END $$;

-- ============================================
-- 7. VERIFY TEST DATA
-- ============================================

-- Count records in each table
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'organization_members', COUNT(*) FROM organization_members
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'facilities', COUNT(*) FROM facilities
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'day_templates', COUNT(*) FROM day_templates
UNION ALL
SELECT 'day_template_slots', COUNT(*) FROM day_template_slots;

-- ============================================
-- 8. TEST QUERIES
-- ============================================

-- Get organization with members
SELECT
  o.name as org_name,
  o.subscription_tier,
  COUNT(om.id) as member_count
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
GROUP BY o.id, o.name, o.subscription_tier;

-- Get session with groups
SELECT
  s.name as session_name,
  s.status,
  COUNT(g.id) as group_count
FROM sessions s
LEFT JOIN groups g ON s.id = g.session_id
GROUP BY s.id, s.name, s.status;

-- Get activities with tags
SELECT
  a.name as activity_name,
  a.duration_minutes,
  STRING_AGG(t.name, ', ') as tags
FROM activities a
LEFT JOIN activity_tags at ON a.id = at.activity_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, a.name, a.duration_minutes;

-- Get day template with slots
SELECT
  dt.name as template_name,
  dts.name as slot_name,
  dts.start_time,
  dts.end_time,
  dts.slot_type
FROM day_templates dt
JOIN day_template_slots dts ON dt.id = dts.day_template_id
ORDER BY dts.sort_order;

-- ============================================
-- 9. TEST RELATIONSHIPS
-- ============================================

-- Verify foreign keys work
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: 100+ foreign key relationships

-- ============================================
-- 10. SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the query results above';
  RAISE NOTICE '2. Verify all tables exist';
  RAISE NOTICE '3. Verify test data was created';
  RAISE NOTICE '4. Ready to proceed with authentication';
  RAISE NOTICE '';
END $$;
