-- Quick Database Verification
-- Run this for a fast check that everything is set up correctly

-- 1. Count all tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- Expected: ~40

-- 2. Count all enums
SELECT COUNT(DISTINCT typname) as total_enums
FROM pg_type
WHERE typname LIKE '%_%'
  AND typtype = 'e';
-- Expected: ~20

-- 3. Check RLS is enabled
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = true) as rls_enabled_count,
  COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';
-- Both should be ~40

-- 4. List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 5. Sample query (should return empty but not error)
SELECT * FROM organizations LIMIT 1;
SELECT * FROM sessions LIMIT 1;
SELECT * FROM activities LIMIT 1;

-- ✅ If all queries run without errors, database is ready!
