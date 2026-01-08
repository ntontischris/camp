// Conflict Detection System

import type { Database } from '@/lib/types/database';
import type { ConstraintContext, SlotAssignment } from './types';
import { evaluateConstraint } from './constraints';

type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  description: string;
  affectedSlots: string[];
  suggestion?: string;
}

export type ConflictType =
  | 'facility_double_booking'
  | 'staff_double_booking'
  | 'constraint_violation'
  | 'missing_facility'
  | 'missing_activity'
  | 'capacity_exceeded'
  | 'time_overlap';

export interface ConflictCheckInput {
  slots: ScheduleSlot[];
  constraints: Constraint[];
  activities: Activity[];
  facilities: Facility[];
  groups: Group[];
}

// Main conflict detection function
export function detectConflicts(input: ConflictCheckInput): Conflict[] {
  const conflicts: Conflict[] = [];

  // 1. Check facility double bookings
  conflicts.push(...detectFacilityConflicts(input.slots, input.facilities));

  // 2. Check constraint violations
  conflicts.push(...detectConstraintViolations(input));

  // 3. Check capacity issues
  conflicts.push(...detectCapacityIssues(input));

  // 4. Check missing assignments
  conflicts.push(...detectMissingAssignments(input.slots));

  return conflicts;
}

// Detect facility double bookings
function detectFacilityConflicts(slots: ScheduleSlot[], facilities: Facility[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const facilityMap = new Map(facilities.map(f => [f.id, f]));

  // Group slots by date, time, and facility
  const slotsByFacilityTime = new Map<string, ScheduleSlot[]>();

  for (const slot of slots) {
    if (!slot.facility_id) continue;

    const key = `${slot.date}_${slot.start_time.slice(0, 5)}_${slot.facility_id}`;
    if (!slotsByFacilityTime.has(key)) {
      slotsByFacilityTime.set(key, []);
    }
    slotsByFacilityTime.get(key)!.push(slot);
  }

  // Find conflicts
  for (const [key, slotsAtTime] of slotsByFacilityTime) {
    if (slotsAtTime.length > 1) {
      const [date, time, facilityId] = key.split('_');
      const facility = facilityMap.get(facilityId);

      conflicts.push({
        id: `facility_${key}`,
        type: 'facility_double_booking',
        severity: 'critical',
        message: `Διπλή κράτηση: ${facility?.name || 'Χώρος'}`,
        description: `${slotsAtTime.length} ομάδες στον ίδιο χώρο (${date} ${time})`,
        affectedSlots: slotsAtTime.map(s => s.id),
        suggestion: 'Άλλαξε τον χώρο σε μία από τις ομάδες ή μετακίνησε σε διαφορετική ώρα'
      });
    }
  }

  return conflicts;
}

// Detect constraint violations
function detectConstraintViolations(input: ConflictCheckInput): Conflict[] {
  const conflicts: Conflict[] = [];
  const activeConstraints = input.constraints.filter(c => c.is_active);

  // Build slot assignments for context
  const allSlots: SlotAssignment[] = input.slots.map(s => ({
    date: s.date,
    groupId: s.group_id || '',
    templateSlotId: s.day_template_slot_id || '',
    startTime: s.start_time,
    endTime: s.end_time,
    activityId: s.activity_id,
    facilityId: s.facility_id
  }));

  // Check each slot against each constraint
  for (const slot of input.slots) {
    if (!slot.activity_id || !slot.group_id) continue;

    const groupSlots = allSlots.filter(s => s.groupId === slot.group_id);
    const daySlots = groupSlots.filter(s => s.date === slot.date);

    const context: ConstraintContext = {
      sessionId: slot.session_id,
      date: slot.date,
      groupId: slot.group_id,
      activityId: slot.activity_id,
      facilityId: slot.facility_id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      allSlots,
      daySlots,
      groupSlots
    };

    for (const constraint of activeConstraints) {
      const result = evaluateConstraint(constraint, context);

      if (!result.satisfied) {
        conflicts.push({
          id: `constraint_${constraint.id}_${slot.id}`,
          type: 'constraint_violation',
          severity: constraint.is_hard ? 'critical' : 'warning',
          message: constraint.name,
          description: result.message || constraint.error_message || 'Παραβίαση περιορισμού',
          affectedSlots: [slot.id],
          suggestion: constraint.is_hard
            ? 'Αυστηρός περιορισμός - πρέπει να διορθωθεί'
            : 'Ευέλικτος περιορισμός - συνιστάται διόρθωση'
        });
      }
    }
  }

  return conflicts;
}

// Detect capacity issues
function detectCapacityIssues(input: ConflictCheckInput): Conflict[] {
  const conflicts: Conflict[] = [];
  const facilityMap = new Map(input.facilities.map(f => [f.id, f]));
  const groupMap = new Map(input.groups.map(g => [g.id, g]));

  for (const slot of input.slots) {
    if (!slot.facility_id || !slot.group_id) continue;

    const facility = facilityMap.get(slot.facility_id);
    const group = groupMap.get(slot.group_id);

    if (facility?.capacity && group?.current_count) {
      if (group.current_count > facility.capacity) {
        conflicts.push({
          id: `capacity_${slot.id}`,
          type: 'capacity_exceeded',
          severity: 'warning',
          message: `Υπέρβαση χωρητικότητας`,
          description: `Η ομάδα "${group.name}" (${group.current_count} άτομα) υπερβαίνει τη χωρητικότητα του "${facility.name}" (${facility.capacity})`,
          affectedSlots: [slot.id],
          suggestion: 'Επίλεξε χώρο με μεγαλύτερη χωρητικότητα ή μοίρασε την ομάδα'
        });
      }
    }
  }

  return conflicts;
}

// Detect missing assignments
function detectMissingAssignments(slots: ScheduleSlot[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const slot of slots) {
    if (!slot.activity_id) {
      conflicts.push({
        id: `missing_activity_${slot.id}`,
        type: 'missing_activity',
        severity: 'info',
        message: 'Χωρίς δραστηριότητα',
        description: 'Αυτό το slot δεν έχει ανατεθεί δραστηριότητα',
        affectedSlots: [slot.id],
        suggestion: 'Επίλεξε μια δραστηριότητα για αυτό το slot'
      });
    }
  }

  return conflicts;
}

// Get conflicts for a specific slot
export function getSlotConflicts(
  slotId: string,
  allConflicts: Conflict[]
): Conflict[] {
  return allConflicts.filter(c => c.affectedSlots.includes(slotId));
}

// Get conflict summary
export function getConflictSummary(conflicts: Conflict[]): {
  critical: number;
  warnings: number;
  info: number;
  total: number;
  byType: Record<ConflictType, number>;
} {
  const byType: Record<ConflictType, number> = {
    facility_double_booking: 0,
    staff_double_booking: 0,
    constraint_violation: 0,
    missing_facility: 0,
    missing_activity: 0,
    capacity_exceeded: 0,
    time_overlap: 0
  };

  let critical = 0;
  let warnings = 0;
  let info = 0;

  for (const conflict of conflicts) {
    byType[conflict.type]++;
    if (conflict.severity === 'critical') critical++;
    else if (conflict.severity === 'warning') warnings++;
    else info++;
  }

  return {
    critical,
    warnings,
    info,
    total: conflicts.length,
    byType
  };
}

// Check if schedule is valid (no critical conflicts)
export function isScheduleValid(conflicts: Conflict[]): boolean {
  return conflicts.filter(c => c.severity === 'critical').length === 0;
}
