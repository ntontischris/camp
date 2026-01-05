# API Documentation

Complete API reference for CampWise.

---

## API Architecture

CampWise uses a hybrid API approach:

1. **Supabase Client SDK** - Direct database access with RLS
2. **Next.js API Routes** - Server-side logic, scheduling engine
3. **Supabase Edge Functions** - Heavy computation (OR-Tools)

---

## Authentication

All requests require authentication via Supabase session.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Getting the token:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

---

## Supabase Client Queries

### Organizations

#### Get User's Organizations
```typescript
const { data, error } = await supabase
  .from('organization_members')
  .select(`
    *,
    organization:organizations(*)
  `)
  .eq('user_id', userId)
  .eq('is_active', true);
```

#### Get Organization by Slug
```typescript
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('slug', orgSlug)
  .single();
```

#### Update Organization
```typescript
const { data, error } = await supabase
  .from('organizations')
  .update({
    name: 'New Name',
    logo_url: 'https://...',
    updated_at: new Date().toISOString()
  })
  .eq('id', orgId);
```

---

### Sessions

#### Get Sessions for Organization
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .order('start_date', { ascending: false });
```

#### Get Session with Details
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select(`
    *,
    groups(*),
    schedule_slots(count)
  `)
  .eq('id', sessionId)
  .single();
```

#### Create Session
```typescript
const { data, error } = await supabase
  .from('sessions')
  .insert({
    organization_id: orgId,
    name: 'July 2025 - Week 1',
    start_date: '2025-07-01',
    end_date: '2025-07-15',
    status: 'draft',
    created_by: userId
  })
  .select()
  .single();
```

#### Update Session
```typescript
const { data, error } = await supabase
  .from('sessions')
  .update({ status: 'planning' })
  .eq('id', sessionId)
  .select()
  .single();
```

#### Delete Session (Soft)
```typescript
const { data, error } = await supabase
  .from('sessions')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', sessionId);
```

---

### Groups

#### Get Groups for Session
```typescript
const { data, error } = await supabase
  .from('groups')
  .select(`
    *,
    primary_supervisor:staff(*),
    group_tags(tag:tags(*))
  `)
  .eq('session_id', sessionId)
  .is('deleted_at', null)
  .order('sort_order');
```

#### Create Group
```typescript
const { data, error } = await supabase
  .from('groups')
  .insert({
    session_id: sessionId,
    name: 'Eagles',
    code: 'EAGL',
    color: '#3b82f6',
    icon: '🦅',
    age_min: 8,
    age_max: 12,
    capacity: 20
  })
  .select()
  .single();
```

#### Add Tags to Group
```typescript
const { data, error } = await supabase
  .from('group_tags')
  .insert([
    { group_id: groupId, tag_id: tag1Id },
    { group_id: groupId, tag_id: tag2Id }
  ]);
```

---

### Activities

#### Get Activities for Organization
```typescript
const { data, error } = await supabase
  .from('activities')
  .select(`
    *,
    activity_tags(tag:tags(*)),
    activity_facility_requirements(
      facility:facilities(*),
      facility_tag:tags(*)
    )
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .eq('is_active', true);
```

#### Create Activity
```typescript
const { data, error } = await supabase
  .from('activities')
  .insert({
    organization_id: orgId,
    name: 'Swimming',
    duration_minutes: 45,
    setup_minutes: 10,
    cleanup_minutes: 10,
    min_participants: 8,
    max_participants: 20,
    min_age: 8,
    required_staff_count: 2,
    required_certifications: ['Ναυαγοσώστης'],
    weather_dependent: true,
    allowed_weather: ['sunny', 'cloudy'],
    color: '#0ea5e9',
    icon: '🏊'
  })
  .select()
  .single();
```

#### Add Facility Requirements
```typescript
// Requires specific facility
const { data, error } = await supabase
  .from('activity_facility_requirements')
  .insert({
    activity_id: activityId,
    facility_id: poolId,
    is_required: true,
    priority: 1
  });

// OR requires any facility with tag
const { data, error } = await supabase
  .from('activity_facility_requirements')
  .insert({
    activity_id: activityId,
    facility_tag_id: outdoorTagId,
    is_required: true,
    priority: 1
  });
```

---

### Facilities

#### Get Facilities for Organization
```typescript
const { data, error } = await supabase
  .from('facilities')
  .select(`
    *,
    facility_tags(tag:tags(*)),
    facility_availability(*)
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .eq('is_active', true);
```

#### Set Facility Availability
```typescript
// Recurring: Mon-Fri 09:00-17:00
const { data, error } = await supabase
  .from('facility_availability')
  .insert([
    {
      facility_id: facilityId,
      day_of_week: 1, // Monday
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    },
    // ... repeat for Tue-Fri
  ]);

// Specific date: Closed on holiday
const { data, error } = await supabase
  .from('facility_availability')
  .insert({
    facility_id: facilityId,
    specific_date: '2025-07-04',
    start_time: '00:00',
    end_time: '23:59',
    is_available: false,
    reason: 'Holiday'
  });
```

---

### Staff

#### Get Staff for Organization
```typescript
const { data, error } = await supabase
  .from('staff')
  .select(`
    *,
    staff_tags(
      tag:tags(*),
      proficiency_level,
      certified_until
    ),
    staff_activity_preferences(
      activity:activities(*),
      can_lead,
      can_assist,
      preference_level
    ),
    staff_availability(*)
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .eq('is_active', true);
```

#### Create Staff
```typescript
const { data, error } = await supabase
  .from('staff')
  .insert({
    organization_id: orgId,
    employee_code: 'S001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+30 123 456 7890',
    role: 'instructor',
    certifications: ['Ναυαγοσώστης', 'Α\' Βοήθειες'],
    max_hours_per_day: 8,
    max_hours_per_week: 40
  })
  .select()
  .single();
```

#### Set Activity Preferences
```typescript
const { data, error } = await supabase
  .from('staff_activity_preferences')
  .insert({
    staff_id: staffId,
    activity_id: swimmingId,
    can_lead: true,
    can_assist: true,
    preference_level: 5
  });
```

---

### Day Templates

#### Get Templates for Organization
```typescript
const { data, error } = await supabase
  .from('day_templates')
  .select(`
    *,
    day_template_slots(*)
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .eq('is_active', true)
  .order('is_default', { ascending: false });
```

#### Create Template with Slots
```typescript
// 1. Create template
const { data: template, error: templateError } = await supabase
  .from('day_templates')
  .insert({
    organization_id: orgId,
    name: 'Normal Day',
    is_default: true
  })
  .select()
  .single();

// 2. Create slots
const { data: slots, error: slotsError } = await supabase
  .from('day_template_slots')
  .insert([
    {
      day_template_id: template.id,
      name: 'Activity 1',
      start_time: '09:00',
      end_time: '09:45',
      slot_type: 'activity',
      is_schedulable: true,
      sort_order: 1
    },
    {
      day_template_id: template.id,
      name: 'Activity 2',
      start_time: '09:50',
      end_time: '10:35',
      slot_type: 'activity',
      is_schedulable: true,
      sort_order: 2
    },
    {
      day_template_id: template.id,
      name: 'Διάλειμμα',
      start_time: '10:35',
      end_time: '11:00',
      slot_type: 'break',
      is_schedulable: false,
      sort_order: 3
    }
    // ... more slots
  ]);
```

---

### Constraints

#### Get Constraints for Session
```typescript
const { data, error } = await supabase
  .from('constraints')
  .select('*')
  .or(`session_id.eq.${sessionId},organization_id.eq.${orgId}`)
  .is('deleted_at', null)
  .eq('is_active', true);
```

#### Create Constraint
```typescript
const { data, error } = await supabase
  .from('constraints')
  .insert({
    session_id: sessionId,
    name: 'Κολύμβηση μόνο πρωί',
    description: 'Η κολύμβηση επιτρέπεται μόνο 09:00-12:00',
    constraint_type: 'time_restriction',
    is_hard: true,
    is_active: true,
    scope: {
      activity_tags: ['Υδάτινη']
    },
    action: {
      allowed_times: [
        { start: '09:00', end: '12:00' }
      ]
    },
    error_message: 'Η κολύμβηση επιτρέπεται μόνο 09:00-12:00',
    created_by: userId
  })
  .select()
  .single();
```

---

### Activity Requirements

#### Get Requirements for Session
```typescript
const { data, error } = await supabase
  .from('activity_requirements')
  .select(`
    *,
    activity:activities(*),
    group:groups(*)
  `)
  .eq('session_id', sessionId);
```

#### Create Requirement
```typescript
const { data, error } = await supabase
  .from('activity_requirements')
  .insert({
    session_id: sessionId,
    activity_id: swimmingId,
    group_id: null, // null = all groups
    frequency_type: 'per_week',
    target_count: 3,
    is_mandatory: true
  })
  .select()
  .single();
```

---

### Schedule Slots

#### Get Schedule for Session
```typescript
const { data, error } = await supabase
  .from('schedule_slots')
  .select(`
    *,
    group:groups(*),
    activity:activities(*),
    facility:facilities(*),
    schedule_slot_staff(
      staff:staff(*),
      role,
      confirmed
    )
  `)
  .eq('session_id', sessionId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date')
  .order('start_time');
```

#### Create Schedule Slot
```typescript
const { data, error } = await supabase
  .from('schedule_slots')
  .insert({
    session_id: sessionId,
    date: '2025-07-01',
    start_time: '09:00',
    end_time: '09:45',
    group_id: groupId,
    activity_id: activityId,
    facility_id: facilityId,
    status: 'scheduled',
    generation_method: 'manual',
    created_by: userId
  })
  .select()
  .single();
```

#### Assign Staff to Slot
```typescript
const { data, error } = await supabase
  .from('schedule_slot_staff')
  .insert([
    {
      schedule_slot_id: slotId,
      staff_id: staff1Id,
      role: 'lead'
    },
    {
      schedule_slot_id: slotId,
      staff_id: staff2Id,
      role: 'assistant'
    }
  ]);
```

#### Update Slot (Drag & Drop)
```typescript
const { data, error } = await supabase
  .from('schedule_slots')
  .update({
    date: newDate,
    start_time: newStartTime,
    end_time: newEndTime,
    updated_at: new Date().toISOString()
  })
  .eq('id', slotId)
  .select()
  .single();
```

#### Bulk Delete Slots
```typescript
const { data, error } = await supabase
  .from('schedule_slots')
  .delete()
  .in('id', slotIds);
```

---

## Next.js API Routes

### Schedule Generation

#### POST /api/schedule/generate

**Description:** Generate schedule using OR-Tools

**Request Body:**
```typescript
{
  session_id: string;
  date_from: string; // ISO date
  date_to: string;   // ISO date
  parameters?: {
    use_requirements: boolean;
    enforce_soft_constraints: boolean;
    scoring_weights?: {
      fairness: number;
      variety: number;
      transitions: number;
      energy_balance: number;
      resource_utilization: number;
      preferences: number;
    };
    lock_existing: boolean;
  };
}
```

**Response:**
```typescript
{
  status: 'success' | 'failed';
  run_id: string;
  result?: {
    slots_created: number;
    conflicts_found: number;
    constraints_violated: number;
    score: number;
    slots: ScheduleSlot[];
  };
  error?: string;
  error_details?: object;
}
```

**Implementation:**
```typescript
// app/api/schedule/generate/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const { session_id, date_from, date_to, parameters } = body;

  // 1. Validate session access
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check permissions
  const canGenerate = await userCanGenerateSchedule(session.user.id, session_id);
  if (!canGenerate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Create generation run record
  const { data: run } = await supabase
    .from('schedule_generation_runs')
    .insert({
      session_id,
      date_from,
      date_to,
      parameters,
      status: 'running',
      created_by: session.user.id
    })
    .select()
    .single();

  try {
    // 4. Fetch all required data
    const [groups, activities, facilities, staff, constraints, requirements] =
      await Promise.all([
        fetchGroups(session_id),
        fetchActivities(session_id),
        fetchFacilities(session_id),
        fetchStaff(session_id),
        fetchConstraints(session_id),
        fetchRequirements(session_id)
      ]);

    // 5. Call OR-Tools engine (edge function)
    const result = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/schedule-generator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          session_id,
          date_from,
          date_to,
          groups,
          activities,
          facilities,
          staff,
          constraints,
          requirements,
          parameters
        })
      }
    );

    const solution = await result.json();

    if (solution.status === 'success') {
      // 6. Save slots to database
      const { data: slots } = await supabase
        .from('schedule_slots')
        .insert(
          solution.slots.map(slot => ({
            ...slot,
            generation_run_id: run.id,
            generation_method: 'auto_generated'
          }))
        )
        .select();

      // 7. Update run status
      await supabase
        .from('schedule_generation_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          slots_created: slots.length,
          result_summary: solution.summary
        })
        .eq('id', run.id);

      return NextResponse.json({
        status: 'success',
        run_id: run.id,
        result: {
          slots_created: slots.length,
          score: solution.score,
          slots
        }
      });
    } else {
      // 8. Handle failure
      await supabase
        .from('schedule_generation_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: solution.error
        })
        .eq('id', run.id);

      return NextResponse.json({
        status: 'failed',
        run_id: run.id,
        error: solution.error
      }, { status: 400 });
    }
  } catch (error) {
    // 9. Handle errors
    await supabase
      .from('schedule_generation_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', run.id);

    return NextResponse.json({
      status: 'failed',
      run_id: run.id,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

---

### Feasibility Check

#### POST /api/schedule/check-feasibility

**Description:** Check if schedule generation is feasible

**Request Body:**
```typescript
{
  session_id: string;
  date_from: string;
  date_to: string;
}
```

**Response:**
```typescript
{
  feasible: boolean;
  warnings: Array<{
    type: 'warning' | 'error';
    message: string;
    details: object;
  }>;
  estimates: {
    total_slots_needed: number;
    available_time_slots: number;
    estimated_duration_seconds: number;
  };
}
```

**Implementation:**
```typescript
// app/api/schedule/check-feasibility/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const { session_id, date_from, date_to } = body;

  const warnings = [];

  // Check groups
  const groups = await fetchGroups(session_id);
  if (groups.length === 0) {
    warnings.push({
      type: 'error',
      message: 'No groups defined',
      details: {}
    });
  }

  // Check activities
  const activities = await fetchActiveActivities(session_id);
  if (activities.length === 0) {
    warnings.push({
      type: 'error',
      message: 'No activities defined',
      details: {}
    });
  }

  // Check day template
  const template = await fetchDefaultDayTemplate(session_id);
  if (!template) {
    warnings.push({
      type: 'error',
      message: 'No day template defined',
      details: {}
    });
  }

  // Check staff availability
  const staff = await fetchAvailableStaff(session_id, date_from, date_to);
  const totalStaffNeeded = calculateStaffNeeded(groups, activities);
  if (staff.length < totalStaffNeeded) {
    warnings.push({
      type: 'warning',
      message: `Insufficient staff: ${staff.length} available, ${totalStaffNeeded} needed`,
      details: { available: staff.length, needed: totalStaffNeeded }
    });
  }

  // Check facility conflicts
  const facilityConflicts = await checkFacilityConflicts(session_id, date_from, date_to);
  if (facilityConflicts.length > 0) {
    warnings.push({
      type: 'warning',
      message: 'Potential facility conflicts detected',
      details: { conflicts: facilityConflicts }
    });
  }

  // Calculate estimates
  const totalDays = daysBetween(date_from, date_to);
  const slotsPerDay = template?.day_template_slots.filter(s => s.is_schedulable).length || 0;
  const totalSlots = totalDays * groups.length * slotsPerDay;

  const feasible = warnings.filter(w => w.type === 'error').length === 0;

  return NextResponse.json({
    feasible,
    warnings,
    estimates: {
      total_slots_needed: totalSlots,
      available_time_slots: totalSlots, // simplified
      estimated_duration_seconds: Math.ceil(totalSlots / 10) // rough estimate
    }
  });
}
```

---

### Conflict Detection

#### POST /api/schedule/check-conflicts

**Description:** Check for conflicts when creating/updating a slot

**Request Body:**
```typescript
{
  slot: {
    id?: string; // if updating
    session_id: string;
    date: string;
    start_time: string;
    end_time: string;
    group_id: string;
    activity_id: string;
    facility_id: string;
    staff_ids?: string[];
  };
}
```

**Response:**
```typescript
{
  has_conflicts: boolean;
  conflicts: Array<{
    type: 'facility' | 'staff' | 'group' | 'constraint';
    severity: 'error' | 'warning';
    message: string;
    conflicting_slot_id?: string;
    constraint_id?: string;
  }>;
}
```

---

### PDF Export

#### POST /api/export/pdf

**Description:** Generate PDF of schedule

**Request Body:**
```typescript
{
  session_id: string;
  export_type: 'week' | 'day' | 'group' | 'staff';
  date_from: string;
  date_to: string;
  group_id?: string;
  staff_id?: string;
  options?: {
    include_notes: boolean;
    include_staff: boolean;
    orientation: 'portrait' | 'landscape';
  };
}
```

**Response:**
- Content-Type: application/pdf
- Binary PDF data

---

### Excel Export

#### POST /api/export/excel

**Description:** Generate Excel file of schedule

**Request Body:** Same as PDF export

**Response:**
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Binary Excel data

---

## Supabase Edge Functions

### schedule-generator

**Location:** `supabase/functions/schedule-generator/index.ts`

**Description:** Runs Google OR-Tools to generate optimal schedule

**Input:** See `/api/schedule/generate` request body

**Output:** See `/api/schedule/generate` response

**Implementation notes:**
- Uses Python runtime (Deno supports Python via subprocess)
- OR-Tools constraint programming
- Returns best solution found within time limit

---

## Real-Time Subscriptions

### Subscribe to Schedule Changes

```typescript
const channel = supabase
  .channel('schedule-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'schedule_slots',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('Schedule updated:', payload);
      // Invalidate React Query cache
      queryClient.invalidateQueries(['schedule', sessionId]);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Subscribe to Notifications

```typescript
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show toast notification
      toast.info(payload.new.title);
      // Update notification count
      queryClient.invalidateQueries(['notifications']);
    }
  )
  .subscribe();
```

---

## Rate Limiting

**Strategy:** Vercel Edge Middleware + Upstash Redis (future)

**Limits:**
- API routes: 100 req/min per user
- Schedule generation: 5 runs per hour per session
- Export: 20 exports per hour per user

**Implementation:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return;

  const userId = session.user.id;
  const key = `rate-limit:${userId}`;

  // Check rate limit (simplified)
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (count > 100) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  return NextResponse.next();
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_REQUIRED` | Authentication required | No session token |
| `FORBIDDEN` | Insufficient permissions | User doesn't have permission |
| `NOT_FOUND` | Resource not found | Entity doesn't exist |
| `VALIDATION_ERROR` | Validation failed | Invalid input data |
| `CONFLICT` | Resource conflict | Duplicate key, scheduling conflict |
| `CONSTRAINT_VIOLATION` | Constraint violated | Hard constraint can't be satisfied |
| `GENERATION_FAILED` | Schedule generation failed | OR-Tools couldn't find solution |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Rate limit hit |
| `INTERNAL_ERROR` | Internal server error | Unexpected error |

---

## Pagination

**Query parameters:**
- `limit`: Number of items (default: 50, max: 200)
- `offset`: Number of items to skip (default: 0)
- OR `cursor`: Cursor-based pagination (preferred for large datasets)

**Example:**
```typescript
const { data, error, count } = await supabase
  .from('schedule_slots')
  .select('*', { count: 'exact' })
  .eq('session_id', sessionId)
  .range(offset, offset + limit - 1);

// Response includes:
// - data: array of items
// - count: total count (if requested)
// - Use offset/limit for next page
```

---

## Webhooks (Future)

**Events:**
- `schedule.generated` - Schedule generation completed
- `schedule.published` - Schedule published to staff
- `session.status_changed` - Session status changed
- `assignment.created` - Staff assigned to slot

**Payload:**
```typescript
{
  event: string;
  timestamp: string;
  organization_id: string;
  data: object;
}
```

---

## API Client (TypeScript)

**Recommended approach:**
```typescript
// lib/api-client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Typed queries
export async function getSessions(orgId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('organization_id', orgId);

  if (error) throw error;
  return data;
}
```

**Generate types:**
```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
```

---

## Testing APIs

### Unit Tests
```typescript
// __tests__/api/schedule-generate.test.ts
describe('POST /api/schedule/generate', () => {
  it('generates schedule successfully', async () => {
    const response = await fetch('/api/schedule/generate', {
      method: 'POST',
      body: JSON.stringify({
        session_id: 'test-session-id',
        date_from: '2025-07-01',
        date_to: '2025-07-15'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.result.slots_created).toBeGreaterThan(0);
  });
});
```

### Integration Tests
Use Postman/Insomnia collections or Playwright for E2E API tests.
