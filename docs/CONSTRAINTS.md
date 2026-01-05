# Constraint System

Complete specification of the constraint system for intelligent scheduling.

## Overview

Constraints are rules that govern how activities can be scheduled. They ensure safety, fairness, and operational requirements are met while generating schedules.

### Key Concepts

- **Hard Constraints**: MUST be satisfied (e.g., "Pool needs lifeguard")
- **Soft Constraints**: SHOULD be satisfied if possible (e.g., "Prefer outdoor activities in morning")
- **Priority**: 1-10 scale for soft constraints (10 = highest)
- **Scope**: What the constraint applies to (groups, activities, facilities, staff)
- **Condition**: When the constraint triggers
- **Action**: What must/should happen

---

## Constraint Types

### 1. time_restriction

Limits when an activity can be scheduled.

**Use cases:**
- "Swimming only 09:00-12:00"
- "Indoor activities only after 15:00 when it's hot"
- "No intense activities 12:00-14:00"

**Schema:**
```typescript
{
  type: "time_restriction",
  scope: {
    activity_ids?: UUID[],
    activity_tags?: string[],  // e.g., ["Υδάτινη"]
    facility_ids?: UUID[],
    group_ids?: UUID[]
  },
  action: {
    allowed_times: Array<{
      start: "HH:MM",
      end: "HH:MM"
    }>,
    blocked_times?: Array<{  // Alternative: specify blocked instead
      start: "HH:MM",
      end: "HH:MM"
    }>
  }
}
```

**Examples:**

```json
{
  "name": "Κολύμβηση μόνο πρωί",
  "type": "time_restriction",
  "is_hard": true,
  "scope": {
    "activity_tags": ["Υδάτινη"]
  },
  "action": {
    "allowed_times": [
      {"start": "09:00", "end": "12:30"}
    ]
  },
  "error_message": "Η κολύμβηση επιτρέπεται μόνο 09:00-12:30"
}
```

```json
{
  "name": "Έντονες δραστηριότητες εκτός μεσημεριού",
  "type": "time_restriction",
  "is_hard": false,
  "priority": 8,
  "scope": {
    "activity_tags": ["Έντονη"]
  },
  "action": {
    "blocked_times": [
      {"start": "12:00", "end": "14:00"}
    ]
  }
}
```

---

### 2. sequence

Defines what should/must follow after an activity.

**Use cases:**
- "After intense activity, do calm activity"
- "After swimming, no food for 30 min"
- "Creative activity should follow athletic"

**Schema:**
```typescript
{
  type: "sequence",
  condition: {
    after_activity_ids?: UUID[],
    after_tags?: string[],  // e.g., ["Έντονη"]
    after_slot_type?: slot_type
  },
  action: {
    next_should_have_tags?: string[],  // e.g., ["Ήπια"]
    next_should_be_activity_ids?: UUID[],
    next_cannot_have_tags?: string[],
    next_slot_type?: slot_type  // e.g., "break"
  }
}
```

**Examples:**

```json
{
  "name": "Μετά από έντονη, ήπια δραστηριότητα",
  "type": "sequence",
  "is_hard": false,
  "priority": 7,
  "condition": {
    "after_tags": ["Έντονη"]
  },
  "action": {
    "next_should_have_tags": ["Ήπια"]
  }
}
```

```json
{
  "name": "Μετά από υδάτινη, διάλειμμα",
  "type": "sequence",
  "is_hard": true,
  "condition": {
    "after_tags": ["Υδάτινη"]
  },
  "action": {
    "next_slot_type": "break"
  },
  "error_message": "Απαιτείται διάλειμμα μετά από υδάτινη δραστηριότητα"
}
```

---

### 3. daily_limit

Maximum number of times something can happen per day.

**Use cases:**
- "Max 2 athletic activities/day for young kids"
- "Max 1 swimming/day"
- "Max 3 hours of intense activities/day"

**Schema:**
```typescript
{
  type: "daily_limit",
  scope: {
    group_ids?: UUID[],
    groups?: {
      age_min?: number,
      age_max?: number
    }
  },
  condition: {
    activity_ids?: UUID[],
    activity_tags?: string[]
  },
  action: {
    max_per_day?: number,          // Count-based
    max_minutes_per_day?: number   // Duration-based
  }
}
```

**Examples:**

```json
{
  "name": "Μικρά παιδιά: Max 2 αθλητικές/μέρα",
  "type": "daily_limit",
  "is_hard": true,
  "scope": {
    "groups": {
      "age_max": 8
    }
  },
  "condition": {
    "activity_tags": ["Αθλητική"]
  },
  "action": {
    "max_per_day": 2
  },
  "error_message": "Τα παιδιά κάτω των 8 ετών δεν μπορούν να κάνουν πάνω από 2 αθλητικές δραστηριότητες την ημέρα"
}
```

```json
{
  "name": "Max 180 λεπτά έντονων δραστηριοτήτων/μέρα",
  "type": "daily_limit",
  "is_hard": false,
  "priority": 6,
  "condition": {
    "activity_tags": ["Έντονη"]
  },
  "action": {
    "max_minutes_per_day": 180
  }
}
```

---

### 4. daily_minimum

Minimum number of times something must happen per day.

**Use cases:**
- "At least 1 creative activity/day"
- "At least 2 outdoor activities/day"
- "At least 60 minutes of physical activity/day"

**Schema:**
```typescript
{
  type: "daily_minimum",
  scope?: {
    group_ids?: UUID[]
  },
  condition: {
    activity_ids?: UUID[],
    activity_tags?: string[]
  },
  action: {
    min_per_day?: number,
    min_minutes_per_day?: number
  }
}
```

**Examples:**

```json
{
  "name": "Τουλάχιστον 1 δημιουργική/μέρα",
  "type": "daily_minimum",
  "is_hard": false,
  "priority": 5,
  "condition": {
    "activity_tags": ["Δημιουργική"]
  },
  "action": {
    "min_per_day": 1
  }
}
```

```json
{
  "name": "Ελάχιστο 90 λεπτά φυσικής δραστηριότητας",
  "type": "daily_minimum",
  "is_hard": true,
  "condition": {
    "activity_tags": ["Αθλητική", "Έντονη"]
  },
  "action": {
    "min_minutes_per_day": 90
  }
}
```

---

### 5. consecutive_limit

Maximum consecutive occurrences of something.

**Use cases:**
- "Max 2 intense activities in a row"
- "No more than 3 indoor activities consecutively"
- "Max 90 minutes continuous intense activity"

**Schema:**
```typescript
{
  type: "consecutive_limit",
  condition: {
    activity_ids?: UUID[],
    activity_tags?: string[],
    facility_indoor?: boolean
  },
  action: {
    max_consecutive?: number,      // Count-based
    max_consecutive_minutes?: number  // Duration-based
  }
}
```

**Examples:**

```json
{
  "name": "Όχι πάνω από 2 έντονες συνεχόμενα",
  "type": "consecutive_limit",
  "is_hard": true,
  "condition": {
    "activity_tags": ["Έντονη"]
  },
  "action": {
    "max_consecutive": 2
  },
  "error_message": "Δεν επιτρέπονται πάνω από 2 έντονες δραστηριότητες συνεχόμενα"
}
```

```json
{
  "name": "Max 3 εσωτερικές δραστηριότητες στη σειρά",
  "type": "consecutive_limit",
  "is_hard": false,
  "priority": 6,
  "condition": {
    "activity_tags": ["Εσωτερική"]
  },
  "action": {
    "max_consecutive": 3
  }
}
```

---

### 6. staff_limit

Limits on staff assignments.

**Use cases:**
- "Lifeguard max 4 hours pool duty/day"
- "Instructor max 6 activities/day"
- "Staff needs 30-minute break after 3 hours"

**Schema:**
```typescript
{
  type: "staff_limit",
  scope: {
    staff_ids?: UUID[],
    staff_roles?: staff_role[],
    staff_certifications?: string[]
  },
  condition?: {
    activity_ids?: UUID[],
    activity_tags?: string[]
  },
  action: {
    max_activities_per_day?: number,
    max_hours_per_day?: number,
    max_consecutive_hours?: number,
    required_break_after_hours?: number,
    break_duration_minutes?: number
  }
}
```

**Examples:**

```json
{
  "name": "Ναυαγοσώστης max 4 ώρες πισίνα/μέρα",
  "type": "staff_limit",
  "is_hard": true,
  "scope": {
    "staff_certifications": ["Ναυαγοσώστης"]
  },
  "condition": {
    "activity_tags": ["Υδάτινη"]
  },
  "action": {
    "max_hours_per_day": 4
  },
  "error_message": "Ο ναυαγοσώστης δεν μπορεί να έχει πάνω από 4 ώρες υπηρεσίας στην πισίνα"
}
```

```json
{
  "name": "Υποχρεωτικό διάλειμμα 30' μετά 3 ώρες",
  "type": "staff_limit",
  "is_hard": true,
  "action": {
    "required_break_after_hours": 3,
    "break_duration_minutes": 30
  }
}
```

---

### 7. weather_substitute

Automatic substitution based on weather.

**Use cases:**
- "If rain, Football → Board Games"
- "If very hot, outdoor → indoor"
- "If storm, cancel field trip"

**Schema:**
```typescript
{
  type: "weather_substitute",
  scope: {
    activity_ids?: UUID[],
    activity_tags?: string[]  // e.g., ["Εξωτερική"]
  },
  condition: {
    weather: weather_condition[],  // e.g., ["rainy", "stormy"]
    temperature_above?: number,
    temperature_below?: number
  },
  action: {
    substitute_with?: UUID,  // Specific activity
    substitute_with_tag?: string,  // Any activity with tag
    cancel?: boolean
  }
}
```

**Examples:**

```json
{
  "name": "Βροχή: Ποδόσφαιρο → Επιτραπέζια",
  "type": "weather_substitute",
  "is_hard": true,
  "scope": {
    "activity_ids": ["football-uuid"]
  },
  "condition": {
    "weather": ["rainy", "stormy"]
  },
  "action": {
    "substitute_with": "board-games-uuid"
  }
}
```

```json
{
  "name": "Πολύ ζέστη (>35°C): Εξωτερικές → Εσωτερικές",
  "type": "weather_substitute",
  "is_hard": true,
  "scope": {
    "activity_tags": ["Εξωτερική"]
  },
  "condition": {
    "weather": ["very_hot"],
    "temperature_above": 35
  },
  "action": {
    "substitute_with_tag": "Εσωτερική"
  }
}
```

---

### 8. facility_exclusive

Facility can't be shared by multiple activities.

**Use cases:**
- "Pool: one group at a time"
- "Theater: exclusive use during performances"
- "Kitchen: only one cooking class at once"

**Schema:**
```typescript
{
  type: "facility_exclusive",
  scope: {
    facility_ids?: UUID[],
    facility_tags?: string[]
  },
  action: {
    no_parallel_activities: boolean,
    buffer_before_minutes?: number,  // Setup time
    buffer_after_minutes?: number    // Cleanup time
  }
}
```

**Examples:**

```json
{
  "name": "Πισίνα: Μία δραστηριότητα τη φορά",
  "type": "facility_exclusive",
  "is_hard": true,
  "scope": {
    "facility_ids": ["pool-uuid"]
  },
  "action": {
    "no_parallel_activities": true,
    "buffer_before_minutes": 10,
    "buffer_after_minutes": 10
  },
  "error_message": "Η πισίνα μπορεί να χρησιμοποιηθεί από μία ομάδα τη φορά"
}
```

```json
{
  "name": "Θέατρο: Αποκλειστική χρήση",
  "type": "facility_exclusive",
  "is_hard": true,
  "scope": {
    "facility_ids": ["theater-uuid"]
  },
  "action": {
    "no_parallel_activities": true,
    "buffer_before_minutes": 30,
    "buffer_after_minutes": 15
  }
}
```

---

### 9. gap_required

Required time gap between activities.

**Use cases:**
- "30 min after swimming before meal"
- "15 min gap for transitions between locations"
- "No activities immediately after intense workout"

**Schema:**
```typescript
{
  type: "gap_required",
  condition: {
    after_activity_ids?: UUID[],
    after_tags?: string[],
    before_activity_ids?: UUID[],
    before_tags?: string[],
    before_slot_type?: slot_type  // e.g., "meal"
  },
  action: {
    gap_minutes: number
  }
}
```

**Examples:**

```json
{
  "name": "30' μετά από κολύμβηση πριν το φαγητό",
  "type": "gap_required",
  "is_hard": true,
  "condition": {
    "after_tags": ["Υδάτινη"],
    "before_slot_type": "meal"
  },
  "action": {
    "gap_minutes": 30
  },
  "error_message": "Απαιτούνται 30 λεπτά μετά την κολύμβηση πριν το γεύμα"
}
```

```json
{
  "name": "15' διάλειμμα για μετακίνηση",
  "type": "gap_required",
  "is_hard": false,
  "priority": 7,
  "condition": {
    "after_tags": ["Εξωτερική"],
    "before_tags": ["Εσωτερική"]
  },
  "action": {
    "gap_minutes": 15
  }
}
```

---

### 10. group_separation

Keep groups apart.

**Use cases:**
- "Eagles and Wolves can't share facilities (rivalry)"
- "Different age groups shouldn't mix"
- "Advanced swimmers separate from beginners"

**Schema:**
```typescript
{
  type: "group_separation",
  scope: {
    group_ids: UUID[]  // At least 2
  },
  action: {
    cannot_share_facility?: boolean,
    cannot_share_activity?: boolean,
    cannot_be_consecutive?: boolean,  // In same facility
    required_gap_minutes?: number     // Between uses
  }
}
```

**Examples:**

```json
{
  "name": "Αετοί και Λύκοι: Ξεχωριστές εγκαταστάσεις",
  "type": "group_separation",
  "is_hard": true,
  "scope": {
    "group_ids": ["eagles-uuid", "wolves-uuid"]
  },
  "action": {
    "cannot_share_facility": true
  },
  "error_message": "Οι Αετοί και οι Λύκοι δεν μπορούν να μοιράζονται εγκαταστάσεις"
}
```

```json
{
  "name": "Διαφορετικές ηλικίες: 30' διαφορά",
  "type": "group_separation",
  "is_hard": false,
  "priority": 6,
  "scope": {
    "group_ids": ["juniors-uuid", "seniors-uuid"]
  },
  "action": {
    "cannot_be_consecutive": true,
    "required_gap_minutes": 30
  }
}
```

---

## Constraint Validation

### Server-Side Validation

When creating/updating constraints:

```typescript
interface ConstraintValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateConstraint(constraint: Constraint): ConstraintValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check required fields
  if (!constraint.name) errors.push("Name is required");
  if (!constraint.constraint_type) errors.push("Type is required");

  // 2. Validate scope references exist
  if (constraint.scope.activity_ids) {
    // Check activities exist
  }
  if (constraint.scope.facility_ids) {
    // Check facilities exist
  }

  // 3. Type-specific validation
  switch (constraint.constraint_type) {
    case 'time_restriction':
      if (!constraint.action.allowed_times && !constraint.action.blocked_times) {
        errors.push("Must specify allowed_times or blocked_times");
      }
      // Validate time format
      break;

    case 'sequence':
      if (!constraint.condition.after_tags && !constraint.condition.after_activity_ids) {
        errors.push("Must specify what comes before");
      }
      if (!constraint.action.next_should_have_tags && !constraint.action.next_should_be_activity_ids) {
        errors.push("Must specify what comes next");
      }
      break;

    // ... other types
  }

  // 4. Check for conflicts with existing constraints
  // e.g., two hard constraints that contradict each other

  // 5. Warnings
  if (constraint.is_hard && constraint.priority) {
    warnings.push("Hard constraints don't use priority");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## Constraint Evaluation

### During Schedule Generation

```typescript
interface ConstraintCheckResult {
  satisfied: boolean;
  violated_constraints: Array<{
    constraint_id: UUID;
    constraint_name: string;
    is_hard: boolean;
    priority: number;
    reason: string;
  }>;
  penalty_score: number;  // For soft constraints
}

async function checkConstraints(
  slot: ScheduleSlot,
  existingSlots: ScheduleSlot[],
  constraints: Constraint[]
): Promise<ConstraintCheckResult> {
  const violated: ConstraintCheckResult['violated_constraints'] = [];
  let penalty = 0;

  for (const constraint of constraints) {
    if (!constraint.is_active) continue;

    const result = await evaluateConstraint(constraint, slot, existingSlots);

    if (!result.satisfied) {
      if (constraint.is_hard) {
        // Hard constraint violated - reject immediately
        return {
          satisfied: false,
          violated_constraints: [{
            constraint_id: constraint.id,
            constraint_name: constraint.name,
            is_hard: true,
            priority: 10,
            reason: result.reason
          }],
          penalty_score: Infinity
        };
      } else {
        // Soft constraint violated - add penalty
        violated.push({
          constraint_id: constraint.id,
          constraint_name: constraint.name,
          is_hard: false,
          priority: constraint.priority,
          reason: result.reason
        });
        penalty += constraint.priority * 10;
      }
    }
  }

  return {
    satisfied: true,  // All hard constraints satisfied
    violated_constraints: violated,
    penalty_score: penalty
  };
}
```

### Constraint-Specific Evaluation

Each constraint type has its own evaluation logic:

```typescript
async function evaluateConstraint(
  constraint: Constraint,
  slot: ScheduleSlot,
  existingSlots: ScheduleSlot[]
): Promise<{ satisfied: boolean; reason?: string }> {

  switch (constraint.constraint_type) {
    case 'time_restriction':
      return evaluateTimeRestriction(constraint, slot);

    case 'sequence':
      return evaluateSequence(constraint, slot, existingSlots);

    case 'daily_limit':
      return evaluateDailyLimit(constraint, slot, existingSlots);

    // ... other types
  }
}

function evaluateTimeRestriction(
  constraint: Constraint,
  slot: ScheduleSlot
): { satisfied: boolean; reason?: string } {
  // Check if this constraint applies to this slot
  const applies = checkScope(constraint.scope, slot);
  if (!applies) return { satisfied: true };

  // Check time ranges
  const slotTime = slot.start_time;
  const allowedTimes = constraint.action.allowed_times || [];

  const inAllowedRange = allowedTimes.some(range =>
    slotTime >= range.start && slotTime < range.end
  );

  if (!inAllowedRange) {
    return {
      satisfied: false,
      reason: `${slot.activity.name} at ${slotTime} is outside allowed times`
    };
  }

  return { satisfied: true };
}
```

---

## Constraint Management UI

### UI Components Needed

1. **Constraint List**
   - Table view with filters
   - Active/inactive toggle
   - Hard/soft indicator
   - Quick edit/delete

2. **Constraint Builder**
   - Type selector
   - Scope builder (dropdowns for groups, activities, facilities)
   - Condition builder (dynamic based on type)
   - Action builder (dynamic based on type)
   - Preview of constraint in plain language

3. **Constraint Templates**
   - Pre-built common constraints
   - "Use this template" button
   - Customizable after creation

4. **Violation Viewer**
   - Shows constraint violations in schedule
   - Highlight affected slots
   - Suggestions for resolution

---

## Example Constraint Sets

### For Sports Camp

```typescript
const sportsCampConstraints = [
  {
    name: "Κολύμβηση μόνο πρωί",
    type: "time_restriction",
    is_hard: true,
    scope: { activity_tags: ["Υδάτινη"] },
    action: { allowed_times: [{ start: "09:00", end: "12:00" }] }
  },
  {
    name: "30' μετά από κολύμβηση πριν φαγητό",
    type: "gap_required",
    is_hard: true,
    condition: { after_tags: ["Υδάτινη"], before_slot_type: "meal" },
    action: { gap_minutes: 30 }
  },
  {
    name: "Μετά από έντονη, ήπια",
    type: "sequence",
    is_hard: false,
    priority: 8,
    condition: { after_tags: ["Έντονη"] },
    action: { next_should_have_tags: ["Ήπια"] }
  },
  {
    name: "Max 2 έντονες συνεχόμενα",
    type: "consecutive_limit",
    is_hard: true,
    condition: { activity_tags: ["Έντονη"] },
    action: { max_consecutive: 2 }
  }
];
```

### For Young Kids Camp

```typescript
const youngKidsConstraints = [
  {
    name: "Max 2 αθλητικές/μέρα",
    type: "daily_limit",
    is_hard: true,
    condition: { activity_tags: ["Αθλητική"] },
    action: { max_per_day: 2 }
  },
  {
    name: "Τουλάχιστον 1 δημιουργική/μέρα",
    type: "daily_minimum",
    is_hard: false,
    priority: 7,
    condition: { activity_tags: ["Δημιουργική"] },
    action: { min_per_day: 1 }
  },
  {
    name: "Όχι έντονες δραστηριότητες μετά τις 16:00",
    type: "time_restriction",
    is_hard: false,
    priority: 6,
    scope: { activity_tags: ["Έντονη"] },
    action: { allowed_times: [{ start: "09:00", end: "16:00" }] }
  }
];
```

---

## Testing Constraints

### Unit Tests

```typescript
describe('Constraint Validation', () => {
  test('time_restriction: rejects invalid time format', () => {
    const constraint = {
      type: 'time_restriction',
      action: { allowed_times: [{ start: '25:00', end: '12:00' }] }
    };
    expect(validateConstraint(constraint).valid).toBe(false);
  });

  test('sequence: requires after and next conditions', () => {
    const constraint = {
      type: 'sequence',
      condition: {},
      action: {}
    };
    expect(validateConstraint(constraint).valid).toBe(false);
  });
});

describe('Constraint Evaluation', () => {
  test('time_restriction: blocks activity outside allowed time', () => {
    const constraint = {
      type: 'time_restriction',
      scope: { activity_tags: ['Υδάτινη'] },
      action: { allowed_times: [{ start: '09:00', end: '12:00' }] }
    };
    const slot = {
      start_time: '14:00',
      activity: { tags: ['Υδάτινη'] }
    };
    expect(evaluateConstraint(constraint, slot, []).satisfied).toBe(false);
  });
});
```

---

## Performance Considerations

### Constraint Caching

```typescript
// Cache active constraints per session
const constraintCache = new Map<UUID, Constraint[]>();

async function getActiveConstraints(sessionId: UUID): Promise<Constraint[]> {
  if (!constraintCache.has(sessionId)) {
    const constraints = await db
      .from('constraints')
      .select('*')
      .or(`session_id.eq.${sessionId},organization_id.eq.${orgId}`)
      .eq('is_active', true);
    constraintCache.set(sessionId, constraints);
  }
  return constraintCache.get(sessionId)!;
}
```

### Indexing for Fast Evaluation

- Pre-compute which constraints apply to which activities/groups
- Build constraint dependency graph
- Evaluate independent constraints in parallel

---

## Future Extensions

### Advanced Constraint Types

1. **rotation_pattern**: Ensure groups rotate through activities fairly
2. **staff_preference**: Prefer certain staff for certain activities
3. **energy_curve**: Follow specific energy level pattern throughout day
4. **location_clustering**: Minimize transitions between distant facilities
5. **skill_progression**: Easier activities before harder ones
6. **social_mixing**: Encourage/require group interactions

### Constraint Learning

- Track which soft constraints are frequently violated
- Suggest adjusting priorities
- Learn from manual overrides

### Conflict Resolution

- Automatic suggestions when constraints conflict
- "Relax constraint X to satisfy Y?"
- Constraint negotiation wizard
