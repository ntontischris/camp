// Constraint Evaluation Engine

import type { Database, ConstraintType, Json } from '@/lib/types/database';
import type { ConstraintContext, ConstraintEvaluation, SlotAssignment, ConstraintViolation } from './types';

type Constraint = Database['public']['Tables']['constraints']['Row'];

// Main constraint evaluator
export function evaluateConstraint(
  constraint: Constraint,
  context: ConstraintContext
): ConstraintEvaluation {
  const evaluator = constraintEvaluators[constraint.constraint_type];

  if (!evaluator) {
    console.warn(`No evaluator for constraint type: ${constraint.constraint_type}`);
    return { satisfied: true, score: 100 };
  }

  return evaluator(constraint, context);
}

// Evaluate all constraints for a slot assignment
export function evaluateAllConstraints(
  constraints: Constraint[],
  context: ConstraintContext
): { satisfied: boolean; violations: ConstraintViolation[]; score: number } {
  const violations: ConstraintViolation[] = [];
  let totalScore = 0;
  let hardConstraintsFailed = false;

  const activeConstraints = constraints.filter(c => c.is_active);

  for (const constraint of activeConstraints) {
    const result = evaluateConstraint(constraint, context);

    if (!result.satisfied) {
      violations.push({
        constraintId: constraint.id,
        constraintName: constraint.name,
        constraintType: constraint.constraint_type,
        isHard: constraint.is_hard,
        message: result.message || constraint.error_message || 'Παραβίαση περιορισμού',
        affectedSlots: [`${context.date}_${context.groupId}_${context.startTime}`],
        severity: constraint.is_hard ? 'critical' : 'minor'
      });

      if (constraint.is_hard) {
        hardConstraintsFailed = true;
      }
    }

    // Weight score by constraint priority
    totalScore += result.score * (constraint.priority / 10);
  }

  const averageScore = activeConstraints.length > 0
    ? totalScore / activeConstraints.length
    : 100;

  return {
    satisfied: !hardConstraintsFailed,
    violations,
    score: averageScore
  };
}

// Constraint evaluator functions
type ConstraintEvaluator = (constraint: Constraint, context: ConstraintContext) => ConstraintEvaluation;

const constraintEvaluators: Record<ConstraintType, ConstraintEvaluator> = {
  // Time restriction - activity only at specific times
  time_restriction: (constraint, context) => {
    const condition = constraint.condition as { activity_id?: string; allowed_times?: string[]; blocked_times?: string[] } | null;

    if (!condition) return { satisfied: true, score: 100 };

    // Check if this constraint applies to the current activity
    if (condition.activity_id && condition.activity_id !== context.activityId) {
      return { satisfied: true, score: 100 };
    }

    const currentTime = context.startTime.slice(0, 5);

    // Check blocked times
    if (condition.blocked_times?.includes(currentTime)) {
      return {
        satisfied: false,
        score: 0,
        message: `Η δραστηριότητα δεν επιτρέπεται στις ${currentTime}`
      };
    }

    // Check allowed times
    if (condition.allowed_times && condition.allowed_times.length > 0) {
      if (!condition.allowed_times.includes(currentTime)) {
        return {
          satisfied: false,
          score: 0,
          message: `Η δραστηριότητα επιτρέπεται μόνο στις: ${condition.allowed_times.join(', ')}`
        };
      }
    }

    return { satisfied: true, score: 100 };
  },

  // Sequence - activity B must/must not follow activity A
  sequence: (constraint, context) => {
    const condition = constraint.condition as {
      before_activity_id?: string;
      after_activity_id?: string;
      must_follow?: boolean;
      gap_slots?: number;
    } | null;

    if (!condition) return { satisfied: true, score: 100 };

    // Find the previous slot for this group on this day
    const previousSlots = context.groupSlots
      .filter(s => s.date === context.date && s.endTime <= context.startTime)
      .sort((a, b) => b.endTime.localeCompare(a.endTime));

    if (previousSlots.length === 0) return { satisfied: true, score: 100 };

    const previousSlot = previousSlots[0];

    // Check must_follow rule
    if (condition.must_follow) {
      if (previousSlot.activityId === condition.before_activity_id &&
          context.activityId !== condition.after_activity_id) {
        return {
          satisfied: false,
          score: 0,
          message: `Μετά από αυτή τη δραστηριότητα πρέπει να ακολουθεί συγκεκριμένη δραστηριότητα`
        };
      }
    } else {
      // must NOT follow
      if (previousSlot.activityId === condition.before_activity_id &&
          context.activityId === condition.after_activity_id) {
        return {
          satisfied: false,
          score: 0,
          message: `Αυτή η δραστηριότητα δεν μπορεί να ακολουθεί την προηγούμενη`
        };
      }
    }

    return { satisfied: true, score: 100 };
  },

  // Daily limit - max times per day
  daily_limit: (constraint, context) => {
    const condition = constraint.condition as {
      activity_id?: string;
      max_count?: number;
    } | null;

    if (!condition || !condition.activity_id || !condition.max_count) {
      return { satisfied: true, score: 100 };
    }

    // Check if this applies to current activity
    if (condition.activity_id !== context.activityId) {
      return { satisfied: true, score: 100 };
    }

    // Count occurrences of this activity for this group on this day
    const count = context.groupSlots.filter(
      s => s.date === context.date && s.activityId === condition.activity_id
    ).length;

    // +1 for current slot being added
    if (count + 1 > condition.max_count) {
      return {
        satisfied: false,
        score: 0,
        message: `Η δραστηριότητα έχει ήδη ${count} εμφανίσεις σήμερα (max: ${condition.max_count})`
      };
    }

    // Soft score - warn if approaching limit
    const utilizationScore = Math.max(0, 100 - (count / condition.max_count) * 50);
    return { satisfied: true, score: utilizationScore };
  },

  // Daily minimum - min times per day
  daily_minimum: (constraint, context) => {
    // This is evaluated at day completion, not per-slot
    // For now, return satisfied
    return { satisfied: true, score: 100 };
  },

  // Consecutive limit - max consecutive slots with same activity
  consecutive_limit: (constraint, context) => {
    const condition = constraint.condition as {
      activity_id?: string;
      max_consecutive?: number;
    } | null;

    if (!condition || !condition.max_consecutive) {
      return { satisfied: true, score: 100 };
    }

    // Count consecutive slots before current
    let consecutiveCount = 0;
    const sortedSlots = context.groupSlots
      .filter(s => s.date === context.date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = sortedSlots.length - 1; i >= 0; i--) {
      const slot = sortedSlots[i];
      if (slot.startTime >= context.startTime) continue;

      const checkActivityId = condition.activity_id || context.activityId;
      if (slot.activityId === checkActivityId) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    // +1 for current slot
    if (consecutiveCount + 1 > condition.max_consecutive) {
      return {
        satisfied: false,
        score: 0,
        message: `Υπέρβαση ορίου συνεχόμενων επαναλήψεων (${consecutiveCount + 1}/${condition.max_consecutive})`
      };
    }

    return { satisfied: true, score: 100 };
  },

  // Staff limit - max slots per staff member
  staff_limit: (constraint, context) => {
    // This requires staff assignment data - for now, pass
    return { satisfied: true, score: 100 };
  },

  // Weather substitute - alternative activity for bad weather
  weather_substitute: (constraint, context) => {
    // This is applied during weather check, not during generation
    return { satisfied: true, score: 100 };
  },

  // Facility exclusive - only one group at a time
  facility_exclusive: (constraint, context) => {
    if (!context.facilityId) return { satisfied: true, score: 100 };

    const condition = constraint.condition as {
      facility_id?: string;
    } | null;

    // Check if this constraint applies to current facility
    if (condition?.facility_id && condition.facility_id !== context.facilityId) {
      return { satisfied: true, score: 100 };
    }

    // Check if any other group is using this facility at the same time
    const conflictingSlots = context.allSlots.filter(
      s => s.date === context.date &&
           s.startTime === context.startTime &&
           s.facilityId === context.facilityId &&
           s.groupId !== context.groupId
    );

    if (conflictingSlots.length > 0) {
      return {
        satisfied: false,
        score: 0,
        message: `Η εγκατάσταση χρησιμοποιείται ήδη από άλλη ομάδα`
      };
    }

    return { satisfied: true, score: 100 };
  },

  // Gap required - minimum time between specific activities
  gap_required: (constraint, context) => {
    const condition = constraint.condition as {
      activity_id?: string;
      min_gap_minutes?: number;
    } | null;

    if (!condition || !condition.activity_id || !condition.min_gap_minutes) {
      return { satisfied: true, score: 100 };
    }

    // Check if current activity needs gap after previous
    if (context.activityId !== condition.activity_id) {
      return { satisfied: true, score: 100 };
    }

    // Find previous occurrence of this activity
    const previousOccurrences = context.groupSlots
      .filter(s => s.date === context.date && s.activityId === condition.activity_id)
      .sort((a, b) => b.endTime.localeCompare(a.endTime));

    if (previousOccurrences.length === 0) {
      return { satisfied: true, score: 100 };
    }

    const lastOccurrence = previousOccurrences[0];
    const lastEnd = timeToMinutes(lastOccurrence.endTime);
    const currentStart = timeToMinutes(context.startTime);
    const gap = currentStart - lastEnd;

    if (gap < condition.min_gap_minutes) {
      return {
        satisfied: false,
        score: 0,
        message: `Απαιτείται κενό ${condition.min_gap_minutes} λεπτών (υπάρχει ${gap})`
      };
    }

    return { satisfied: true, score: 100 };
  },

  // Group separation - groups that should not be together
  group_separation: (constraint, context) => {
    const condition = constraint.condition as {
      group_ids?: string[];
      facility_based?: boolean;
    } | null;

    if (!condition?.group_ids || condition.group_ids.length < 2) {
      return { satisfied: true, score: 100 };
    }

    // Check if current group is in the separation list
    if (!condition.group_ids.includes(context.groupId)) {
      return { satisfied: true, score: 100 };
    }

    // Check if any separated groups are at the same place/time
    const otherSeparatedGroups = condition.group_ids.filter(g => g !== context.groupId);

    for (const otherGroupId of otherSeparatedGroups) {
      const conflictingSlots = context.allSlots.filter(
        s => s.date === context.date &&
             s.startTime === context.startTime &&
             s.groupId === otherGroupId
      );

      for (const slot of conflictingSlots) {
        // If facility-based, check same facility
        if (condition.facility_based && context.facilityId && slot.facilityId === context.facilityId) {
          return {
            satisfied: false,
            score: 0,
            message: `Οι ομάδες δεν πρέπει να βρίσκονται στον ίδιο χώρο`
          };
        }

        // If same activity, also violation
        if (!condition.facility_based && slot.activityId === context.activityId) {
          return {
            satisfied: false,
            score: 0,
            message: `Οι ομάδες δεν πρέπει να κάνουν την ίδια δραστηριότητα ταυτόχρονα`
          };
        }
      }
    }

    return { satisfied: true, score: 100 };
  }
};

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if slot assignment is valid against all hard constraints
export function isValidAssignment(
  constraints: Constraint[],
  context: ConstraintContext
): boolean {
  const hardConstraints = constraints.filter(c => c.is_active && c.is_hard);

  for (const constraint of hardConstraints) {
    const result = evaluateConstraint(constraint, context);
    if (!result.satisfied) {
      return false;
    }
  }

  return true;
}

// Get suggestions for valid activities based on constraints
export function getValidActivities(
  activities: string[],
  constraints: Constraint[],
  baseContext: Omit<ConstraintContext, 'activityId'>
): string[] {
  return activities.filter(activityId => {
    const context: ConstraintContext = {
      ...baseContext,
      activityId
    };
    return isValidAssignment(constraints, context);
  });
}
