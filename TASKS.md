# Current Tasks

Active development tasks for CampWise. Update daily.

---

## Status Legend

- ⬜ Not Started
- 🟦 In Progress
- ✅ Done
- ⏸️ Blocked
- ❌ Cancelled

---

## Current Sprint: Phase 1, Week 1

**Sprint Goal:** Project setup and database foundation

**Dates:** [Start Date] - [End Date]

---

## Today's Tasks

**Priority:**

1. ⬜ Initialize Next.js 15 project with TypeScript
2. ⬜ Configure TailwindCSS and shadcn/ui
3. ⬜ Set up Supabase project (staging)
4. ⬜ Configure environment variables

**Notes:**
- Use pnpm as package manager
- Enable strict TypeScript mode
- Install shadcn/ui base components

---

## Week 1 Tasks

### Environment Setup

- ⬜ Initialize Next.js 15 project with App Router
  - ⬜ TypeScript configuration
  - ⬜ ESLint + Prettier setup
  - ⬜ Git repository initialization

- ⬜ Configure TailwindCSS
  - ⬜ Install and configure
  - ⬜ Set up custom colors
  - ⬜ Configure font families

- ⬜ Install shadcn/ui components
  - ⬜ Initialize shadcn/ui
  - ⬜ Install base components (Button, Input, Card, Dialog)
  - ⬜ Customize theme

- ⬜ Set up Supabase
  - ⬜ Create Supabase project (staging)
  - ⬜ Create Supabase project (production)
  - ⬜ Install Supabase client library
  - ⬜ Configure environment variables

- ⬜ Project structure
  - ⬜ Create directory structure (see ARCHITECTURE.md)
  - ⬜ Set up path aliases (@/components, @/lib, etc.)

### Database Setup

- ⬜ Database schema
  - ⬜ Create migration file (001_initial_schema.sql)
  - ⬜ Run migration locally
  - ⬜ Verify all tables created
  - ⬜ Verify indexes created

- ⬜ RLS policies
  - ⬜ Enable RLS on all tables
  - ⬜ Create helper functions
  - ⬜ Implement policies for each table
  - ⬜ Test RLS with multiple users

- ⬜ TypeScript types
  - ⬜ Generate types from Supabase: `supabase gen types typescript`
  - ⬜ Save to `src/lib/types/database.ts`
  - ⬜ Create custom types in `src/types/`

- ⬜ Seed data
  - ⬜ Create seed script
  - ⬜ Add sample organization
  - ⬜ Add sample users
  - ⬜ Add sample activities, facilities, staff
  - ⬜ Run seed script

---

## Week 2 Tasks

### Authentication

- ⬜ Supabase Auth setup
  - ⬜ Configure auth providers (email)
  - ⬜ Set up auth middleware
  - ⬜ Create auth client helpers

- ⬜ Sign up flow
  - ⬜ Create signup page UI
  - ⬜ Form validation with Zod
  - ⬜ Connect to Supabase Auth
  - ⬜ Email verification flow
  - ⬜ Redirect to onboarding

- ⬜ Login flow
  - ⬜ Create login page UI
  - ⬜ Form validation
  - ⬜ Connect to Supabase Auth
  - ⬜ Remember me functionality
  - ⬜ Redirect to dashboard

- ⬜ Password reset
  - ⬜ Forgot password page
  - ⬜ Reset password page
  - ⬜ Email flow

- ⬜ Protected routes
  - ⬜ Implement middleware
  - ⬜ Check auth on protected routes
  - ⬜ Redirect to login if not authenticated

- ⬜ User profile
  - ⬜ Profile page UI
  - ⬜ Update profile form
  - ⬜ Avatar upload

### Organization Management

- ⬜ Organization creation
  - ⬜ Onboarding flow UI
  - ⬜ Organization form
  - ⬜ Create organization API
  - ⬜ Add user as owner

- ⬜ Organization settings
  - ⬜ Settings page layout
  - ⬜ General settings tab
  - ⬜ Team tab
  - ⬜ Subscription tab (placeholder)
  - ⬜ Update organization API

- ⬜ Team management
  - ⬜ Team member list UI
  - ⬜ Invite member modal
  - ⬜ Send invitation email
  - ⬜ Accept invitation flow
  - ⬜ Remove member
  - ⬜ Change role

- ⬜ Permissions system
  - ⬜ Create usePermissions hook
  - ⬜ Implement permission checks in UI
  - ⬜ Implement permission checks in API

- ⬜ Organization switcher
  - ⬜ Org switcher component
  - ⬜ List user's organizations
  - ⬜ Switch between orgs
  - ⬜ Remember last used org

---

## Backlog

### Phase 2: Core Entities (Weeks 3-4)

**Sessions:**
- ⬜ Session list page
- ⬜ Session creation form
- ⬜ Session detail page
- ⬜ Session CRUD operations
- ⬜ Status workflow

**Groups:**
- ⬜ Group list/grid view
- ⬜ Group creation form
- ⬜ Group detail page
- ⬜ Group tags management
- ⬜ Group CRUD operations

**Activities:**
- ⬜ Activity library view (grid + table)
- ⬜ Activity creation form
- ⬜ Activity detail page
- ⬜ Facility requirements
- ⬜ Activity tags
- ⬜ Weather dependency settings
- ⬜ Activity CRUD operations

**Facilities:**
- ⬜ Facility list view
- ⬜ Facility creation form
- ⬜ Facility detail page
- ⬜ Availability settings
- ⬜ Facility CRUD operations

**Staff:**
- ⬜ Staff directory
- ⬜ Staff creation form
- ⬜ Staff detail page
- ⬜ Activity preferences
- ⬜ Availability settings
- ⬜ Staff CRUD operations

**Day Templates:**
- ⬜ Template list view
- ⬜ Template creation/edit
- ⬜ Slot management
- ⬜ Visual timeline editor
- ⬜ Set default template

**Manual Scheduling:**
- ⬜ Calendar week view layout
- ⬜ Render schedule slots
- ⬜ Navigation (prev/next week)
- ⬜ Manual slot creation
- ⬜ Edit slot modal
- ⬜ Delete slot
- ⬜ Drag & drop implementation
- ⬜ Bulk operations

### Phase 3: Intelligent Scheduling (Weeks 5-6)

**Constraints:**
- ⬜ Constraint list view
- ⬜ Constraint builder wizard
- ⬜ Constraint templates
- ⬜ Constraint CRUD operations

**Activity Requirements:**
- ⬜ Requirements list view
- ⬜ Requirement creation form
- ⬜ Bulk creation

**Auto-Generation:**
- ⬜ Feasibility check logic
- ⬜ Feasibility check UI
- ⬜ OR-Tools Python function
- ⬜ Constraint evaluation
- ⬜ Solution scoring
- ⬜ Generation wizard
- ⬜ Progress tracking
- ⬜ Results preview
- ⬜ Apply generation

**Conflict Detection:**
- ⬜ Real-time conflict checking
- ⬜ Conflict indicators
- ⬜ Conflict resolution suggestions

### Phase 4: Polish & Launch (Weeks 7-8)

**Staff Assignment:**
- ⬜ Auto-assign staff logic
- ⬜ Manual staff assignment
- ⬜ Staff workload view
- ⬜ Staff confirmation workflow

**Additional Views:**
- ⬜ Calendar day view
- ⬜ Calendar group view
- ⬜ Calendar facility view
- ⬜ Calendar staff view

**Weather:**
- ⬜ Manual weather entry
- ⬜ Weather substitution logic
- ⬜ Substitution suggestions
- ⬜ Apply substitutions

**Export:**
- ⬜ PDF generation (master schedule)
- ⬜ PDF generation (group schedule)
- ⬜ PDF generation (daily schedule)
- ⬜ Excel export
- ⬜ Print styles

**Notifications:**
- ⬜ Notification system
- ⬜ Notification dropdown
- ⬜ Mark as read
- ⬜ Notification triggers

**Testing & Polish:**
- ⬜ E2E tests for critical flows
- ⬜ Bug fixes
- ⬜ Performance optimization
- ⬜ Mobile responsive testing
- ⬜ Accessibility audit

---

## Blocked Items

_None currently_

---

## Technical Debt

_Track technical debt here for future cleanup_

---

## Notes

### Development Setup Checklist

Before starting development:
- [ ] Read all documentation files
- [ ] Review tech stack
- [ ] Understand database schema
- [ ] Understand constraint system
- [ ] Review UI specs

### Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add TODO comments for future work
- Update TASKS.md daily

### Testing Strategy

- Unit tests: Utility functions, constraint evaluators
- Integration tests: API routes, database operations
- E2E tests: Critical user flows
- Manual testing: Each feature after completion

### Daily Workflow

1. Check TASKS.md
2. Pick highest priority task
3. Create feature branch
4. Develop + test
5. Commit with clear message
6. Update TASKS.md
7. Merge to develop

### Weekly Review

Every Friday:
- Review week's progress
- Update ROADMAP.md if needed
- Plan next week's tasks
- Identify blockers
- Update DECISIONS.md with any technical decisions

---

## Quick Links

- [ROADMAP.md](ROADMAP.md) - Full development plan
- [docs/DATABASE.md](docs/DATABASE.md) - Database schema
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/FEATURES.md](docs/FEATURES.md) - Feature specs
- [docs/API.md](docs/API.md) - API documentation
- [docs/UI-SPECS.md](docs/UI-SPECS.md) - UI specifications
- [DECISIONS.md](DECISIONS.md) - Technical decisions

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check

# Database
npx supabase start       # Start local Supabase
npx supabase db reset    # Reset local database
npx supabase migration new <name>  # Create migration
npx supabase db push     # Push migrations

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests

# Types
npm run generate:types   # Generate types from Supabase
```

---

_Last updated: [Current Date]_
