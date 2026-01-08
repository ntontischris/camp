# Database Schema

Complete PostgreSQL schema for CampWise with RLS policies, indexes, and triggers.

## Setup

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Europe/Athens';
```

---

## Enums

```sql
-- Subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- User roles
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'instructor', 'viewer');

-- Session status
CREATE TYPE session_status AS ENUM ('draft', 'planning', 'active', 'completed', 'cancelled');

-- Staff roles
CREATE TYPE staff_role AS ENUM ('instructor', 'supervisor', 'coordinator', 'support');

-- Slot types
CREATE TYPE slot_type AS ENUM ('activity', 'meal', 'break', 'rest', 'free', 'assembly', 'transition');

-- Schedule status
CREATE TYPE schedule_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled');

-- Generation method
CREATE TYPE generation_method AS ENUM ('manual', 'auto_generated', 'template', 'copy');

-- Staff assignment role
CREATE TYPE staff_assignment_role AS ENUM ('lead', 'assistant', 'supervisor');

-- Gender
CREATE TYPE gender_type AS ENUM ('mixed', 'male', 'female');

-- Day type
CREATE TYPE day_type AS ENUM ('regular', 'half_day', 'theme_day', 'field_trip', 'event', 'holiday');

-- Weather condition
CREATE TYPE weather_condition AS ENUM ('sunny', 'cloudy', 'rainy', 'stormy', 'very_hot', 'very_cold');
CREATE TYPE time_of_day AS ENUM ('morning', 'afternoon', 'evening', 'all_day');

-- Constraint type
CREATE TYPE constraint_type AS ENUM (
  'time_restriction',
  'sequence',
  'daily_limit',
  'daily_minimum',
  'consecutive_limit',
  'staff_limit',
  'weather_substitute',
  'facility_exclusive',
  'gap_required',
  'group_separation'
);

-- Frequency type
CREATE TYPE frequency_type AS ENUM ('per_day', 'per_week', 'per_session');

-- Availability type
CREATE TYPE availability_type AS ENUM ('regular', 'vacation', 'sick', 'training');

-- Violation type
CREATE TYPE violation_type AS ENUM ('hard_violation', 'soft_violation', 'warning');

-- Template type
CREATE TYPE template_type AS ENUM ('full_session', 'constraints', 'schedule_week', 'schedule_day');

-- Generation run status
CREATE TYPE generation_run_status AS ENUM ('running', 'completed', 'failed', 'cancelled');
```

---

## Core Tables

### organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Contact
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'GR',
  timezone TEXT DEFAULT 'Europe/Athens',

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,

  -- Configuration
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
```

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'el',
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### organization_members

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role organization_role NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',

  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
```

### sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status session_status DEFAULT 'draft',

  max_campers INTEGER,
  current_campers INTEGER DEFAULT 0,

  settings JSONB DEFAULT '{}',

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_sessions_org_id ON sessions(organization_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_dates ON sessions(start_date, end_date);
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at) WHERE deleted_at IS NULL;
```

---

## Tag System

### tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL, -- 'intensity', 'type', 'location', 'weather', 'certification', etc
  color TEXT,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(organization_id, category, slug)
);

CREATE INDEX idx_tags_org_id ON tags(organization_id);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at) WHERE deleted_at IS NULL;
```

---

## Resource Tables

### facilities

```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  capacity INTEGER,
  location TEXT,
  indoor BOOLEAN DEFAULT false,

  has_equipment JSONB DEFAULT '[]',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_facilities_org_id ON facilities(organization_id);
CREATE INDEX idx_facilities_is_active ON facilities(is_active);
CREATE INDEX idx_facilities_deleted_at ON facilities(deleted_at) WHERE deleted_at IS NULL;
```

### facility_tags

```sql
CREATE TABLE facility_tags (
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (facility_id, tag_id)
);

CREATE INDEX idx_facility_tags_tag_id ON facility_tags(tag_id);
```

### facility_availability

```sql
CREATE TABLE facility_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,

  -- Either recurring or specific date
  day_of_week INTEGER, -- 1=Monday, 7=Sunday
  specific_date DATE,

  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT either_dow_or_date CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  ),
  CONSTRAINT valid_dow CHECK (day_of_week BETWEEN 1 AND 7)
);

CREATE INDEX idx_facility_avail_facility_id ON facility_availability(facility_id);
CREATE INDEX idx_facility_avail_date ON facility_availability(specific_date);
CREATE INDEX idx_facility_avail_dow ON facility_availability(day_of_week);
```

### activities

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  code TEXT,
  description TEXT,

  -- Duration
  duration_minutes INTEGER NOT NULL,
  setup_minutes INTEGER DEFAULT 0,
  cleanup_minutes INTEGER DEFAULT 0,

  -- Participants
  min_participants INTEGER,
  max_participants INTEGER,
  min_age INTEGER,
  max_age INTEGER,

  -- Staff requirements
  required_staff_count INTEGER DEFAULT 1,
  required_certifications TEXT[],
  required_equipment JSONB DEFAULT '[]',

  -- Weather
  weather_dependent BOOLEAN DEFAULT false,
  allowed_weather TEXT[],
  substitute_activity_id UUID REFERENCES activities(id),

  -- Display
  color TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_activities_org_id ON activities(organization_id);
CREATE INDEX idx_activities_is_active ON activities(is_active);
CREATE INDEX idx_activities_deleted_at ON activities(deleted_at) WHERE deleted_at IS NULL;
```

### activity_tags

```sql
CREATE TABLE activity_tags (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (activity_id, tag_id)
);

CREATE INDEX idx_activity_tags_tag_id ON activity_tags(tag_id);
```

### activity_facility_requirements

```sql
CREATE TABLE activity_facility_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,

  -- Either specific facility or any with a tag
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  facility_tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  is_required BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT either_facility_or_tag CHECK (
    (facility_id IS NOT NULL AND facility_tag_id IS NULL) OR
    (facility_id IS NULL AND facility_tag_id IS NOT NULL)
  )
);

CREATE INDEX idx_activity_facility_req_activity ON activity_facility_requirements(activity_id);
CREATE INDEX idx_activity_facility_req_facility ON activity_facility_requirements(facility_id);
```

---

## Staff Tables

### staff

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  employee_code TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  hire_date DATE,

  role staff_role DEFAULT 'instructor',
  certifications TEXT[],
  specialties TEXT[],

  max_hours_per_day DECIMAL(4,2),
  max_hours_per_week DECIMAL(5,2),
  hourly_rate DECIMAL(8,2),

  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_org_id ON staff(organization_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_is_active ON staff(is_active);
CREATE INDEX idx_staff_deleted_at ON staff(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_staff_employee_code ON staff(organization_id, employee_code) WHERE employee_code IS NOT NULL;
```

### staff_tags

```sql
CREATE TABLE staff_tags (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  certified_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (staff_id, tag_id)
);

CREATE INDEX idx_staff_tags_tag_id ON staff_tags(tag_id);
```

### staff_activity_preferences

```sql
CREATE TABLE staff_activity_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,

  can_lead BOOLEAN DEFAULT false,
  can_assist BOOLEAN DEFAULT true,
  preference_level INTEGER CHECK (preference_level BETWEEN 1 AND 5),
  max_consecutive_hours DECIMAL(4,2),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(staff_id, activity_id)
);

CREATE INDEX idx_staff_activity_pref_staff ON staff_activity_preferences(staff_id);
CREATE INDEX idx_staff_activity_pref_activity ON staff_activity_preferences(activity_id);
```

### staff_availability

```sql
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

  -- Either recurring or specific date
  day_of_week INTEGER, -- 1=Monday, 7=Sunday
  specific_date DATE,

  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  availability_type availability_type DEFAULT 'regular',
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT either_dow_or_date_staff CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  ),
  CONSTRAINT valid_dow_staff CHECK (day_of_week BETWEEN 1 AND 7)
);

CREATE INDEX idx_staff_avail_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_avail_session_id ON staff_availability(session_id);
CREATE INDEX idx_staff_avail_date ON staff_availability(specific_date);
CREATE INDEX idx_staff_avail_dow ON staff_availability(day_of_week);
```

---

## Groups

### groups

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  color TEXT,
  icon TEXT,

  age_min INTEGER,
  age_max INTEGER,
  capacity INTEGER,
  current_count INTEGER DEFAULT 0,
  gender gender_type DEFAULT 'mixed',
  cabin_location TEXT,

  primary_supervisor_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_groups_session_id ON groups(session_id);
CREATE INDEX idx_groups_supervisor ON groups(primary_supervisor_id);
CREATE INDEX idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;
```

### group_tags

```sql
CREATE TABLE group_tags (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (group_id, tag_id)
);

CREATE INDEX idx_group_tags_tag_id ON group_tags(tag_id);
```

---

## Scheduling Tables

### day_templates

```sql
CREATE TABLE day_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  total_activity_slots INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_day_templates_org_id ON day_templates(organization_id);
CREATE INDEX idx_day_templates_is_default ON day_templates(is_default);
CREATE INDEX idx_day_templates_deleted_at ON day_templates(deleted_at) WHERE deleted_at IS NULL;
```

### day_template_slots

```sql
CREATE TABLE day_template_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_template_id UUID NOT NULL REFERENCES day_templates(id) ON DELETE CASCADE,

  name TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type slot_type NOT NULL,
  is_schedulable BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  default_activity_id UUID REFERENCES activities(id),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_day_template_slots_template ON day_template_slots(day_template_id);
CREATE INDEX idx_day_template_slots_type ON day_template_slots(slot_type);
CREATE INDEX idx_day_template_slots_order ON day_template_slots(day_template_id, sort_order);
```

### session_day_overrides

```sql
CREATE TABLE session_day_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  day_template_id UUID REFERENCES day_templates(id),
  day_type day_type DEFAULT 'regular',
  name TEXT,
  description TEXT,
  is_cancelled BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, date)
);

CREATE INDEX idx_session_day_overrides_session ON session_day_overrides(session_id);
CREATE INDEX idx_session_day_overrides_date ON session_day_overrides(date);
```

### schedule_slots

```sql
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  day_template_slot_id UUID REFERENCES day_template_slots(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,

  status schedule_status DEFAULT 'draft',
  generation_method generation_method DEFAULT 'manual',
  generation_run_id UUID REFERENCES schedule_generation_runs(id),

  is_locked BOOLEAN DEFAULT false,
  original_activity_id UUID REFERENCES activities(id),
  substitution_reason TEXT,

  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical indexes for performance
CREATE INDEX idx_schedule_slots_session ON schedule_slots(session_id);
CREATE INDEX idx_schedule_slots_date ON schedule_slots(date);
CREATE INDEX idx_schedule_slots_group ON schedule_slots(group_id);
CREATE INDEX idx_schedule_slots_activity ON schedule_slots(activity_id);
CREATE INDEX idx_schedule_slots_facility ON schedule_slots(facility_id);
CREATE INDEX idx_schedule_slots_status ON schedule_slots(status);
CREATE INDEX idx_schedule_slots_session_date ON schedule_slots(session_id, date);
CREATE INDEX idx_schedule_slots_date_group ON schedule_slots(date, group_id);
CREATE INDEX idx_schedule_slots_facility_date ON schedule_slots(facility_id, date, start_time);
```

### schedule_slot_staff

```sql
CREATE TABLE schedule_slot_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_slot_id UUID NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  role staff_assignment_role DEFAULT 'assistant',
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_slot_staff_slot ON schedule_slot_staff(schedule_slot_id);
CREATE INDEX idx_schedule_slot_staff_staff ON schedule_slot_staff(staff_id);
CREATE UNIQUE INDEX idx_schedule_slot_staff_unique ON schedule_slot_staff(schedule_slot_id, staff_id);
```

### schedule_generation_runs

```sql
CREATE TABLE schedule_generation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status generation_run_status DEFAULT 'running',

  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  parameters JSONB DEFAULT '{}',

  result_summary JSONB DEFAULT '{}',
  slots_created INTEGER DEFAULT 0,
  conflicts_found INTEGER DEFAULT 0,
  constraints_violated INTEGER DEFAULT 0,

  error_message TEXT,
  error_details JSONB,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generation_runs_session ON schedule_generation_runs(session_id);
CREATE INDEX idx_generation_runs_status ON schedule_generation_runs(status);
CREATE INDEX idx_generation_runs_created_at ON schedule_generation_runs(created_at DESC);
```

---

## Constraint Tables

### activity_requirements

```sql
CREATE TABLE activity_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- NULL = all groups

  frequency_type frequency_type NOT NULL,
  min_count INTEGER,
  max_count INTEGER,
  target_count INTEGER NOT NULL,

  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  is_mandatory BOOLEAN DEFAULT true,

  preferred_times JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_req_session ON activity_requirements(session_id);
CREATE INDEX idx_activity_req_activity ON activity_requirements(activity_id);
CREATE INDEX idx_activity_req_group ON activity_requirements(group_id);
```

### constraints

```sql
CREATE TABLE constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  constraint_type constraint_type NOT NULL,

  is_hard BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  is_active BOOLEAN DEFAULT true,

  scope JSONB DEFAULT '{}',
  condition JSONB DEFAULT '{}',
  action JSONB DEFAULT '{}',

  error_message TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT either_session_or_org CHECK (
    (session_id IS NOT NULL AND organization_id IS NULL) OR
    (session_id IS NULL AND organization_id IS NOT NULL)
  )
);

CREATE INDEX idx_constraints_session ON constraints(session_id);
CREATE INDEX idx_constraints_org ON constraints(organization_id);
CREATE INDEX idx_constraints_type ON constraints(constraint_type);
CREATE INDEX idx_constraints_active ON constraints(is_active);
CREATE INDEX idx_constraints_deleted_at ON constraints(deleted_at) WHERE deleted_at IS NULL;
```

### constraint_violations_log

```sql
CREATE TABLE constraint_violations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  constraint_id UUID REFERENCES constraints(id) ON DELETE CASCADE,
  schedule_slot_id UUID REFERENCES schedule_slots(id) ON DELETE CASCADE,
  generation_run_id UUID REFERENCES schedule_generation_runs(id) ON DELETE CASCADE,

  violation_type violation_type NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 10),
  description TEXT NOT NULL,
  context JSONB DEFAULT '{}',

  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_violations_constraint ON constraint_violations_log(constraint_id);
CREATE INDEX idx_violations_slot ON constraint_violations_log(schedule_slot_id);
CREATE INDEX idx_violations_run ON constraint_violations_log(generation_run_id);
CREATE INDEX idx_violations_resolved ON constraint_violations_log(resolved);
CREATE INDEX idx_violations_created_at ON constraint_violations_log(created_at DESC);
```

---

## Support Tables

### weather_data

```sql
CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_of_day time_of_day DEFAULT 'all_day',

  condition weather_condition NOT NULL,
  temperature_high INTEGER,
  temperature_low INTEGER,
  precipitation_probability INTEGER,

  source TEXT DEFAULT 'manual',
  api_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, date, time_of_day)
);

CREATE INDEX idx_weather_session ON weather_data(session_id);
CREATE INDEX idx_weather_date ON weather_data(date);
```

### templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  template_type template_type NOT NULL,
  source_session_id UUID REFERENCES sessions(id),

  data JSONB NOT NULL,

  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_templates_org ON templates(organization_id);
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_templates_deleted_at ON templates(deleted_at) WHERE deleted_at IS NULL;
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  old_values JSONB,
  new_values JSONB,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
```

### schedule_versions

```sql
CREATE TABLE schedule_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,
  name TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,

  snapshot_data JSONB NOT NULL,
  statistics JSONB DEFAULT '{}',
  notes TEXT,

  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_versions_session ON schedule_versions(session_id);
CREATE INDEX idx_schedule_versions_published ON schedule_versions(is_published);
CREATE INDEX idx_schedule_versions_created_at ON schedule_versions(created_at DESC);
```

---

## Triggers

### Updated At Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON facility_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff_activity_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON day_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON session_day_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON schedule_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON schedule_slot_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON activity_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON weather_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_facility_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_template_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_day_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slot_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_violations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_versions ENABLE ROW LEVEL SECURITY;
```

### Helper Function for Organization Access

```sql
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_org_role(org_id UUID)
RETURNS organization_role AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

```sql
-- organizations: Users can view orgs they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (user_has_org_access(id));

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update orgs where they're owner/admin
CREATE POLICY "Owners/admins can update organizations"
  ON organizations FOR UPDATE
  USING (user_org_role(id) IN ('owner', 'admin'));

-- users: Users can view themselves
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- organization_members: Users can view members of their orgs
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    user_has_org_access(organization_id)
    AND is_active = true
  );

CREATE POLICY "Users can insert themselves as members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners/admins can manage members"
  ON organization_members FOR UPDATE
  USING (
    user_org_role(organization_id) IN ('owner', 'admin')
  );

-- sessions: Users can view sessions in their orgs
CREATE POLICY "Users can view sessions"
  ON sessions FOR SELECT
  USING (user_has_org_access(organization_id) AND deleted_at IS NULL);

CREATE POLICY "Managers+ can manage sessions"
  ON sessions FOR ALL
  USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- Apply similar policies to all other tables
-- Pattern: SELECT for all members, INSERT/UPDATE/DELETE for appropriate roles

-- tags
CREATE POLICY "Users can view tags" ON tags FOR SELECT USING (user_has_org_access(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage tags" ON tags FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- facilities
CREATE POLICY "Users can view facilities" ON facilities FOR SELECT USING (user_has_org_access(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage facilities" ON facilities FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- facility_tags
CREATE POLICY "Users can view facility_tags" ON facility_tags FOR SELECT USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id = facility_id AND user_has_org_access(f.organization_id)));
CREATE POLICY "Managers+ can manage facility_tags" ON facility_tags FOR ALL USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id = facility_id AND user_org_role(f.organization_id) IN ('owner', 'admin', 'manager')));

-- facility_availability
CREATE POLICY "Users can view facility_availability" ON facility_availability FOR SELECT USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id = facility_id AND user_has_org_access(f.organization_id)));
CREATE POLICY "Managers+ can manage facility_availability" ON facility_availability FOR ALL USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id = facility_id AND user_org_role(f.organization_id) IN ('owner', 'admin', 'manager')));

-- activities
CREATE POLICY "Users can view activities" ON activities FOR SELECT USING (user_has_org_access(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage activities" ON activities FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- activity_tags
CREATE POLICY "Users can view activity_tags" ON activity_tags FOR SELECT USING (EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND user_has_org_access(a.organization_id)));
CREATE POLICY "Managers+ can manage activity_tags" ON activity_tags FOR ALL USING (EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND user_org_role(a.organization_id) IN ('owner', 'admin', 'manager')));

-- activity_facility_requirements
CREATE POLICY "Users can view activity_facility_requirements" ON activity_facility_requirements FOR SELECT USING (EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND user_has_org_access(a.organization_id)));
CREATE POLICY "Managers+ can manage activity_facility_requirements" ON activity_facility_requirements FOR ALL USING (EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND user_org_role(a.organization_id) IN ('owner', 'admin', 'manager')));

-- staff
CREATE POLICY "Users can view staff" ON staff FOR SELECT USING (user_has_org_access(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage staff" ON staff FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- staff_tags
CREATE POLICY "Users can view staff_tags" ON staff_tags FOR SELECT USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage staff_tags" ON staff_tags FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- staff_activity_preferences
CREATE POLICY "Users can view staff_activity_preferences" ON staff_activity_preferences FOR SELECT USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage staff_activity_preferences" ON staff_activity_preferences FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- staff_availability
CREATE POLICY "Users can view staff_availability" ON staff_availability FOR SELECT USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Staff can manage their own availability" ON staff_availability FOR ALL USING (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND (s.user_id = auth.uid() OR user_org_role(s.organization_id) IN ('owner', 'admin', 'manager'))));

-- groups
CREATE POLICY "Users can view groups" ON groups FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage groups" ON groups FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- group_tags
CREATE POLICY "Users can view group_tags" ON group_tags FOR SELECT USING (EXISTS (SELECT 1 FROM groups g JOIN sessions s ON g.session_id = s.id WHERE g.id = group_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage group_tags" ON group_tags FOR ALL USING (EXISTS (SELECT 1 FROM groups g JOIN sessions s ON g.session_id = s.id WHERE g.id = group_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- day_templates
CREATE POLICY "Users can view day_templates" ON day_templates FOR SELECT USING (user_has_org_access(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage day_templates" ON day_templates FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- day_template_slots
CREATE POLICY "Users can view day_template_slots" ON day_template_slots FOR SELECT USING (EXISTS (SELECT 1 FROM day_templates dt WHERE dt.id = day_template_id AND user_has_org_access(dt.organization_id)));
CREATE POLICY "Managers+ can manage day_template_slots" ON day_template_slots FOR ALL USING (EXISTS (SELECT 1 FROM day_templates dt WHERE dt.id = day_template_id AND user_org_role(dt.organization_id) IN ('owner', 'admin', 'manager')));

-- session_day_overrides
CREATE POLICY "Users can view session_day_overrides" ON session_day_overrides FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage session_day_overrides" ON session_day_overrides FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- schedule_slots
CREATE POLICY "Users can view schedule_slots" ON schedule_slots FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage schedule_slots" ON schedule_slots FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager', 'instructor')));

-- schedule_slot_staff
CREATE POLICY "Users can view schedule_slot_staff" ON schedule_slot_staff FOR SELECT USING (EXISTS (SELECT 1 FROM schedule_slots ss JOIN sessions s ON ss.session_id = s.id WHERE ss.id = schedule_slot_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage schedule_slot_staff" ON schedule_slot_staff FOR ALL USING (EXISTS (SELECT 1 FROM schedule_slots ss JOIN sessions s ON ss.session_id = s.id WHERE ss.id = schedule_slot_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager', 'instructor')));

-- schedule_generation_runs
CREATE POLICY "Users can view schedule_generation_runs" ON schedule_generation_runs FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage schedule_generation_runs" ON schedule_generation_runs FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- activity_requirements
CREATE POLICY "Users can view activity_requirements" ON activity_requirements FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage activity_requirements" ON activity_requirements FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- constraints
CREATE POLICY "Users can view constraints" ON constraints FOR SELECT USING (
  (session_id IS NOT NULL AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)))
  OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) AND deleted_at IS NULL;
CREATE POLICY "Managers+ can manage constraints" ON constraints FOR ALL USING (
  (session_id IS NOT NULL AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')))
  OR (organization_id IS NOT NULL AND user_org_role(organization_id) IN ('owner', 'admin', 'manager'))
);

-- constraint_violations_log
CREATE POLICY "Users can view constraint_violations_log" ON constraint_violations_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM schedule_slots ss JOIN sessions s ON ss.session_id = s.id WHERE ss.id = schedule_slot_id AND user_has_org_access(s.organization_id))
);
CREATE POLICY "Managers+ can manage constraint_violations_log" ON constraint_violations_log FOR ALL USING (
  EXISTS (SELECT 1 FROM schedule_slots ss JOIN sessions s ON ss.session_id = s.id WHERE ss.id = schedule_slot_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager'))
);

-- weather_data
CREATE POLICY "Users can view weather_data" ON weather_data FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage weather_data" ON weather_data FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));

-- templates
CREATE POLICY "Users can view templates" ON templates FOR SELECT USING ((is_public = true OR user_has_org_access(organization_id)) AND deleted_at IS NULL);
CREATE POLICY "Managers+ can manage templates" ON templates FOR ALL USING (user_org_role(organization_id) IN ('owner', 'admin', 'manager'));

-- notifications
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- audit_log
CREATE POLICY "Admins can view audit_log" ON audit_log FOR SELECT USING (user_org_role(organization_id) IN ('owner', 'admin'));

-- schedule_versions
CREATE POLICY "Users can view schedule_versions" ON schedule_versions FOR SELECT USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_has_org_access(s.organization_id)));
CREATE POLICY "Managers+ can manage schedule_versions" ON schedule_versions FOR ALL USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND user_org_role(s.organization_id) IN ('owner', 'admin', 'manager')));
```

---

## Initial Data

### System Tags (Greek)

```sql
INSERT INTO tags (id, organization_id, name, slug, category, color, is_system) VALUES
-- These would be created per organization, example:
-- Intensity
(uuid_generate_v4(), NULL, 'Έντονη', 'entoni', 'intensity', '#ef4444', true),
(uuid_generate_v4(), NULL, 'Μέτρια', 'metria', 'intensity', '#f59e0b', true),
(uuid_generate_v4(), NULL, 'Ήπια', 'ipia', 'intensity', '#10b981', true),
-- Type
(uuid_generate_v4(), NULL, 'Αθλητική', 'athlitiki', 'type', '#3b82f6', true),
(uuid_generate_v4(), NULL, 'Δημιουργική', 'dimioyrgiki', 'type', '#8b5cf6', true),
(uuid_generate_v4(), NULL, 'Εκπαιδευτική', 'ekpaideftiki', 'type', '#06b6d4', true),
(uuid_generate_v4(), NULL, 'Υδάτινη', 'ydatini', 'type', '#0ea5e9', true);
-- Note: In practice, these would be organization-specific
```

---

## Performance Optimization

### Additional Indexes for Complex Queries

```sql
-- Composite indexes for common queries
CREATE INDEX idx_schedule_slots_lookup ON schedule_slots(session_id, date, group_id, start_time);
CREATE INDEX idx_staff_schedule_lookup ON schedule_slot_staff(staff_id, schedule_slot_id);

-- Partial indexes for active records
CREATE INDEX idx_facilities_active ON facilities(organization_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_activities_active ON activities(organization_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_staff_active ON staff(organization_id) WHERE is_active = true AND deleted_at IS NULL;
```

### Materialized View for Schedule Statistics (Optional)

```sql
CREATE MATERIALIZED VIEW schedule_statistics AS
SELECT
  ss.session_id,
  ss.date,
  ss.group_id,
  COUNT(DISTINCT ss.activity_id) as unique_activities,
  COUNT(*) as total_slots,
  COUNT(DISTINCT ss.facility_id) as facilities_used,
  COUNT(DISTINCT sss.staff_id) as staff_assigned
FROM schedule_slots ss
LEFT JOIN schedule_slot_staff sss ON ss.id = sss.schedule_slot_id
GROUP BY ss.session_id, ss.date, ss.group_id;

CREATE UNIQUE INDEX idx_schedule_stats ON schedule_statistics(session_id, date, group_id);
```

---

## Migration Script

To run this schema:

```bash
# Save all SQL to migrations/001_initial_schema.sql
# Then apply:
psql -h localhost -p 54322 -U postgres -d postgres < migrations/001_initial_schema.sql
```

Or with Supabase CLI:

```bash
supabase db reset
supabase migration new initial_schema
# Paste SQL into the created migration file
supabase db push
```
