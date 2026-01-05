-- Simplified Database Testing (No Auth Required)
-- Run this to verify database structure without creating test data

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
  STRING_AGG(e.enumlabel::text, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
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
-- 4. COUNT RLS POLICIES
-- ============================================

SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Most tables should have 2 policies (SELECT + ALL)

-- ============================================
-- 5. VERIFY HELPER FUNCTIONS EXIST
-- ============================================

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('user_has_org_access', 'user_org_role', 'update_updated_at_column')
ORDER BY routine_name;

-- Expected: 3 functions

-- ============================================
-- 6. VERIFY INDEXES
-- ============================================

SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected: Most tables have 2-5 indexes

-- ============================================
-- 7. VERIFY TRIGGERS
-- ============================================

SELECT
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Expected: ~20 tables with update_updated_at trigger

-- ============================================
-- 8. VERIFY FOREIGN KEYS
-- ============================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: 100+ foreign key relationships

-- ============================================
-- 9. CHECK TABLE DEPENDENCIES (ORDER)
-- ============================================

-- Tables with no dependencies (can be created first)
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.table_name
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  )
ORDER BY t.table_name;

-- ============================================
-- 10. SUMMARY REPORT
-- ============================================

DO $$
DECLARE
  table_count INT;
  enum_count INT;
  rls_count INT;
  policy_count INT;
  function_count INT;
  index_count INT;
  trigger_count INT;
  fk_count INT;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- Count enums
  SELECT COUNT(DISTINCT typname) INTO enum_count
  FROM pg_type
  WHERE typtype = 'e';

  -- Count RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('user_has_org_access', 'user_org_role', 'update_updated_at_column');

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';

  -- Count foreign keys
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 DATABASE VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:        %', table_count;
  RAISE NOTICE 'Enums Created:         %', enum_count;
  RAISE NOTICE 'RLS Enabled:           %', rls_count;
  RAISE NOTICE 'Policies Created:      %', policy_count;
  RAISE NOTICE 'Helper Functions:      %', function_count;
  RAISE NOTICE 'Indexes Created:       %', index_count;
  RAISE NOTICE 'Triggers Created:      %', trigger_count;
  RAISE NOTICE 'Foreign Keys:          %', fk_count;
  RAISE NOTICE '';

  IF table_count >= 35 AND enum_count >= 15 AND rls_count = table_count THEN
    RAISE NOTICE '✅ DATABASE SETUP SUCCESSFUL!';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected values:';
    RAISE NOTICE '  Tables: ~40 (got %)', table_count;
    RAISE NOTICE '  Enums: ~20 (got %)', enum_count;
    RAISE NOTICE '  RLS: All tables (got %/%)', rls_count, table_count;
    RAISE NOTICE '  Policies: ~80 (got %)', policy_count;
    RAISE NOTICE '  Functions: 3 (got %)', function_count;
    RAISE NOTICE '  Indexes: ~50 (got %)', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready to proceed with authentication setup!';
  ELSE
    RAISE NOTICE '⚠️  VERIFICATION ISSUES DETECTED';
    RAISE NOTICE '';
    IF table_count < 35 THEN
      RAISE NOTICE '❌ Missing tables (expected ~40, got %)', table_count;
    END IF;
    IF enum_count < 15 THEN
      RAISE NOTICE '❌ Missing enums (expected ~20, got %)', enum_count;
    END IF;
    IF rls_count != table_count THEN
      RAISE NOTICE '❌ RLS not enabled on all tables (% / %)', rls_count, table_count;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
