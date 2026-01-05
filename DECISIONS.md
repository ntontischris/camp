# Technical Decisions

Record of all significant technical decisions made during development.

**Format:** [Date] - Decision Title

---

## Template

```
### [Date] - [Decision Title]

**Context:**
What is the situation forcing this decision?

**Decision:**
What did we decide?

**Alternatives Considered:**
1. Option A - pros/cons
2. Option B - pros/cons

**Rationale:**
Why this option?

**Consequences:**
- Positive: ...
- Negative: ...
- Risks: ...

**Status:** Accepted | Rejected | Superseded
```

---

## Decisions

### 2025-01-05 - Use Next.js 15 with App Router

**Context:**
Need to choose a React framework for the frontend. Options include Next.js, Remix, or plain React with Vite.

**Decision:**
Use Next.js 15 with App Router.

**Alternatives Considered:**
1. **Next.js 15 (App Router)**
   - ✅ Server Components for better performance
   - ✅ Excellent developer experience
   - ✅ Built-in routing, API routes
   - ✅ Strong ecosystem
   - ✅ Vercel deployment optimization
   - ❌ App Router still maturing

2. **Remix**
   - ✅ Great for data loading
   - ✅ Progressive enhancement
   - ❌ Smaller ecosystem
   - ❌ Less familiar to team

3. **Vite + React Router**
   - ✅ Maximum flexibility
   - ✅ Fast dev server
   - ❌ Need to set up more infrastructure
   - ❌ No built-in SSR

**Rationale:**
- Next.js 15 App Router provides the best balance of features and DX
- Server Components will improve performance for data-heavy pages
- Easy deployment to Vercel
- Large community and ecosystem
- Well-documented

**Consequences:**
- Positive: Fast development, good performance, scalable
- Negative: Learning curve for App Router patterns
- Risks: App Router bugs (mitigated by stable release)

**Status:** Accepted

---

### 2025-01-05 - Use Supabase for Backend

**Context:**
Need to choose backend infrastructure. Options include Supabase, Firebase, or custom backend.

**Decision:**
Use Supabase (PostgreSQL + Auth + Storage).

**Alternatives Considered:**
1. **Supabase**
   - ✅ PostgreSQL (relational database we need)
   - ✅ Built-in auth
   - ✅ Row Level Security (perfect for multi-tenancy)
   - ✅ Real-time subscriptions
   - ✅ TypeScript client
   - ✅ Free tier generous
   - ❌ Less mature than Firebase

2. **Firebase**
   - ✅ Very mature
   - ✅ Real-time database
   - ❌ NoSQL (harder for our relational data)
   - ❌ Firestore security rules complex
   - ❌ Less suitable for complex queries

3. **Custom Backend (Node.js + PostgreSQL)**
   - ✅ Maximum control
   - ✅ Can optimize exactly as needed
   - ❌ Much more development time
   - ❌ Need to build auth, storage, etc.
   - ❌ More infrastructure to manage

**Rationale:**
- Our data is highly relational (groups, activities, schedules, constraints)
- RLS is perfect for multi-tenancy security
- Built-in auth saves development time
- PostgreSQL is battle-tested and performant
- Can scale to thousands of organizations

**Consequences:**
- Positive: Fast development, secure multi-tenancy, scalable
- Negative: Vendor lock-in (mitigated by PostgreSQL portability)
- Risks: Supabase service issues (mitigated by backup strategy)

**Status:** Accepted

---

### 2025-01-05 - Use Google OR-Tools for Scheduling

**Context:**
Need to choose a constraint solver for automatic schedule generation. This is the core differentiator of the product.

**Decision:**
Use Google OR-Tools (Constraint Programming Solver) via Python Edge Function.

**Alternatives Considered:**
1. **Google OR-Tools (CP-SAT)**
   - ✅ Powerful constraint programming
   - ✅ Can handle complex constraints
   - ✅ Finds optimal solutions
   - ✅ Open source, free
   - ✅ Well-documented
   - ❌ Python-based (need edge function)
   - ❌ Learning curve

2. **Custom Greedy Algorithm (JavaScript)**
   - ✅ Full control
   - ✅ Can run in Node.js directly
   - ✅ Easier to debug
   - ❌ Won't find optimal solutions
   - ❌ Hard to handle complex constraints
   - ❌ Much more development time

3. **Genetic Algorithm (JavaScript)**
   - ✅ Can handle complex problems
   - ✅ Can run in Node.js
   - ❌ No guarantees on solution quality
   - ❌ Hard to tune
   - ❌ Slower convergence

**Rationale:**
- OR-Tools is industry-standard for scheduling problems
- Constraint Programming is the right paradigm for our problem
- Can guarantee constraint satisfaction (hard constraints)
- Python edge function is acceptable overhead
- Open source means no licensing costs
- Future: could compile to WASM if Python becomes bottleneck

**Consequences:**
- Positive: Optimal schedules, handles complex constraints, scalable
- Negative: Need Python edge function, potential latency
- Risks: Python function cold starts (mitigated by keeping warm)

**Status:** Accepted

---

### 2025-01-05 - Use TailwindCSS + shadcn/ui

**Context:**
Need to choose styling solution and component library.

**Decision:**
Use TailwindCSS for styling and shadcn/ui for base components.

**Alternatives Considered:**
1. **TailwindCSS + shadcn/ui**
   - ✅ Utility-first, fast development
   - ✅ shadcn/ui components are customizable
   - ✅ Copy-paste, not dependency
   - ✅ Accessible (Radix UI primitives)
   - ✅ Modern, popular

2. **Material-UI (MUI)**
   - ✅ Complete component library
   - ✅ Very mature
   - ❌ Heavy bundle size
   - ❌ Harder to customize
   - ❌ Opinionated styling

3. **Chakra UI**
   - ✅ Good DX
   - ✅ Accessible
   - ❌ Smaller ecosystem than MUI
   - ❌ Less flexible than Tailwind

**Rationale:**
- TailwindCSS gives maximum flexibility
- shadcn/ui provides accessible, customizable base components
- No large dependency (components copied to project)
- Can customize exactly as needed
- Fast development once familiar with Tailwind

**Consequences:**
- Positive: Fast development, small bundle, fully customizable
- Negative: Need to build some components from scratch
- Risks: None significant

**Status:** Accepted

---

### 2025-01-05 - Soft Delete Strategy

**Context:**
Should we hard delete records or use soft deletes (deleted_at column)?

**Decision:**
Use soft deletes (deleted_at timestamp) for all main entities.

**Alternatives Considered:**
1. **Soft Delete (deleted_at)**
   - ✅ Can recover accidentally deleted data
   - ✅ Audit trail preserved
   - ✅ Can analyze historical data
   - ❌ Queries need to filter deleted_at IS NULL
   - ❌ Database grows larger

2. **Hard Delete**
   - ✅ Simpler queries
   - ✅ Smaller database
   - ❌ Data lost forever
   - ❌ No audit trail
   - ❌ Breaks references if not careful

3. **Archive Table**
   - ✅ Clean main tables
   - ✅ Can keep history
   - ❌ Complex queries across tables
   - ❌ More tables to manage

**Rationale:**
- Users will accidentally delete things
- Audit trail is important for camp schedules
- Can add cleanup job later if needed
- RLS policies already filter deleted_at

**Consequences:**
- Positive: Data safety, audit trail
- Negative: Need to remember to filter deleted_at
- Risks: Queries forgetting to filter (mitigated by indexes)

**Status:** Accepted

---

### 2025-01-05 - Constraint Storage Format (JSONB)

**Context:**
Constraints have dynamic scope/condition/action based on type. Should we use JSONB or separate tables?

**Decision:**
Store scope, condition, and action as JSONB columns.

**Alternatives Considered:**
1. **JSONB Columns**
   - ✅ Flexible schema per constraint type
   - ✅ Easy to add new constraint types
   - ✅ Single table, simple queries
   - ❌ Harder to enforce validation
   - ❌ Can't use foreign keys in JSON

2. **Separate Tables per Constraint Type**
   - ✅ Strong typing
   - ✅ Can use foreign keys
   - ✅ Database-level validation
   - ❌ 10+ tables for 10 constraint types
   - ❌ Complex union queries
   - ❌ Hard to add new types

3. **EAV (Entity-Attribute-Value)**
   - ✅ Very flexible
   - ❌ Query complexity nightmare
   - ❌ Poor performance

**Rationale:**
- Constraints are inherently polymorphic
- Each constraint type has different fields
- JSONB in PostgreSQL is performant and indexable
- Can validate in application layer
- Easy to extend with new constraint types

**Consequences:**
- Positive: Flexibility, easy to extend, simple schema
- Negative: Validation in application layer, no foreign keys
- Risks: Data integrity (mitigated by Zod validation)

**Status:** Accepted

---

### 2025-01-05 - State Management: Zustand + TanStack Query

**Context:**
Need to choose state management solution(s) for client-side state and server state.

**Decision:**
- **Zustand** for global client state (auth, org, UI preferences)
- **TanStack Query** for server state (data fetching, caching, mutations)

**Alternatives Considered:**
1. **Zustand + TanStack Query**
   - ✅ Clear separation of concerns
   - ✅ TanStack Query excellent for server state
   - ✅ Zustand simple for global state
   - ✅ Both lightweight
   - ✅ Great TypeScript support

2. **Redux Toolkit**
   - ✅ Very popular
   - ✅ Comprehensive
   - ❌ More boilerplate
   - ❌ Heavier
   - ❌ Overkill for our needs

3. **Context API only**
   - ✅ Built-in
   - ✅ No dependencies
   - ❌ Performance issues with frequent updates
   - ❌ No built-in caching/fetching

4. **Jotai or Recoil**
   - ✅ Atomic state
   - ✅ Good for complex state
   - ❌ Less mature than Zustand
   - ❌ More complex mental model

**Rationale:**
- Separate concerns: client state vs server state
- TanStack Query handles caching, refetching, optimistic updates
- Zustand is minimal and easy to use
- No unnecessary complexity

**Consequences:**
- Positive: Clean architecture, performant, easy to reason about
- Negative: Two libraries instead of one
- Risks: None significant

**Status:** Accepted

---

### 2025-01-05 - Calendar Library Choice

**Context:**
Need to choose calendar/scheduling UI library for the main schedule view.

**Decision:**
TBD - Evaluate during Week 4 when implementing calendar.

**Options to Consider:**
1. **FullCalendar**
   - ✅ Feature-rich
   - ✅ Drag & drop built-in
   - ✅ Multiple views
   - ❌ Heavy (200KB+)
   - ❌ Commercial license for some features

2. **react-big-calendar**
   - ✅ Lighter weight
   - ✅ Customizable
   - ✅ MIT license
   - ❌ Less features out of box
   - ❌ Need to implement drag & drop

3. **Custom Grid with dnd-kit**
   - ✅ Full control
   - ✅ Exactly what we need
   - ❌ More development time
   - ❌ Need to handle all edge cases

**Status:** Deferred to Week 4

---

### 2025-01-05 - Greek Localization Strategy

**Context:**
UI needs to be in Greek. Should we use i18n library or hardcode Greek?

**Decision:**
Start with hardcoded Greek text, add i18n library later if needed.

**Alternatives Considered:**
1. **Hardcoded Greek**
   - ✅ Simpler
   - ✅ Faster development
   - ✅ No extra dependency
   - ❌ Harder to add English later

2. **react-i18next from start**
   - ✅ Easy to add more languages
   - ✅ Industry standard
   - ❌ Extra complexity
   - ❌ Slower development initially

**Rationale:**
- Greek market is the only target for v1
- Can add i18n later if needed (refactor is straightforward)
- Premature optimization

**Consequences:**
- Positive: Faster initial development
- Negative: Refactor needed if we add English
- Risks: Low - Greek-only is acceptable for MVP

**Status:** Accepted

---

### 2025-01-05 - Date/Time Handling

**Context:**
Need consistent date/time handling. Options: date-fns, Day.js, Luxon, native Date.

**Decision:**
Use **date-fns** for all date/time operations.

**Alternatives Considered:**
1. **date-fns**
   - ✅ Tree-shakable
   - ✅ Functional approach
   - ✅ Small bundle impact
   - ✅ Good TypeScript support
   - ✅ Pure functions

2. **Day.js**
   - ✅ Very small (2KB)
   - ✅ Moment.js API
   - ❌ Mutable by default
   - ❌ Less comprehensive

3. **Luxon**
   - ✅ Immutable
   - ✅ Great i18n
   - ✅ Timezone support
   - ❌ Larger bundle
   - ❌ Overkill for needs

4. **Native Date + Intl**
   - ✅ No dependency
   - ❌ Poor API
   - ❌ More code to write

**Rationale:**
- date-fns is modern and tree-shakable
- Pure functions, immutable
- Europe/Athens timezone handled via Supabase
- Display formatting works well with Greek locale

**Consequences:**
- Positive: Consistent date handling, small bundle
- Negative: None significant
- Risks: None

**Status:** Accepted

---

### 2025-01-05 - Testing Strategy

**Context:**
What testing approach should we use? Balance between speed and coverage.

**Decision:**
- **Vitest** for unit tests (utilities, functions)
- **Playwright** for E2E tests (critical flows only)
- Manual testing for everything else initially

**Alternatives Considered:**
1. **Vitest + Playwright + React Testing Library**
   - ✅ Comprehensive
   - ✅ High confidence
   - ❌ Slower development
   - ❌ More maintenance

2. **E2E tests only (Playwright)**
   - ✅ High-level confidence
   - ✅ Tests real user flows
   - ❌ Slower to run
   - ❌ Harder to debug

3. **No automated tests**
   - ✅ Fastest development
   - ❌ High risk of regressions
   - ❌ Not acceptable for production

**Rationale:**
- Unit tests for constraint evaluation logic (critical)
- E2E tests for main flows (create session → generate schedule)
- Manual testing for UI/UX during development
- Can add more tests later as needed

**Consequences:**
- Positive: Balanced approach, reasonable speed
- Negative: Not comprehensive coverage initially
- Risks: Some bugs slip through (acceptable for MVP)

**Status:** Accepted

---

### 2025-01-05 - Deployment Strategy

**Context:**
Where to deploy Next.js app and how to manage environments?

**Decision:**
- Deploy to **Vercel** for both staging and production
- Use Supabase projects for staging and production databases
- GitHub integration for auto-deploy

**Alternatives Considered:**
1. **Vercel**
   - ✅ Built for Next.js
   - ✅ Auto-deploy from GitHub
   - ✅ Edge functions support
   - ✅ Free tier generous
   - ✅ Great DX

2. **Netlify**
   - ✅ Similar to Vercel
   - ✅ Good DX
   - ❌ Less optimized for Next.js
   - ❌ Edge functions more limited

3. **Self-hosted (VPS)**
   - ✅ Full control
   - ✅ Cheaper at scale
   - ❌ More DevOps work
   - ❌ Slower deployment
   - ❌ Overkill for MVP

**Rationale:**
- Vercel is made by Next.js creators
- Easiest deployment experience
- Free tier sufficient for MVP
- Can migrate later if needed

**Consequences:**
- Positive: Zero DevOps overhead, fast deploys
- Negative: Vendor lock-in (mitigated by standard Next.js)
- Risks: Cost at scale (mitigated by monitoring)

**Status:** Accepted

---

## Future Decisions to Make

**These decisions are deferred until we reach the relevant phase:**

- [ ] Calendar library choice (Week 4)
- [ ] PDF generation method (Week 8)
- [ ] Email service provider (Post-launch)
- [ ] Weather API provider (Phase 4)
- [ ] Payment processor (Post-launch)
- [ ] Mobile app approach: PWA vs React Native vs Capacitor (Month 4)
- [ ] Analytics platform (Post-launch)
- [ ] Error tracking service (Post-launch)

---

## Decision-Making Process

**When to document a decision:**
- Any technical choice that affects architecture
- Any choice that's hard to reverse
- Any choice that team members might question later

**Format:**
- Follow the template above
- Be concise but complete
- Focus on rationale, not just the decision

**Review:**
- Decisions should be reviewed in weekly planning
- Can be superseded by new decisions (mark as "Superseded")
- Document the superseding decision and link back

---

_Last updated: 2025-01-05_
