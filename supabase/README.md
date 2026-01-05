# Supabase Setup

## Database Testing

### Quick Verification

Run this to verify database is set up correctly:

```bash
# In Supabase SQL Editor, run:
supabase/quick-verify.sql
```

**Expected results:**
- ✅ ~40 tables created
- ✅ ~20 enums created
- ✅ RLS enabled on all tables
- ✅ Sample queries run without errors

### Comprehensive Verification (Recommended)

Run full verification without requiring authentication:

```bash
# In Supabase SQL Editor, run:
supabase/test-database-simple.sql
```

**This will:**
1. ✅ Verify all tables exist (with column counts)
2. ✅ Verify all enums exist (with values)
3. ✅ Verify RLS is enabled on all tables
4. ✅ Count RLS policies (~80 expected)
5. ✅ Verify helper functions exist
6. ✅ Verify indexes created
7. ✅ Verify triggers exist
8. ✅ Verify foreign key relationships
9. ✅ Check table dependencies
10. ✅ Display summary report

### Full Test Suite (With Sample Data)

**Note:** Requires authentication setup first.

```bash
# In Supabase SQL Editor, run:
supabase/test-database.sql
```

This creates sample data but needs auth users to exist first.

### What to Look For

**Success indicators:**
- All queries complete without errors
- Test data is created (1 org, 1 session, 2 groups, etc.)
- Relationships work (activities have tags, etc.)
- No constraint violations

**Common issues:**
- ❌ Foreign key errors → Check table creation order
- ❌ RLS errors → Verify helper functions exist
- ❌ Null constraint errors → Check NOT NULL columns

---

## Migrations

Full database schema is in `docs/DATABASE.md`.

To recreate database:

1. Copy entire schema from `docs/DATABASE.md`
2. Run in Supabase SQL Editor in this order:
   - Extensions
   - Enums
   - Core tables
   - Resource tables
   - Scheduling tables
   - Support tables
   - Triggers
   - RLS policies
   - Indexes

---

## Next Steps

After database verification:

1. ✅ Database tested → Proceed to authentication setup
2. ❌ Errors found → Check error messages and fix schema
3. 🔄 Need to reset → Drop all tables and re-run migrations

---

## Useful Queries

### List all tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Count records in all tables
```sql
SELECT
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM "public"."' || tablename || '"') as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check RLS policies
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
