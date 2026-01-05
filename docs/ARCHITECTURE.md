# System Architecture

Complete technical architecture for CampWise.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │         Next.js 15 (App Router)                │   │
│  │  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │  React       │  │  Zustand + TanStack  │   │   │
│  │  │  Components  │  │  Query               │   │   │
│  │  └──────────────┘  └──────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │  TailwindCSS + shadcn/ui                 │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Cloud                        │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐ │
│  │  PostgreSQL    │  │  Auth          │  │ Storage  │ │
│  │  + RLS         │  │  (Email+Pass)  │  │ (Images) │ │
│  └────────────────┘  └────────────────┘  └──────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Realtime (WebSocket)                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ RPC / Functions
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel Edge Functions (Optional)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Scheduling Engine (OR-Tools via Python)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (App Router) | SSR, routing, API routes |
| UI Library | React 18 | Component-based UI |
| Styling | TailwindCSS | Utility-first CSS |
| Components | shadcn/ui | Accessible, customizable components |
| State Management | Zustand | Global state (user, org, filters) |
| Server State | TanStack Query (React Query) | Data fetching, caching, optimistic updates |
| Forms | React Hook Form + Zod | Form handling, validation |
| Calendar | FullCalendar or react-big-calendar | Drag & drop scheduling |
| Date/Time | date-fns | Date manipulation (Europe/Athens) |
| Drag & Drop | dnd-kit | Drag & drop interactions |
| Icons | Lucide React | Icon library |
| Charts | Recharts | Analytics/reports |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | Supabase PostgreSQL | Primary data store |
| Auth | Supabase Auth | User authentication |
| Storage | Supabase Storage | Images (logos, photos) |
| Realtime | Supabase Realtime | Live updates (collaborative editing) |
| API | Next.js API Routes + Supabase RPC | Server-side logic |
| Scheduling Engine | Google OR-Tools (Python) | Constraint solver |

### Infrastructure

| Layer | Technology | Purpose |
|-------|------------|---------|
| Hosting | Vercel | Frontend hosting, edge functions |
| Database | Supabase Cloud | Managed PostgreSQL |
| CI/CD | GitHub Actions | Automated testing, deployment |
| Monitoring | Sentry (future) | Error tracking |
| Analytics | Vercel Analytics | Usage analytics |

---

## Directory Structure

```
campwise/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docs/                       # Documentation
│   ├── DATABASE.md
│   ├── CONSTRAINTS.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md         # This file
│   ├── API.md
│   └── UI-SPECS.md
├── public/                     # Static assets
│   ├── images/
│   └── icons/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── [orgSlug]/
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── [sessionId]/
│   │   │   │   │   │   ├── schedule/
│   │   │   │   │   │   ├── groups/
│   │   │   │   │   │   ├── constraints/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── activities/
│   │   │   │   ├── facilities/
│   │   │   │   ├── staff/
│   │   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── schedule/
│   │   │   │   └── generate/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── calendar/
│   │   │   ├── week-view.tsx
│   │   │   ├── day-view.tsx
│   │   │   ├── slot-card.tsx
│   │   │   └── conflict-indicator.tsx
│   │   ├── constraints/
│   │   │   ├── constraint-builder.tsx
│   │   │   ├── constraint-list.tsx
│   │   │   └── constraint-templates.tsx
│   │   ├── schedule/
│   │   │   ├── generation-wizard.tsx
│   │   │   ├── progress-tracker.tsx
│   │   │   └── results-preview.tsx
│   │   ├── forms/
│   │   │   ├── activity-form.tsx
│   │   │   ├── group-form.tsx
│   │   │   ├── staff-form.tsx
│   │   │   └── session-form.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── org-switcher.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── middleware.ts       # Auth middleware
│   │   │   └── types.ts            # Generated types
│   │   ├── scheduling/
│   │   │   ├── engine.ts           # OR-Tools integration
│   │   │   ├── constraints.ts      # Constraint evaluation
│   │   │   ├── scoring.ts          # Solution scoring
│   │   │   └── feasibility.ts      # Feasibility checks
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── validation.ts
│   │   │   └── helpers.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── use-organization.ts
│   │   ├── use-session.ts
│   │   ├── use-schedule.ts
│   │   └── use-permissions.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── org-store.ts
│   │   └── calendar-store.ts
│   ├── types/
│   │   ├── database.ts             # Generated from Supabase
│   │   ├── api.ts
│   │   └── schedule.ts
│   └── styles/
│       └── globals.css
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/                  # Edge Functions
│   │   └── schedule-generator/
│   └── config.toml
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── seed-dev-data.ts
│   └── generate-types.ts
├── .env.local.example
├── .env.production
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── CLAUDE.md
├── PROJECT-BRIEF.md
├── ROADMAP.md
├── TASKS.md
└── DECISIONS.md
```

---

## Data Flow

### 1. User Authentication Flow

```
1. User enters email/password
   ↓
2. Next.js API route calls Supabase Auth
   ↓
3. Supabase returns JWT + user data
   ↓
4. JWT stored in httpOnly cookie
   ↓
5. User data stored in Zustand store
   ↓
6. Redirect to dashboard
```

### 2. Organization Access Flow

```
1. User navigates to /[orgSlug]
   ↓
2. Middleware checks auth
   ↓
3. Server component fetches org membership
   ↓
4. RLS ensures user has access
   ↓
5. Render dashboard with org data
```

### 3. Schedule Generation Flow

```
Client Side:
1. User clicks "Generate Schedule"
   ↓
2. Validation: check feasibility
   ↓
3. POST /api/schedule/generate

Server Side:
4. Create schedule_generation_run record
   ↓
5. Call Python edge function with:
   - Session data
   - Constraints
   - Requirements
   ↓
6. OR-Tools finds valid solutions
   ↓
7. Score solutions
   ↓
8. Return best solution

Client Side:
9. Preview results
   ↓
10. User approves
   ↓
11. Bulk insert schedule_slots
   ↓
12. Update generation_run status
```

### 4. Real-Time Updates Flow

```
User A edits schedule slot
   ↓
1. Optimistic update in UI
   ↓
2. Mutation via TanStack Query
   ↓
3. Supabase updates DB
   ↓
4. RLS checks permissions
   ↓
5. Supabase broadcasts change via WebSocket
   ↓
6. User B's client receives update
   ↓
7. TanStack Query invalidates cache
   ↓
8. UI re-renders with new data
```

---

## Key Architectural Patterns

### 1. Multi-Tenancy

**Strategy:** Organization-scoped data with RLS

**Implementation:**
- Every table has `organization_id` or foreign key to org
- RLS policies check `user_has_org_access(org_id)`
- No data leakage between orgs
- Performance: indexes on `organization_id`

**Code example:**
```typescript
// Server-side: automatic filtering
const activities = await supabase
  .from('activities')
  .select('*')
  .eq('organization_id', orgId);  // RLS enforces this too
```

### 2. Server Components + Client Components

**Pattern:**
- Server Components for data fetching
- Client Components for interactivity

**Example:**
```typescript
// app/(dashboard)/[orgSlug]/sessions/[sessionId]/page.tsx
// Server Component
export default async function SessionPage({ params }) {
  const session = await getSession(params.sessionId);
  return <SessionDashboard initialData={session} />;
}

// components/sessions/session-dashboard.tsx
// Client Component
'use client';
export function SessionDashboard({ initialData }) {
  const { data: session } = useSession(initialData);
  // Interactive UI
}
```

### 3. Optimistic Updates

**For instant UX:**
```typescript
const mutation = useMutation({
  mutationFn: updateScheduleSlot,
  onMutate: async (newSlot) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['schedule']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['schedule']);

    // Optimistically update
    queryClient.setQueryData(['schedule'], (old) => ({
      ...old,
      slots: old.slots.map(s => s.id === newSlot.id ? newSlot : s)
    }));

    return { previous };
  },
  onError: (err, newSlot, context) => {
    // Rollback on error
    queryClient.setQueryData(['schedule'], context.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(['schedule']);
  }
});
```

### 4. Constraint Evaluation Engine

**Architecture:**
```typescript
interface ConstraintEvaluator {
  evaluate(
    constraint: Constraint,
    slot: ScheduleSlot,
    context: ScheduleContext
  ): Promise<EvaluationResult>;
}

// Plugin system for constraint types
const evaluators = new Map<ConstraintType, ConstraintEvaluator>();
evaluators.set('time_restriction', new TimeRestrictionEvaluator());
evaluators.set('sequence', new SequenceEvaluator());
// ... etc

// Evaluate all constraints
async function evaluateConstraints(slot: ScheduleSlot) {
  const results = await Promise.all(
    constraints.map(c => evaluators.get(c.type).evaluate(c, slot, context))
  );
  return aggregateResults(results);
}
```

### 5. Scheduling Engine Interface

**Python OR-Tools running as Edge Function:**
```python
# supabase/functions/schedule-generator/main.py
from ortools.sat.python import cp_model
from supabase import create_client

def generate_schedule(request):
    # Parse input
    session_id = request['session_id']
    constraints = request['constraints']
    requirements = request['requirements']

    # Fetch data
    supabase = create_client(...)
    groups = supabase.table('groups').select('*').eq('session_id', session_id).execute()
    activities = supabase.table('activities').select('*').execute()

    # Build OR-Tools model
    model = cp_model.CpModel()

    # Variables
    slots = {}
    for group in groups:
        for day in date_range:
            for time_slot in time_slots:
                slots[(group.id, day, time_slot)] = model.NewIntVar(
                    0, len(activities), f'slot_{group.id}_{day}_{time_slot}'
                )

    # Constraints
    for constraint in constraints:
        apply_constraint(model, constraint, slots)

    # Solve
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        # Extract solution
        solution = extract_solution(solver, slots)
        return {
            'status': 'success',
            'solution': solution,
            'score': calculate_score(solution)
        }
    else:
        return {
            'status': 'failed',
            'reason': 'No feasible solution found'
        }
```

**Client Integration:**
```typescript
// lib/scheduling/engine.ts
export async function generateSchedule(
  sessionId: string,
  params: GenerationParams
): Promise<GenerationResult> {
  // Call edge function
  const response = await fetch('/api/schedule/generate', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, ...params })
  });

  return response.json();
}
```

### 6. Permission System

**Role-based with fine-grained control:**
```typescript
// lib/permissions.ts
export function usePermissions() {
  const { membership } = useOrganization();

  return {
    canEditSession: ['owner', 'admin', 'manager'].includes(membership.role),
    canDeleteSession: ['owner', 'admin'].includes(membership.role),
    canEditSchedule: ['owner', 'admin', 'manager', 'instructor'].includes(membership.role),
    canManageBilling: membership.role === 'owner',
    // etc.
  };
}

// Usage in components
function SessionActions() {
  const { canDeleteSession } = usePermissions();

  return (
    <>
      {canDeleteSession && <Button onClick={deleteSession}>Delete</Button>}
    </>
  );
}
```

---

## State Management Strategy

### Zustand Stores (Global State)

```typescript
// stores/auth-store.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User) => void;
  logout: () => void;
}

// stores/org-store.ts
interface OrgState {
  currentOrg: Organization | null;
  membership: OrganizationMember | null;
  setOrg: (org: Organization, membership: OrganizationMember) => void;
}

// stores/calendar-store.ts
interface CalendarState {
  currentDate: Date;
  view: 'week' | 'day' | 'group' | 'facility' | 'staff';
  filters: CalendarFilters;
  setDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setFilters: (filters: CalendarFilters) => void;
}
```

### TanStack Query (Server State)

```typescript
// hooks/use-session.ts
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}

// hooks/use-schedule.ts
export function useSchedule(sessionId: string, filters: ScheduleFilters) {
  return useQuery({
    queryKey: ['schedule', sessionId, filters],
    queryFn: () => fetchSchedule(sessionId, filters),
    staleTime: 1 * 60 * 1000,  // 1 minute
  });
}

// hooks/use-update-slot.ts
export function useUpdateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSlot,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['schedule', variables.sessionId]);
    }
  });
}
```

---

## Security Architecture

### 1. Authentication

**Supabase Auth:**
- Email + password (Phase 1)
- OAuth (Google, Microsoft) - future
- JWT tokens in httpOnly cookies
- Refresh token rotation

### 2. Authorization

**Row Level Security (RLS):**
- All tables have RLS enabled
- Helper functions:
  - `user_has_org_access(org_id)`
  - `user_org_role(org_id)`
- Policies for SELECT, INSERT, UPDATE, DELETE

**API Layer:**
- Additional checks in API routes
- Validate user permissions before mutations

### 3. Data Validation

**Client-side:**
- React Hook Form + Zod schemas
- Immediate feedback

**Server-side:**
- Zod validation in API routes
- Database constraints
- Custom validation functions

### 4. Rate Limiting

**Vercel Edge:**
- Rate limit API routes
- Prevent abuse

**Supabase:**
- Connection pooling
- Query timeout limits

---

## Performance Optimization

### 1. Database Optimization

**Indexes:**
- All foreign keys indexed
- Composite indexes for common queries:
  - `(session_id, date)` on schedule_slots
  - `(organization_id, is_active)` on activities
  - `(facility_id, date, start_time)` on schedule_slots

**Pagination:**
- All lists paginated (default 50 items)
- Cursor-based for large datasets

**Caching:**
- TanStack Query caching (5 min default)
- Supabase Realtime for live updates

### 2. Frontend Optimization

**Code Splitting:**
- Route-based splitting (automatic with App Router)
- Dynamic imports for heavy components:
  - Calendar library
  - OR-Tools visualizer
  - Export generators

**Image Optimization:**
- Next.js Image component
- WebP format
- Lazy loading

**Bundle Size:**
- Tree shaking
- Minimize dependencies
- Analyze with `@next/bundle-analyzer`

### 3. Rendering Strategy

**Server Components:**
- Initial data fetching
- SEO-friendly

**Client Components:**
- Interactive features
- Streaming with Suspense

**Example:**
```typescript
// app/[orgSlug]/sessions/[sessionId]/schedule/page.tsx
import { Suspense } from 'react';

export default function SchedulePage({ params }) {
  return (
    <div>
      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleCalendar sessionId={params.sessionId} />
      </Suspense>
    </div>
  );
}
```

---

## Error Handling

### 1. Global Error Boundary

```typescript
// app/error.tsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### 2. API Error Handling

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// API route
export async function POST(req: Request) {
  try {
    // ... logic
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. User-Facing Errors

**Toast notifications:**
```typescript
import { toast } from 'sonner';

mutation.mutate(data, {
  onError: (error) => {
    toast.error(error.message);
  },
  onSuccess: () => {
    toast.success('Schedule updated!');
  }
});
```

---

## Testing Strategy

### 1. Unit Tests (Vitest)

**Test:**
- Utility functions
- Constraint evaluators
- Scoring algorithms
- Validation schemas

### 2. Integration Tests (Playwright)

**Test:**
- API routes
- Database operations
- Auth flows

### 3. E2E Tests (Playwright)

**Test:**
- Critical user flows:
  - Create session → add groups → generate schedule
  - Edit schedule slot → conflict detection
  - Invite team member → accept invitation

### 4. Visual Regression (Chromatic - future)

**Test:**
- UI components
- Calendar views
- Print layouts

---

## Deployment Strategy

### 1. Environments

**Development:**
- Local Supabase (Docker)
- Local Next.js dev server
- Mock scheduling engine (instant results)

**Staging:**
- Supabase staging project
- Vercel preview deployment
- Real scheduling engine

**Production:**
- Supabase production project
- Vercel production deployment
- Monitoring enabled

### 2. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### 3. Database Migrations

**Process:**
1. Write migration in `supabase/migrations/`
2. Test locally: `supabase db reset`
3. Review in PR
4. Deploy to staging: `supabase db push --linked`
5. Deploy to production: `supabase db push --linked --project-ref PROD_REF`

### 4. Feature Flags (future)

**For gradual rollout:**
- Auto-scheduling (beta users first)
- Weather API integration
- New UI features

---

## Monitoring & Observability

### 1. Error Tracking

**Sentry (future):**
- Client-side errors
- Server-side errors
- Performance monitoring

### 2. Logging

**Console logging in development**

**Structured logging in production:**
```typescript
logger.info('Schedule generated', {
  sessionId,
  slotsCreated: result.slots.length,
  duration: performance.now() - start
});
```

### 3. Metrics

**Vercel Analytics:**
- Page views
- Performance metrics

**Custom metrics:**
- Schedule generation time
- Constraint violation rate
- User engagement

---

## Scalability Considerations

### 1. Database

**Current approach (good for ~1000 orgs):**
- Single PostgreSQL instance
- Proper indexing
- RLS for security

**Future scaling:**
- Read replicas
- Connection pooling (PgBouncer)
- Partitioning large tables (schedule_slots by date)

### 2. Scheduling Engine

**Current approach:**
- Synchronous API call
- Works for sessions with <10 groups, <20 activities

**Future scaling:**
- Background job queue (BullMQ)
- Worker pool for parallel generation
- Caching of partial solutions
- Incremental scheduling (only regenerate changed days)

### 3. Frontend

**Current approach:**
- Server components + client hydration
- TanStack Query caching

**Future optimization:**
- Virtual scrolling for large calendars
- Lazy load calendar weeks
- Web workers for constraint validation

---

## Third-Party Integrations

### 1. OR-Tools (Scheduling)

**Integration method:**
- Python edge function
- REST API call from Next.js

**Alternative:**
- OR-Tools WASM (future, if available)

### 2. Weather API (future)

**Options:**
- OpenWeatherMap
- Tomorrow.io
- Weatherbit

**Integration:**
- Fetch forecast daily
- Store in weather_data table
- Trigger substitution workflow

### 3. Email (future)

**Supabase Auth emails:**
- Registration confirmation
- Password reset

**Transactional emails:**
- SendGrid or Resend
- Schedule published notifications
- Assignment reminders

### 4. PDF Generation

**Server-side:**
- Puppeteer or Playwright
- Generate from React components
- Cached for performance

---

## Mobile Strategy (Future)

### Phase 1: Mobile Web
- Responsive design
- Touch-optimized

### Phase 2: PWA
- Service worker
- Offline support
- Add to home screen

### Phase 3: Native Apps (if needed)
- React Native
- Capacitor
- Tauri (desktop)
