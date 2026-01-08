// Staff Assignment System

import type { Database } from '@/lib/types/database';

type Staff = Database['public']['Tables']['staff']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];

export interface StaffAssignment {
  id?: string;
  scheduleSlotId: string;
  staffId: string;
  role: 'lead' | 'assistant' | 'supervisor';
}

export interface StaffWorkload {
  staffId: string;
  staffName: string;
  totalSlots: number;
  slotsByDay: Map<string, number>;
  slotsByActivity: Map<string, number>;
  hoursPerDay: Map<string, number>;
  totalHours: number;
}

export interface AutoAssignResult {
  assignments: StaffAssignment[];
  unassignedSlots: string[];
  warnings: string[];
}

// Calculate staff workload
export function calculateStaffWorkload(
  staff: Staff,
  assignments: StaffAssignment[],
  slots: ScheduleSlot[],
  activities: Activity[]
): StaffWorkload {
  const staffAssignments = assignments.filter(a => a.staffId === staff.id);
  const slotMap = new Map(slots.map(s => [s.id, s]));
  const activityMap = new Map(activities.map(a => [a.id, a]));

  const slotsByDay = new Map<string, number>();
  const slotsByActivity = new Map<string, number>();
  const hoursPerDay = new Map<string, number>();
  let totalHours = 0;

  for (const assignment of staffAssignments) {
    const slot = slotMap.get(assignment.scheduleSlotId);
    if (!slot) continue;

    // Count by day
    slotsByDay.set(slot.date, (slotsByDay.get(slot.date) || 0) + 1);

    // Count by activity
    if (slot.activity_id) {
      const activityName = activityMap.get(slot.activity_id)?.name || slot.activity_id;
      slotsByActivity.set(activityName, (slotsByActivity.get(activityName) || 0) + 1);
    }

    // Calculate hours
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const hours = (endMinutes - startMinutes) / 60;
    hoursPerDay.set(slot.date, (hoursPerDay.get(slot.date) || 0) + hours);
    totalHours += hours;
  }

  return {
    staffId: staff.id,
    staffName: `${staff.first_name} ${staff.last_name}`,
    totalSlots: staffAssignments.length,
    slotsByDay,
    slotsByActivity,
    hoursPerDay,
    totalHours
  };
}

// Auto-assign staff to slots
export function autoAssignStaff(
  slots: ScheduleSlot[],
  staff: Staff[],
  activities: Activity[],
  existingAssignments: StaffAssignment[],
  options: {
    maxHoursPerDay?: number;
    preferSpecialists?: boolean;
    balanceWorkload?: boolean;
  } = {}
): AutoAssignResult {
  const {
    maxHoursPerDay = 8,
    balanceWorkload = true
  } = options;

  const assignments: StaffAssignment[] = [...existingAssignments];
  const unassignedSlots: string[] = [];
  const warnings: string[] = [];

  const activityMap = new Map(activities.map(a => [a.id, a]));
  const activeStaff = staff.filter(s => s.is_active);

  // Track staff hours per day
  const staffHoursPerDay = new Map<string, Map<string, number>>();
  for (const s of activeStaff) {
    staffHoursPerDay.set(s.id, new Map());
  }

  // Initialize with existing assignments
  for (const assignment of existingAssignments) {
    const slot = slots.find(s => s.id === assignment.scheduleSlotId);
    if (slot) {
      const staffHours = staffHoursPerDay.get(assignment.staffId);
      if (staffHours) {
        const hours = calculateSlotHours(slot);
        staffHours.set(slot.date, (staffHours.get(slot.date) || 0) + hours);
      }
    }
  }

  // Sort slots by date and time
  const slotsToAssign = slots
    .filter(s => s.activity_id && !existingAssignments.some(a => a.scheduleSlotId === s.id))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });

  for (const slot of slotsToAssign) {
    const activity = activityMap.get(slot.activity_id!);
    const requiredStaff = activity?.required_staff_count || 1;
    const slotHours = calculateSlotHours(slot);

    // Find available staff for this slot
    const availableStaff = activeStaff.filter(s => {
      const staffHours = staffHoursPerDay.get(s.id)!;
      const currentDayHours = staffHours.get(slot.date) || 0;

      // Check max hours
      if (currentDayHours + slotHours > maxHoursPerDay) return false;

      // Check if not already assigned to another slot at this time
      const hasConflict = assignments.some(a => {
        const otherSlot = slots.find(os => os.id === a.scheduleSlotId);
        return a.staffId === s.id &&
               otherSlot?.date === slot.date &&
               otherSlot?.start_time === slot.start_time;
      });
      if (hasConflict) return false;

      return true;
    });

    if (availableStaff.length === 0) {
      unassignedSlots.push(slot.id);
      warnings.push(`Δεν βρέθηκε διαθέσιμο προσωπικό για ${slot.date} ${slot.start_time}`);
      continue;
    }

    // Sort by workload if balancing
    if (balanceWorkload) {
      availableStaff.sort((a, b) => {
        const aHours = Array.from(staffHoursPerDay.get(a.id)!.values()).reduce((sum, h) => sum + h, 0);
        const bHours = Array.from(staffHoursPerDay.get(b.id)!.values()).reduce((sum, h) => sum + h, 0);
        return aHours - bHours;
      });
    }

    // Assign staff
    const assignedCount = Math.min(requiredStaff, availableStaff.length);
    for (let i = 0; i < assignedCount; i++) {
      const staffMember = availableStaff[i];

      assignments.push({
        scheduleSlotId: slot.id,
        staffId: staffMember.id,
        role: i === 0 ? 'lead' : 'assistant'
      });

      // Update hours tracking
      const staffHours = staffHoursPerDay.get(staffMember.id)!;
      staffHours.set(slot.date, (staffHours.get(slot.date) || 0) + slotHours);
    }

    if (assignedCount < requiredStaff) {
      warnings.push(
        `${slot.date} ${slot.start_time}: Χρειάζονται ${requiredStaff} άτομα, ανατέθηκαν ${assignedCount}`
      );
    }
  }

  return { assignments, unassignedSlots, warnings };
}

// Get staff suggestions for a slot
export function getStaffSuggestions(
  slot: ScheduleSlot,
  staff: Staff[],
  existingAssignments: StaffAssignment[],
  allSlots: ScheduleSlot[]
): Staff[] {
  const activeStaff = staff.filter(s => s.is_active);

  return activeStaff.filter(s => {
    // Not already assigned to this slot
    const alreadyAssigned = existingAssignments.some(
      a => a.scheduleSlotId === slot.id && a.staffId === s.id
    );
    if (alreadyAssigned) return false;

    // Not assigned to another slot at the same time
    const hasConflict = existingAssignments.some(a => {
      if (a.staffId !== s.id) return false;
      const otherSlot = allSlots.find(os => os.id === a.scheduleSlotId);
      return otherSlot?.date === slot.date &&
             otherSlot?.start_time === slot.start_time;
    });
    if (hasConflict) return false;

    return true;
  });
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateSlotHours(slot: ScheduleSlot): number {
  const startMinutes = timeToMinutes(slot.start_time);
  const endMinutes = timeToMinutes(slot.end_time);
  return (endMinutes - startMinutes) / 60;
}

// Get staff availability matrix
export function getStaffAvailabilityMatrix(
  staff: Staff[],
  slots: ScheduleSlot[],
  assignments: StaffAssignment[]
): Map<string, Map<string, boolean>> {
  // staffId -> date_time -> isAvailable
  const matrix = new Map<string, Map<string, boolean>>();

  for (const s of staff) {
    const availability = new Map<string, boolean>();

    // Mark all slots as available initially
    for (const slot of slots) {
      const key = `${slot.date}_${slot.start_time.slice(0, 5)}`;
      availability.set(key, true);
    }

    // Mark assigned slots as unavailable
    for (const a of assignments) {
      if (a.staffId !== s.id) continue;
      const slot = slots.find(sl => sl.id === a.scheduleSlotId);
      if (slot) {
        const key = `${slot.date}_${slot.start_time.slice(0, 5)}`;
        availability.set(key, false);
      }
    }

    matrix.set(s.id, availability);
  }

  return matrix;
}
