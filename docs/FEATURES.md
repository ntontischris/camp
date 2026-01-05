# Feature Specifications

Complete feature requirements for CampWise.

---

## 1. Authentication & Onboarding

### 1.1 User Registration

**Flow:**
1. Email + password signup via Supabase Auth
2. Email verification required
3. Create user profile
4. Redirect to organization setup

**Fields:**
- Email (required)
- Full name (required)
- Password (min 8 chars, required)
- Phone (optional)
- Preferred language (default: Greek)

**Validation:**
- Email format
- Strong password
- Unique email

### 1.2 Organization Setup

**For new organizations:**
1. Organization name
2. Slug (auto-generated, editable)
3. Type (private camp, municipal KDAP, school camp, sports camp)
4. Contact info (email, phone)
5. Address
6. Timezone (default: Europe/Athens)

**User becomes organization owner automatically**

### 1.3 Login

**Methods:**
- Email + password
- Password reset via email
- Remember me (30 days)

**Post-login:**
- If user has 1 org: go to that org's dashboard
- If user has multiple orgs: show org selector
- Update last_login_at

### 1.4 Organization Switching

**When user is member of multiple orgs:**
- Org switcher in top navigation
- Shows org name + role
- Switch without re-login
- Remembers last used org

---

## 2. Organization Management

### 2.1 Organization Settings

**Editable by: owner, admin**

**General:**
- Name, logo, description
- Contact email/phone
- Address, city, timezone

**Subscription:**
- Current tier (free/basic/pro/enterprise)
- Usage stats vs limits
- Upgrade/downgrade buttons
- Billing history (future)

**Settings:**
- Default session duration
- Default day template
- Week start day (Monday for Greece)
- Date format (DD/MM/YYYY)
- Time format (24-hour)

### 2.2 Team Management

**Member roles:**
- **Owner**: Full control, billing, delete org
- **Admin**: All features except billing
- **Manager**: Create/edit sessions, schedules, activities
- **Instructor**: View schedules, update assignments, mark attendance
- **Viewer**: Read-only access

**Features:**
- Invite by email
- Pending invitations list
- Resend invitation
- Remove member
- Change member role
- Deactivate/reactivate member

**Permissions matrix:**
| Feature | Owner | Admin | Manager | Instructor | Viewer |
|---------|-------|-------|---------|------------|--------|
| View everything | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit org settings | ✓ | ✓ | - | - | - |
| Manage members | ✓ | ✓ | - | - | - |
| Manage billing | ✓ | - | - | - | - |
| Create sessions | ✓ | ✓ | ✓ | - | - |
| Edit sessions | ✓ | ✓ | ✓ | - | - |
| Generate schedules | ✓ | ✓ | ✓ | - | - |
| Edit schedules | ✓ | ✓ | ✓ | ✓ | - |
| Manage activities | ✓ | ✓ | ✓ | - | - |
| Manage facilities | ✓ | ✓ | ✓ | - | - |
| Manage staff | ✓ | ✓ | ✓ | - | - |

---

## 3. Session Management

### 3.1 Create Session

**Required fields:**
- Name (e.g., "July 2025 - Week 1")
- Start date
- End date
- Status (default: draft)

**Optional fields:**
- Description
- Max campers
- Settings (JSONB):
  - Default day template ID
  - Allow weather-based substitutions
  - Auto-assign staff preferences
  - Notification settings

**Validations:**
- End date >= start date
- No overlapping sessions (warning, not error)
- Check subscription tier limits

### 3.2 Session Dashboard

**Shows:**
- Session info card
- Date range
- Status badge
- Quick stats:
  - Total groups
  - Total activities
  - Schedule completion %
  - Unassigned staff slots

**Actions:**
- Edit session
- Duplicate session
- Archive/delete session
- Change status

**Tabs:**
- Groups
- Schedule (calendar)
- Activities
- Constraints
- Reports

### 3.3 Session Status Workflow

**Draft** → **Planning** → **Active** → **Completed**

**Draft:**
- Can modify anything freely
- No constraints enforced
- Schedule not published

**Planning:**
- Constraints enforced
- Generate schedules
- Optimize and review
- Staff notifications sent

**Active:**
- Session is running
- Limited edits (only future dates)
- Track attendance
- Handle emergencies/substitutions

**Completed:**
- Read-only
- Export reports
- Archive data

**Transitions:**
- Draft → Planning: Validate minimum data (groups, activities, day template)
- Planning → Active: Requires published schedule
- Active → Completed: Manual or auto on end_date

---

## 4. Group Management

### 4.1 Create/Edit Groups

**Required:**
- Name (e.g., "Eagles", "Dolphins")
- Color (for calendar)

**Optional:**
- Code (e.g., "G1", "EAGL")
- Description
- Icon (emoji or icon name)
- Age min/max
- Capacity
- Current count
- Gender (mixed/male/female)
- Cabin location
- Primary supervisor (staff member)
- Tags
- Notes

**List view:**
- Table with all groups
- Sortable columns
- Filter by age, status
- Bulk actions

### 4.2 Group Details

**Overview:**
- Group info card
- Member list (future: camper management)
- Assigned supervisor
- Schedule preview (this week)

**Schedule tab:**
- Calendar filtered to this group
- All activities for date range
- Export group schedule

**Statistics:**
- Total activity hours
- Activity breakdown by type
- Facility usage
- Staff assignments

---

## 5. Activity Management

### 5.1 Activity Library

**Organization-level:**
- All activities available to org
- Reusable across sessions
- Soft delete (deleted_at)

**Views:**
- Card view (grid)
- Table view
- Filter by tag, type, active status
- Search by name

### 5.2 Create/Edit Activity

**Required:**
- Name (e.g., "Swimming", "Archery")
- Duration (minutes)

**Details:**
- Code
- Description
- Setup time (minutes)
- Cleanup time (minutes)
- Color, icon, image

**Participants:**
- Min participants
- Max participants
- Min age
- Max age

**Requirements:**
- Required staff count
- Required certifications (multi-select)
- Required equipment (JSON array)
- Facility requirements:
  - Specific facility OR
  - Any facility with tag (e.g., "Outdoor")

**Weather:**
- Weather dependent (yes/no)
- Allowed weather conditions (multi-select)
- Substitute activity (if weather is bad)

**Tags:**
- Intensity: Έντονη, Μέτρια, Ήπια
- Type: Αθλητική, Δημιουργική, Εκπαιδευτική, Υδάτινη
- Location: Εσωτερική, Εξωτερική
- Custom tags

**Activity Card Preview:**
```
[Icon] Swimming                    45 min
────────────────────────────────────────
Υδάτινη • Έντονη • Εξωτερική

👥 8-20 participants  |  Ages 8+
👨‍💼 2 staff (Ναυαγοσώστης required)
📍 Pool
☀️ Sunny, Cloudy only
⛈️ If rainy → Board Games

[Edit] [Duplicate] [Archive]
```

---

## 6. Facility Management

### 6.1 Facility Library

**List view:**
- All facilities
- Filter by indoor/outdoor, capacity
- Sort by name, capacity

### 6.2 Create/Edit Facility

**Basic:**
- Name (e.g., "Pool", "Soccer Field")
- Code
- Description
- Capacity (number of people)
- Location (text)
- Indoor (yes/no)
- Image

**Equipment:**
- JSON array of equipment
- Example: ["Soccer balls", "Goals", "Cones"]

**Tags:**
- For activity matching
- Example: "Outdoor", "Sports", "Water"

**Availability:**
- Default: available all time
- Can set:
  - Recurring: "Mon-Fri 09:00-17:00"
  - Specific dates: "Closed on 2025-07-04"

**Facility Card Preview:**
```
🏊 Pool                          Capacity: 30
────────────────────────────────────────
Indoor  |  Εξωτερική • Υδάτινη

Available:
 Mon-Sun: 09:00 - 18:00
 Closed: 2025-07-15 (Maintenance)

Equipment: Lane dividers, Diving board

[Edit] [Set Availability] [Delete]
```

---

## 7. Staff Management

### 7.1 Staff Directory

**Views:**
- Card view (with photos)
- Table view
- Filter by role, certifications, active status
- Search by name

### 7.2 Add/Edit Staff

**Basic:**
- Employee code
- First name, last name
- Email, phone
- Photo
- Date of birth
- Hire date
- Role (instructor/supervisor/coordinator/support)

**Qualifications:**
- Certifications (multi-select)
- Specialties (multi-select)
- Tags with proficiency level (1-5) and expiry date

**Availability:**
- Max hours/day
- Max hours/week
- Hourly rate (optional)
- Recurring availability (e.g., "Mon-Fri 08:00-16:00")
- Specific unavailability (vacation, sick days)

**Activity Preferences:**
- List of activities
- Can lead / Can assist
- Preference level (1-5)
- Max consecutive hours
- Notes

**Emergency Contact:**
- Name
- Phone

**Link to User:**
- Optionally link staff member to user account
- Allows them to log in and see their schedule

### 7.3 Staff Profile

**Overview:**
- Photo, name, role
- Certifications
- Contact info
- Availability summary

**Schedule:**
- Calendar of assigned activities
- Hours worked this week/month
- Upcoming assignments

**Activity History:**
- Past assignments
- Total hours by activity type
- Performance notes (future)

---

## 8. Day Templates

### 8.1 Template Library

**Shows:**
- All templates for organization
- Default template indicator
- Total slots per template
- Actions: edit, duplicate, set as default, delete

### 8.2 Create/Edit Template

**Basic:**
- Name (e.g., "Normal Day", "Half Day", "Field Trip Day")
- Description
- Is default

**Slots:**
- Add slot button
- Each slot:
  - Name (optional, e.g., "Activity 1", "Lunch")
  - Start time
  - End time
  - Slot type (activity/meal/break/rest/free/assembly/transition)
  - Is schedulable (for activities)
  - Default activity (optional)
  - Sort order

**Visual timeline:**
```
09:00 ──┬── Activity 1 (45 min) [Schedulable]
09:45   │
09:50 ──┼── Activity 2 (45 min) [Schedulable]
10:35   │
10:35 ──┼── Διάλειμμα (25 min) [Break]
11:00   │
11:00 ──┼── Activity 3 (45 min) [Schedulable]
11:45   │
12:00 ──┼── Μεσημεριανό (120 min) [Meal]
14:00   │
...
```

**Validations:**
- No time overlaps
- End time > start time
- Slots must be in chronological order

**Actions:**
- Duplicate slot
- Delete slot
- Reorder (drag & drop)

### 8.3 Session Day Overrides

**Override specific dates:**
- Select date
- Choose different template OR
- Set as special day type (half_day, field_trip, event, holiday)
- Mark as cancelled

**Use cases:**
- "2025-07-10: Half day template"
- "2025-07-15: Field trip to beach (no template)"
- "2025-07-20: Holiday (cancelled)"

---

## 9. Constraint Management

### 9.1 Constraint Library

**List view:**
- All constraints for session/org
- Columns: name, type, hard/soft, priority, active
- Filter by type, hard/soft, active
- Sort by priority, name

**Bulk actions:**
- Activate/deactivate multiple
- Delete multiple

### 9.2 Create Constraint Wizard

**Step 1: Choose type**
- 10 constraint types with descriptions
- Common use case examples

**Step 2: Define scope**
- What does this apply to?
- Dynamic form based on type
- Multi-select for groups, activities, facilities, staff

**Step 3: Set condition**
- When does this trigger?
- Dynamic form based on type

**Step 4: Define action**
- What should happen?
- Dynamic form based on type

**Step 5: Configure**
- Hard or soft constraint
- Priority (if soft)
- Custom error message
- Active status

**Preview:**
- Plain language summary
- "After activities tagged 'Έντονη', the next activity should be tagged 'Ήπια'"

### 9.3 Constraint Templates

**Pre-built constraints:**
- Swimming only in morning
- No intense activities after lunch
- Mandatory break after 3 hours
- Pool: one group at a time
- Weather substitutions
- Etc.

**Template gallery:**
- Browse by category
- Preview
- "Use this template" → opens prefilled wizard

---

## 10. Activity Requirements

### 10.1 Requirements List

**Per session:**
- Shows all activity requirements
- Group: All groups or specific group
- Activity: Which activity
- Frequency: per_day / per_week / per_session
- Target: How many times
- Mandatory indicator

### 10.2 Create Requirement

**Fields:**
- Activity (required)
- Group (optional = all groups)
- Frequency type (per_day/per_week/per_session)
- Min count (optional)
- Max count (optional)
- Target count (required)
- Priority (1-10)
- Is mandatory
- Preferred times (JSONB, optional)
- Notes

**Example:**
```
Activity: Swimming
Group: All groups
Frequency: Per week
Target: 3 times
Mandatory: Yes

→ "Each group must do Swimming 3 times per week"
```

**Bulk create:**
- Apply same requirement to multiple groups

---

## 11. Schedule Generation

### 11.1 Feasibility Check

**Before generating:**
- Analyze constraints
- Check resources (activities, facilities, staff)
- Validate requirements can be met
- Estimate time

**Report shows:**
✓ Groups: 6
✓ Activities: 12
✓ Facilities: 8
✓ Staff: 10
✓ Day template: Set
⚠️ Warning: Only 2 lifeguards for 6 groups
❌ Error: Swimming required 3x/week but pool available only 4 days

**Actions:**
- "Run anyway"
- "Fix issues first"

### 11.2 Generation Parameters

**Date range:**
- From date
- To date
- Or: "entire session"

**Options:**
- Use activity requirements: yes/no
- Enforce all hard constraints: yes (always)
- Try to satisfy soft constraints: yes/no
- Scoring weights (advanced):
  - Fairness: 30%
  - Variety: 20%
  - Transitions: 15%
  - Energy balance: 15%
  - Resource utilization: 10%
  - Preferences: 10%

**Lock existing slots:**
- "Don't change already scheduled slots"
- Or: "Regenerate everything"

### 11.3 Generation Progress

**Real-time updates:**
```
⏳ Generating schedule...

[████████░░░░░░░░░░░░] 40%

📊 Analyzing constraints... Done
🎯 Finding valid solutions... In progress
   - Checked 1,247 combinations
   - Found 89 valid solutions
   - Best score: 842/1000
⏱️ Estimated time: 2 minutes remaining
```

**Can cancel:**
- "Cancel" button
- Marks run as cancelled
- Rolls back changes

### 11.4 Results Preview

**Shows:**
- Summary statistics
- Slots created: 420
- Hard constraints violated: 0 ✓
- Soft constraints violated: 12
- Overall score: 842/1000

**Violation details:**
- List of soft constraints not satisfied
- Which slots
- Severity

**Preview calendar:**
- Shows generated schedule
- Color-coded by group/activity
- Can scroll through days

**Actions:**
- "Apply schedule" (saves to DB)
- "Discard and regenerate"
- "Adjust parameters and retry"

### 11.5 Post-Generation

**After applying:**
- All schedule_slots saved with generation_run_id
- Constraint violations logged
- Notification sent to team
- Can edit individual slots
- Can lock slots to prevent future regeneration

---

## 12. Calendar Views

### 12.1 Week View

**Layout:**
- Rows: Groups
- Columns: Days (Mon-Sun)
- Cells: Time slots with activities

**Features:**
- Navigate weeks (prev/next)
- Jump to date
- Color coding by group or activity
- Hover: show details
- Click: edit slot
- Drag & drop to reschedule

**Filters:**
- Show/hide groups
- Show/hide activity types
- Show only unassigned slots

**Visual indicators:**
- ⚠️ Conflict icon
- 🔒 Locked slot
- 👤 Missing staff assignment
- ☀️ Weather-dependent

### 12.2 Day View

**Layout:**
- All groups side-by-side
- Hourly timeline
- Activities as blocks

**Features:**
- Larger view than week view
- Better for fine-tuning one day
- Quick actions: duplicate day, clear day
- Print-friendly

### 12.3 Group View

**Layout:**
- Single group
- Multiple days (2 weeks)
- Timeline of activities

**Features:**
- See group's full schedule
- Identify gaps or imbalances
- Export as PDF for group leader
- Color code by activity type

### 12.4 Facility View

**Layout:**
- Single facility
- All groups using it
- Timeline showing occupancy

**Features:**
- Identify conflicts
- See utilization %
- Schedule maintenance downtime

### 12.5 Staff View

**Layout:**
- Single staff member
- All assignments
- Hours worked tracker

**Features:**
- Check workload
- Ensure breaks
- Confirm availability matches schedule
- Export for staff member

### 12.6 Universal Features

**All calendar views:**
- Export to PDF
- Export to Excel
- Print
- Share link (with permissions)
- Filter & search
- Zoom in/out timeline
- Show/hide weekends

---

## 13. Manual Schedule Editing

### 13.1 Create Slot

**Click empty time slot:**
- Opens modal
- Pre-filled: date, time, group
- Select: activity, facility
- Assign staff (multi-select)
- Notes
- Lock slot

**Validation:**
- Check hard constraints
- Warn about soft constraints
- Show conflicts (same facility, staff double-booked)

### 13.2 Edit Slot

**Click existing slot:**
- Opens modal with current values
- Can change: activity, facility, staff, times, notes
- Can lock/unlock
- Can mark as completed (future: attendance)

**Track changes:**
- Original activity shown if substituted
- Substitution reason field

### 13.3 Drag & Drop

**Drag slot to new time/group:**
- Real-time validation
- Drop zones highlighted (green = valid, red = conflict)
- On drop:
  - If valid: update immediately
  - If conflict: show warning, allow override or cancel

### 13.4 Bulk Operations

**Select multiple slots:**
- Checkbox on each slot
- Or: select range (shift+click)

**Actions:**
- Delete
- Lock/unlock
- Copy to another week
- Assign staff to all
- Change facility

### 13.5 Copy/Paste

**Copy day:**
- "Copy schedule for Monday"
- "Paste to Tuesday" → duplicates all slots

**Copy week:**
- "Copy week 1"
- "Paste to week 2" → duplicates entire week

**Smart paste:**
- Adjusts dates automatically
- Checks availability
- Warns about conflicts

---

## 14. Conflict Detection

### 14.1 Real-Time Validation

**When creating/editing slot:**
- Check immediately:
  - Facility not double-booked
  - Staff not double-booked
  - Group not double-booked
  - Hard constraints satisfied
  - Facility available at that time
  - Staff available at that time

**Visual feedback:**
- ✓ Green: All good
- ⚠️ Yellow: Soft constraint violated
- ❌ Red: Hard constraint violated / physical conflict

### 14.2 Conflict Indicators

**In calendar view:**
- ⚠️ icon on conflicted slot
- Red border
- Tooltip explains issue

**Conflict panel:**
- Sidebar showing all conflicts in current view
- Click to jump to conflicted slot
- Quick actions to resolve

### 14.3 Conflict Types

**Physical conflicts:**
- Same facility, overlapping times
- Same staff, overlapping times
- Same group, overlapping times

**Constraint violations:**
- Hard constraint not satisfied
- Soft constraint not satisfied (warning only)

**Resource conflicts:**
- Required staff unavailable
- Required facility unavailable
- Required certification missing

### 14.4 Conflict Resolution

**For each conflict:**
- Show explanation
- Suggest solutions:
  - "Move to different time"
  - "Use different facility"
  - "Assign different staff"
  - "Disable constraint"
- One-click apply suggestion

---

## 15. Staff Assignment

### 15.1 Auto-Assign Staff

**Based on:**
- Activity preferences (can_lead, can_assist)
- Certifications required
- Availability
- Current workload (balance hours)
- Max hours per day/week

**Algorithm:**
1. Find staff who can lead (if required)
2. Add assistants up to required count
3. Prefer staff with higher preference_level
4. Balance workload across all staff

**Conflict resolution:**
- If no staff available: flag slot as unassigned
- If only unpreferred staff available: assign but warn

### 15.2 Manual Assignment

**Click slot:**
- Shows current staff
- "Add staff" button
- Multi-select dropdown:
  - Filtered by: can lead/assist this activity
  - Shows: availability, current hours, certifications
- Choose role: lead/assistant/supervisor
- Save

**Staff dropdown preview:**
```
[Photo] John Doe
Instructor | Ναυαγοσώστης, Α' Βοήθειες
Available | 4/8 hours today
Preference: ⭐⭐⭐⭐⭐
```

### 15.3 Staff Confirmation

**Staff members can:**
- View their schedule
- Confirm assignments
- Request changes

**Manager sees:**
- ✓ Confirmed
- ⏳ Pending
- ❌ Declined

---

## 16. Weather Integration

### 16.1 Manual Weather Entry

**For each date:**
- Select condition (sunny/cloudy/rainy/stormy/very_hot/very_cold)
- Enter temp high/low
- Time of day (morning/afternoon/evening/all_day)

**Bulk entry:**
- "Set weather for week"
- Copy from last week

### 16.2 Weather-Based Substitutions

**Automatic:**
- When weather changes, system suggests substitutions
- Based on weather_substitute constraints
- Shows:
  - Original activity
  - Suggested substitute
  - Reason
- Batch approve/reject

**Manual:**
- Mark activity as "weather canceled"
- Choose substitute from list
- Update schedule

### 16.3 Future: API Integration

**Fetch from weather API:**
- Auto-populate forecasts
- Daily updates
- Alert if bad weather coming

---

## 17. Export & Print

### 17.1 PDF Export

**Options:**
- What: Day, week, full session, single group, single staff
- Format: Portrait/landscape
- Include: Photos, colors, notes
- Header: Organization logo, session name, date range

**Templates:**
- Master schedule (all groups, one week)
- Group schedule (one group, multiple days)
- Staff roster (all staff, one week)
- Daily activities (all groups, one day)
- Facility usage report

### 17.2 Excel Export

**Formats:**
- Schedule grid (groups × days)
- Activity list (flat table)
- Staff assignments (flat table)

**Includes:**
- All metadata (dates, times, durations)
- Staff names
- Facility names
- Notes

### 17.3 Print-Friendly View

**Optimized for:**
- A4 paper
- Black & white
- Large fonts
- Clear layout
- Page breaks at logical places

**Quick print:**
- "Print this week" button
- Opens print dialog
- No extra clicks

---

## 18. Reports & Analytics

### 18.1 Session Summary

**Statistics:**
- Total activities scheduled
- Total hours
- Activities per group (breakdown)
- Facility utilization %
- Staff hours worked
- Most/least used activities

**Charts:**
- Activity distribution pie chart
- Hours per day bar chart
- Facility usage timeline

### 18.2 Fairness Report

**Per group:**
- Total activities
- Activity breakdown by type
- Variety score
- Comparison to other groups

**Goal:**
- Ensure equal distribution
- Identify imbalances
- Suggest adjustments

### 18.3 Staff Workload Report

**Per staff:**
- Total hours worked
- Hours by activity
- Days worked
- Break time
- Utilization %

**Comparison:**
- Identify overworked/underutilized staff
- Balance assignments

### 18.4 Constraint Compliance

**Shows:**
- All constraints
- Satisfaction rate (% of slots)
- Violations list
- Recommendations

---

## 19. Notifications

### 19.1 Notification Types

**User notifications:**
- Invitation to organization
- Schedule published
- Assignment changed
- New session created
- Constraint violation

**In-app:**
- Bell icon with count
- Notification dropdown
- Click to view/action

**Email (optional):**
- Daily digest
- Immediate for critical

### 19.2 Notification Settings

**Per user:**
- Enable/disable by type
- Email vs in-app only
- Frequency (immediate, daily, weekly)

---

## 20. Templates & Reusability

### 20.1 Session Templates

**Save as template:**
- Entire session configuration
- Includes: groups, activities, constraints, day template
- Excludes: specific dates, schedule slots

**Use template:**
- "Create session from template"
- Select template
- Set new dates
- Customize as needed

### 20.2 Constraint Templates

**Organization library:**
- Saved constraint sets
- Apply to new sessions
- Share between sessions

**Public templates:**
- System-provided
- Best practices
- Curated examples

### 20.3 Schedule Templates

**Save week as template:**
- Pattern of activities
- Use for recurring schedules
- Apply to multiple weeks/sessions

---

## 21. Audit & History

### 21.1 Audit Log

**Tracks:**
- Who did what, when
- Entity type and ID
- Old vs new values
- IP address, user agent

**Accessible by:**
- Owners, admins

**Use cases:**
- Compliance
- Debugging
- Rollback

### 21.2 Schedule Versions

**Auto-save versions:**
- Before major changes
- Before generation run
- Manual snapshots

**Version list:**
- Date, author, notes
- Restore previous version
- Compare versions (diff)

---

## 22. Mobile Responsiveness

**All views must work on mobile:**
- Responsive layout
- Touch-friendly controls
- Simplified views for small screens
- Swipe gestures

**Priority views:**
- Staff: My schedule
- Manager: Today's schedule
- Instructor: My assignments

---

## 23. Localization (Greek)

**UI:**
- All text in Greek
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:MM)
- Week starts: Monday
- Timezone: Europe/Athens

**Terms:**
- Groups = Ομάδες
- Activities = Δραστηριότητες
- Facilities = Εγκαταστάσεις
- Staff = Προσωπικό
- Schedule = Πρόγραμμα
- Constraints = Περιορισμοί

**Future:**
- Multi-language support
- English as second language

---

## 24. Keyboard Shortcuts

**Global:**
- `/` - Search
- `?` - Show shortcuts
- `n` - New (context-aware)
- `Esc` - Close modal

**Calendar:**
- `←` `→` - Navigate days
- `[` `]` - Navigate weeks
- `Space` - Today
- `c` - Create slot
- `d` - Delete selected
- `l` - Lock selected

---

## 25. Search

**Global search:**
- Search bar in header
- Searches: groups, activities, facilities, staff, sessions
- Shows results by type
- Click to navigate

**Filters:**
- By entity type
- By session
- By date range

---

## Feature Priority Matrix

| Feature | Priority | Phase |
|---------|----------|-------|
| Auth & Onboarding | P0 | 1 |
| Organization Management | P0 | 1 |
| Session CRUD | P0 | 1 |
| Groups CRUD | P0 | 1 |
| Activities CRUD | P0 | 1 |
| Facilities CRUD | P0 | 1 |
| Staff CRUD | P0 | 1 |
| Day Templates | P0 | 2 |
| Manual Schedule Creation | P0 | 2 |
| Calendar Week View | P0 | 2 |
| Conflict Detection | P0 | 2 |
| Constraint System | P0 | 3 |
| Activity Requirements | P0 | 3 |
| Auto Schedule Generation | P0 | 3 |
| Staff Assignment | P1 | 3 |
| Calendar Day/Group/Facility Views | P1 | 3 |
| PDF Export | P0 | 4 |
| Weather Integration | P1 | 4 |
| Reports | P1 | 4 |
| Notifications | P2 | 4 |
| Templates | P2 | Future |
| Audit Log | P2 | Future |
| Mobile App | P3 | Future |
