# CampWise - Complete Project Specification

## Problem

Camp managers in Greece spend **20-40 hours/week** creating schedules with Excel/paper:
- Double-booking conflicts
- Unfair activity distribution
- Chaos when changes happen
- No visibility for staff/parents

## Solution

Intelligent scheduling platform that:
- Generates conflict-free schedules in minutes
- Guarantees fairness across groups
- Adapts to changes instantly
- Respects all defined constraints

## Market

| Segment | Count |
|---------|-------|
| Private camps | ~150 |
| Municipal KDAP | ~300 |
| School summer camps | ~200 |
| Sports camps | ~100 |
| **Total** | **~850** |

**Competition**: Zero in Greek market.
**First customer**: Already waiting (6-8 groups, ~10 activities, 2-week sessions)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router) |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand + React Query |
| Backend | Supabase |
| Scheduling | Google OR-Tools |
| Deploy | Vercel |

---

## Core Features

### 1. Multi-tenant Organizations
- Organizations with subscription tiers (free/basic/pro/enterprise)
- Users with roles: owner, admin, manager, instructor, viewer
- RLS security on all tables

### 2. Sessions
- Time periods (e.g., "July 1-15, 2025")
- Status: draft → planning → active → completed
- Settings per session

### 3. Groups
- Name, color, icon
- Age range (min/max)
- Capacity
- Primary supervisor

### 4. Facilities
- Name, capacity, indoor/outdoor
- Operating hours (recurring + specific dates)
- Equipment available
- Tags for categorization

### 5. Activities
- Duration, setup time, cleanup time
- Min/max participants
- Age restrictions
- Required staff count
- Required certifications
- Weather dependency
- Substitute activity (if weather bad)
- Tags: intensity, type, location

### 6. Staff
- Personal info, certifications
- Max hours/day, max hours/week
- Activity preferences (can lead, can assist)
- Availability (recurring + specific dates)

### 7. Flexible Day Templates
Each camp defines their own day structure:
```
"Normal Day":
09:00-09:45 | Activity 1
09:50-10:35 | Activity 2
10:35-11:00 | Break
11:00-11:45 | Activity 3
12:00-14:00 | Lunch
14:00-14:45 | Activity 4
...
```
- Multiple templates per org
- Override per specific date
- Slot types: activity, meal, break, rest, free, assembly

### 8. Tag System

Flexible labels for everything:

| Category | Examples |
|----------|----------|
| intensity | Έντονη, Ήπια, Μέτρια |
| type | Αθλητική, Δημιουργική, Εκπαιδευτική |
| location | Εσωτερική, Εξωτερική |
| weather | Χρειάζεται ήλιο, Ανεξάρτητη |
| certification | Ναυαγοσώστης, Α' Βοήθειες |

Tags used in constraints: "After [tag:Έντονη] do [tag:Ήπια]"

### 9. Constraint System

**10 constraint types:**

#### time_restriction
"Swimming only 09:00-12:00"
```json
{
  "type": "time_restriction",
  "scope": {"activity_tags": ["Υδάτινη"]},
  "action": {"allowed_times": [{"start": "09:00", "end": "12:00"}]}
}
```

#### sequence
"After intense, do calm"
```json
{
  "type": "sequence",
  "condition": {"after_tags": ["Έντονη"]},
  "action": {"next_should_have_tags": ["Ήπια"]}
}
```

#### daily_limit
"Max 2 athletic/day for young kids"
```json
{
  "type": "daily_limit",
  "scope": {"groups": {"age_max": 8}},
  "condition": {"activity_tags": ["Αθλητική"]},
  "action": {"max_per_day": 2}
}
```

#### daily_minimum
"At least 1 creative/day"
```json
{
  "type": "daily_minimum",
  "condition": {"activity_tags": ["Δημιουργική"]},
  "action": {"min_per_day": 1}
}
```

#### consecutive_limit
"Max 2 intense in a row"
```json
{
  "type": "consecutive_limit",
  "condition": {"activity_tags": ["Έντονη"]},
  "action": {"max_consecutive": 2}
}
```

#### staff_limit
"Lifeguard max 4 hours pool/day"
```json
{
  "type": "staff_limit",
  "scope": {"staff": ["staff-uuid"]},
  "condition": {"activity_tags": ["Υδάτινη"]},
  "action": {"max_hours_per_day": 4}
}
```

#### weather_substitute
"If rain, Football → Board Games"
```json
{
  "type": "weather_substitute",
  "scope": {"activity": "football-uuid"},
  "condition": {"weather": ["rainy", "stormy"]},
  "action": {"substitute_with": "board-games-uuid"}
}
```

#### facility_exclusive
"Pool: one activity at a time"
```json
{
  "type": "facility_exclusive",
  "scope": {"facility": "pool-uuid"},
  "action": {"no_parallel_activities": true}
}
```

#### gap_required
"30 min after swimming before meal"
```json
{
  "type": "gap_required",
  "condition": {"after_tags": ["Υδάτινη"], "before_slot_type": "meal"},
  "action": {"gap_minutes": 30}
}
```

#### group_separation
"Eagles and Wolves not together"
```json
{
  "type": "group_separation",
  "scope": {"groups": ["eagles-uuid", "wolves-uuid"]},
  "action": {"cannot_share_facility": true}
}
```

**Hard vs Soft:**
- Hard (is_hard: true): MUST satisfy
- Soft (is_hard: false): SHOULD satisfy if possible
- Priority 1-10 for soft constraints

### 10. Activity Requirements

"Each group must do Swimming 3x/week"
```json
{
  "activity_id": "swimming-uuid",
  "group_id": null,  // all groups
  "frequency_type": "per_week",
  "min_count": 3,
  "target_count": 3,
  "is_mandatory": true
}
```

### 11. Schedule Generation

**Algorithm:**
1. Constraint Solver (OR-Tools) finds all valid solutions
2. Scoring system ranks solutions
3. Best solution selected

**Scoring weights:**
| Criterion | Weight |
|-----------|--------|
| Fairness (equal distribution) | 30% |
| Variety (different activities/day) | 20% |
| Transitions (minimize location changes) | 15% |
| Energy balance (intensity variation) | 15% |
| Resource utilization | 10% |
| Preferences | 10% |

**Features:**
- Feasibility check before running
- Progress indicator
- Preview before applying
- Explain why something can't work

### 12. Calendar Views

- **Week**: All groups, one week
- **Day**: All groups, one day
- **Group**: One group, many days
- **Facility**: One facility usage
- **Staff**: One staff schedule

**Features:**
- Drag & drop
- Color coding
- Conflict indicators
- Quick actions

### 13. Export

- PDF (daily, weekly)
- Print-optimized
- Excel
- Per-group printouts

---

## Database Schema

### Core Tables

**organizations**
- id, name, slug, description
- logo_url, contact_email, contact_phone
- address, city, country, timezone
- subscription_tier, subscription_status
- settings (JSONB), metadata (JSONB)
- created_at, updated_at, deleted_at

**users**
- id (= auth.users.id), email, full_name
- avatar_url, phone, preferred_language
- last_login_at
- created_at, updated_at, deleted_at

**organization_members**
- id, organization_id, user_id
- role (owner/admin/manager/instructor/viewer)
- permissions (JSONB)
- invited_by, invited_at, accepted_at, is_active
- created_at, updated_at

**sessions**
- id, organization_id
- name, description
- start_date, end_date
- status (draft/planning/active/completed/cancelled)
- max_campers, current_campers
- settings (JSONB)
- created_by, created_at, updated_at, deleted_at

### Resource Tables

**tags**
- id, organization_id
- name, slug, category, color, icon
- description, sort_order, is_system
- created_at, updated_at, deleted_at

**facilities**
- id, organization_id
- name, code, description
- capacity, location, indoor
- has_equipment (JSONB)
- image_url, sort_order, is_active
- notes, metadata (JSONB)
- created_at, updated_at, deleted_at

**facility_tags** (junction)
- facility_id, tag_id, created_at

**facility_availability**
- id, facility_id
- day_of_week OR specific_date
- start_time, end_time
- is_available, reason
- created_at, updated_at

**activities**
- id, organization_id
- name, code, description
- duration_minutes, setup_minutes, cleanup_minutes
- min_participants, max_participants
- min_age, max_age
- required_staff_count
- required_certifications (TEXT[])
- required_equipment (JSONB)
- weather_dependent, allowed_weather (TEXT[])
- substitute_activity_id
- color, icon, image_url
- sort_order, is_active
- notes, metadata (JSONB)
- created_at, updated_at, deleted_at

**activity_tags** (junction)
- activity_id, tag_id, created_at

**activity_facility_requirements**
- id, activity_id
- facility_id OR facility_tag_id
- is_required, priority
- created_at

**staff**
- id, organization_id, user_id (nullable)
- employee_code, first_name, last_name
- email, phone, date_of_birth, hire_date
- role (instructor/supervisor/coordinator/support)
- certifications (TEXT[]), specialties (TEXT[])
- max_hours_per_day, max_hours_per_week
- hourly_rate
- emergency_contact_name, emergency_contact_phone
- photo_url, notes, is_active
- metadata (JSONB)
- created_at, updated_at, deleted_at

**staff_tags** (junction)
- staff_id, tag_id
- proficiency_level (1-5), certified_until
- created_at

**staff_activity_preferences**
- id, staff_id, activity_id
- can_lead, can_assist
- preference_level (1-5)
- max_consecutive_hours, notes
- created_at, updated_at

**staff_availability**
- id, staff_id, session_id (nullable)
- day_of_week OR specific_date
- start_time, end_time
- is_available
- availability_type (regular/vacation/sick/training)
- reason
- created_at, updated_at

**groups**
- id, session_id
- name, code, description
- color, icon
- age_min, age_max
- capacity, current_count
- gender (mixed/male/female)
- cabin_location
- primary_supervisor_id
- sort_order, is_active
- notes, metadata (JSONB)
- created_at, updated_at, deleted_at

**group_tags** (junction)
- group_id, tag_id, created_at

### Scheduling Tables

**day_templates**
- id, organization_id
- name, description
- is_default, total_activity_slots
- is_active
- created_at, updated_at, deleted_at

**day_template_slots**
- id, day_template_id
- name, start_time, end_time
- slot_type (activity/meal/break/rest/free/assembly/transition)
- is_schedulable, sort_order
- default_activity_id (nullable)
- metadata (JSONB)
- created_at

**session_day_overrides**
- id, session_id, date
- day_template_id (nullable)
- day_type (regular/half_day/theme_day/field_trip/event/holiday)
- name, description
- is_cancelled
- metadata (JSONB)
- created_at, updated_at

**schedule_slots**
- id, session_id
- date, day_template_slot_id
- start_time, end_time
- group_id, activity_id, facility_id
- status (draft/scheduled/in_progress/completed/cancelled/rescheduled)
- generation_method (manual/auto_generated/template/copy)
- generation_run_id
- is_locked
- original_activity_id, substitution_reason
- notes, metadata (JSONB)
- created_by
- created_at, updated_at

**schedule_slot_staff** (junction)
- id, schedule_slot_id, staff_id
- role (lead/assistant/supervisor)
- confirmed, confirmed_at
- notes
- created_at, updated_at

**schedule_generation_runs**
- id, session_id
- started_at, completed_at
- status (running/completed/failed/cancelled)
- date_from, date_to
- parameters (JSONB)
- result_summary (JSONB)
- slots_created, conflicts_found, constraints_violated
- error_message, error_details (JSONB)
- created_by, created_at

### Constraint Tables

**activity_requirements**
- id, session_id
- activity_id, group_id (nullable = all)
- frequency_type (per_day/per_week/per_session)
- min_count, max_count, target_count
- priority (1-10), is_mandatory
- preferred_times (JSONB)
- notes
- created_at, updated_at

**constraints**
- id, session_id (nullable), organization_id
- name, description
- constraint_type (enum of 10 types)
- is_hard, priority (1-10)
- is_active
- scope (JSONB), condition (JSONB), action (JSONB)
- error_message
- created_by
- created_at, updated_at, deleted_at

**constraint_violations_log**
- id, constraint_id, schedule_slot_id, generation_run_id
- violation_type (hard_violation/soft_violation/warning)
- severity (1-10), description
- context (JSONB)
- resolved, resolved_at, resolved_by
- resolution_notes
- created_at

### Support Tables

**weather_data**
- id, session_id, date
- time_of_day (morning/afternoon/evening/all_day)
- condition (sunny/cloudy/rainy/stormy/very_hot/very_cold)
- temperature_high, temperature_low
- precipitation_probability
- source (manual/api)
- api_response (JSONB)
- updated_at, created_at

**templates**
- id, organization_id
- name, description
- template_type (full_session/constraints/schedule_week/schedule_day)
- source_session_id
- data (JSONB)
- is_public, usage_count
- created_by
- created_at, updated_at, deleted_at

**notifications**
- id, organization_id, user_id
- type, title, message
- data (JSONB)
- is_read, read_at
- action_url, expires_at
- created_at

**audit_log**
- id, organization_id, user_id
- action, entity_type, entity_id
- old_values (JSONB), new_values (JSONB)
- ip_address, user_agent
- created_at

**schedule_versions**
- id, session_id
- version_number, name
- date_from, date_to
- snapshot_data (JSONB)
- statistics (JSONB)
- notes
- is_published, published_at
- created_by, created_at

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Next.js setup, Supabase, Auth
- Database migrations
- Basic CRUD for all entities
- RLS policies

### Phase 2: Scheduling Core (Week 3-4)
- Day templates
- Manual schedule creation
- Calendar view + drag & drop
- Conflict detection

### Phase 3: Auto-Scheduling (Week 5-6)
- Constraint UI
- OR-Tools integration
- Schedule generation
- Fairness optimization

### Phase 4: Polish (Week 7-8)
- Export/Print
- Staff features
- Weather integration
- First customer launch

---

## Critical Requirements

### Multi-Tenancy
- Every query scoped to organization
- RLS on all tables
- No data leakage

### Performance
- Index schedule_slots heavily
- Pagination everywhere

### Localization
- Greek UI
- DD/MM/YYYY dates
- Week starts Monday
- Europe/Athens timezone

### First Customer
- 6-8 groups
- ~10 activities
- 2-week sessions
- **Print-friendly output (CRITICAL)**

---

## Business Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | €0 | 1 session, 3 groups |
| Basic | €39/mo | 1 session, 5 groups |
| Pro | €79/mo | 3 sessions, 15 groups |
| Enterprise | €149/mo | Unlimited |