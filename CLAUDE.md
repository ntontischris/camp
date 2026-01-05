# CampWise

> Camp scheduling platform for Greek market. Read `PROJECT-BRIEF.md` for full specs.

## Quick Start for Claude Code

1. **First**: Read `PROJECT-BRIEF.md` completely
2. **Then**: Create all documentation files in `/docs`
3. **Then**: Start development following the roadmap

## What to Create

```
campwise/
├── CLAUDE.md           ✓ (this file)
├── PROJECT-BRIEF.md    ✓ (specs file)
├── ROADMAP.md          ← Create this
├── TASKS.md            ← Create this
├── DECISIONS.md        ← Create this
├── docs/
│   ├── DATABASE.md     ← Create with full SQL
│   ├── FEATURES.md     ← Create this
│   ├── ARCHITECTURE.md ← Create this
│   ├── CONSTRAINTS.md  ← Create this
│   ├── API.md          ← Create this
│   └── UI-SPECS.md     ← Create this
└── src/                ← Then start coding
```

## Tech Stack
- Next.js 15 (App Router)
- Supabase (PostgreSQL + Auth)
- TailwindCSS + shadcn/ui
- Google OR-Tools (scheduling)

## Commands
```bash
npm run dev          # Development
npx supabase start   # Local DB
```

## Rules
- TypeScript everywhere
- Soft deletes only (deleted_at)
- RLS on all tables
- Greek UI (DD/MM/YYYY, Monday start)