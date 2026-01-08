// Schedule Generator - JavaScript Implementation
// Uses greedy algorithm with constraint-based filtering

import type { Database } from '@/lib/types/database';
import type {
  GenerationParams,
  GenerationResult,
  GeneratedSlot,
  GenerationScore,
  GenerationStats,
  GenerationProgress,
  SlotAssignment,
  ConstraintContext,
  ConstraintViolation
} from './types';
import { evaluateAllConstraints, isValidAssignment, getValidActivities } from './constraints';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];

interface GeneratorInput {
  session: Session;
  groups: Group[];
  activities: Activity[];
  facilities: Facility[];
  templateSlots: DayTemplateSlot[];
  constraints: Constraint[];
  existingSlots: ScheduleSlot[];
}

interface GeneratorContext {
  input: GeneratorInput;
  params: GenerationParams;
  allSlots: SlotAssignment[];
  activityUsage: Map<string, Map<string, number>>; // groupId -> activityId -> count
  facilityUsage: Map<string, Set<string>>; // "date_time" -> Set of facilityIds
  stats: GenerationStats;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export async function generateSchedule(
  input: GeneratorInput,
  params: GenerationParams,
  onProgress?: ProgressCallback
): Promise<GenerationResult> {
  const startTime = Date.now();

  // Initialize context
  const context: GeneratorContext = {
    input,
    params,
    allSlots: [],
    activityUsage: new Map(),
    facilityUsage: new Map(),
    stats: {
      totalSlotsGenerated: 0,
      totalSlotsSkipped: 0,
      totalSlotsExisting: 0,
      constraintsEvaluated: 0,
      hardViolations: 0,
      softViolations: 0,
      iterationsUsed: 0,
      backtrackCount: 0
    }
  };

  // Report initial progress
  onProgress?.({
    phase: 'initializing',
    percentage: 0,
    slotsGenerated: 0,
    totalSlots: 0,
    message: 'Αρχικοποίηση...'
  });

  // Generate date range
  const dates = generateDateRange(params.startDate, params.endDate);
  const schedulableSlots = input.templateSlots.filter(
    s => s.slot_type === 'activity' && s.is_schedulable
  );
  const activeGroups = input.groups.filter(g => g.is_active);
  const activeActivities = input.activities.filter(a => a.is_active);
  const activeFacilities = input.facilities.filter(f => f.is_active);
  const activeConstraints = input.constraints.filter(c => c.is_active);

  const totalSlots = dates.length * activeGroups.length * schedulableSlots.length;

  // Initialize existing slots
  if (params.options.respectExistingSlots) {
    for (const slot of input.existingSlots) {
      if (slot.activity_id) {
        context.allSlots.push({
          date: slot.date,
          groupId: slot.group_id || '',
          templateSlotId: slot.day_template_slot_id || '',
          startTime: slot.start_time,
          endTime: slot.end_time,
          activityId: slot.activity_id,
          facilityId: slot.facility_id
        });
        context.stats.totalSlotsExisting++;

        // Update usage tracking
        incrementActivityUsage(context, slot.group_id || '', slot.activity_id);
        if (slot.facility_id) {
          reserveFacility(context, slot.date, slot.start_time, slot.facility_id);
        }
      }
    }
  }

  onProgress?.({
    phase: 'generating',
    percentage: 5,
    slotsGenerated: 0,
    totalSlots,
    message: `Δημιουργία προγράμματος για ${dates.length} ημέρες, ${activeGroups.length} ομάδες...`
  });

  // Generate slots for each day
  const generatedSlots: GeneratedSlot[] = [];
  const violations: ConstraintViolation[] = [];
  let slotsProcessed = 0;

  for (const date of dates) {
    for (const templateSlot of schedulableSlots) {
      // Shuffle groups for variety (if not first iteration)
      const shuffledGroups = shuffleArray([...activeGroups]);

      for (const group of shuffledGroups) {
        slotsProcessed++;

        // Check if slot already exists
        const existingSlot = input.existingSlots.find(
          s => s.date === date &&
               s.group_id === group.id &&
               s.start_time.slice(0, 5) === templateSlot.start_time.slice(0, 5)
        );

        if (existingSlot && params.options.respectExistingSlots) {
          context.stats.totalSlotsSkipped++;
          continue;
        }

        // Find valid activity
        const result = findBestActivity(
          context,
          date,
          group,
          templateSlot,
          activeActivities,
          activeFacilities,
          activeConstraints
        );

        if (result.activityId) {
          const slot: GeneratedSlot = {
            date,
            groupId: group.id,
            templateSlotId: templateSlot.id,
            startTime: templateSlot.start_time,
            endTime: templateSlot.end_time,
            activityId: result.activityId,
            facilityId: result.facilityId,
            isNew: true
          };

          generatedSlots.push(slot);
          context.allSlots.push({
            ...slot,
            activityId: result.activityId,
            facilityId: result.facilityId
          });

          incrementActivityUsage(context, group.id, result.activityId);
          if (result.facilityId) {
            reserveFacility(context, date, templateSlot.start_time, result.facilityId);
          }

          context.stats.totalSlotsGenerated++;
        } else {
          context.stats.totalSlotsSkipped++;
          violations.push(...result.violations);
        }

        // Report progress periodically
        if (slotsProcessed % 10 === 0 || slotsProcessed === totalSlots) {
          const percentage = Math.round((slotsProcessed / totalSlots) * 90) + 5;
          onProgress?.({
            phase: 'generating',
            percentage,
            currentDay: date,
            currentGroup: group.name,
            slotsGenerated: generatedSlots.length,
            totalSlots,
            message: `${date} - ${group.name}`
          });

          // Allow UI to update
          await sleep(0);
        }
      }
    }
  }

  // Optimization phase (if thorough)
  if (params.options.optimizationLevel === 'thorough') {
    onProgress?.({
      phase: 'optimizing',
      percentage: 95,
      slotsGenerated: generatedSlots.length,
      totalSlots,
      message: 'Βελτιστοποίηση προγράμματος...'
    });

    // Try to improve soft constraint scores
    // This is a simplified version - full OR-Tools would do better
    await optimizeSchedule(context, generatedSlots, activeConstraints);
  }

  // Calculate final score
  const score = calculateScore(context, generatedSlots, activeConstraints);

  // Finalize
  onProgress?.({
    phase: 'completed',
    percentage: 100,
    slotsGenerated: generatedSlots.length,
    totalSlots,
    message: `Δημιουργήθηκαν ${generatedSlots.length} slots`
  });

  const duration = Date.now() - startTime;

  // Determine status
  let status: 'completed' | 'partial' | 'failed' = 'completed';
  if (generatedSlots.length === 0) {
    status = 'failed';
  } else if (generatedSlots.length < totalSlots * 0.5) {
    status = 'partial';
  }

  // Count violations
  context.stats.hardViolations = violations.filter(v => v.isHard).length;
  context.stats.softViolations = violations.filter(v => !v.isHard).length;

  return {
    success: generatedSlots.length > 0,
    status,
    slots: generatedSlots,
    score,
    violations,
    stats: context.stats,
    duration
  };
}

// Find the best activity for a slot
function findBestActivity(
  context: GeneratorContext,
  date: string,
  group: Group,
  templateSlot: DayTemplateSlot,
  activities: Activity[],
  facilities: Facility[],
  constraints: Constraint[]
): { activityId: string | null; facilityId: string | null; violations: ConstraintViolation[] } {
  const violations: ConstraintViolation[] = [];

  // Get slots for this group and day
  const groupSlots = context.allSlots.filter(s => s.groupId === group.id);
  const daySlots = groupSlots.filter(s => s.date === date);

  // Score each activity
  const activityScores: { activityId: string; facilityId: string | null; score: number }[] = [];

  for (const activity of activities) {
    // Find available facility for this activity
    const facilityId = findAvailableFacility(context, date, templateSlot.start_time, facilities);

    // Build context for constraint evaluation
    const constraintContext: ConstraintContext = {
      sessionId: context.input.session.id,
      date,
      groupId: group.id,
      activityId: activity.id,
      facilityId,
      startTime: templateSlot.start_time,
      endTime: templateSlot.end_time,
      allSlots: context.allSlots,
      daySlots,
      groupSlots
    };

    // Evaluate constraints
    const evalResult = evaluateAllConstraints(constraints, constraintContext);
    context.stats.constraintsEvaluated++;

    if (!evalResult.satisfied) {
      // Hard constraint violated
      violations.push(...evalResult.violations);
      continue;
    }

    // Calculate activity score
    let score = evalResult.score;

    // Prefer activities with lower usage for variety
    const usageCount = getActivityUsage(context, group.id, activity.id);
    score += Math.max(0, 50 - usageCount * 5); // Bonus for less-used activities

    // Prefer activities that fit the time slot duration
    const slotDuration = getSlotDuration(templateSlot);
    const durationDiff = Math.abs(activity.duration_minutes - slotDuration);
    score -= durationDiff * 0.5; // Penalty for duration mismatch

    // Random factor for variety
    if (context.params.options.randomSeed) {
      score += Math.random() * 10;
    }

    activityScores.push({ activityId: activity.id, facilityId, score });
  }

  // Sort by score (descending)
  activityScores.sort((a, b) => b.score - a.score);

  if (activityScores.length > 0) {
    // Select from top activities with some randomness
    const topN = Math.min(3, activityScores.length);
    const selected = activityScores[Math.floor(Math.random() * topN)];
    return { activityId: selected.activityId, facilityId: selected.facilityId, violations: [] };
  }

  return { activityId: null, facilityId: null, violations };
}

// Find available facility
function findAvailableFacility(
  context: GeneratorContext,
  date: string,
  startTime: string,
  facilities: Facility[]
): string | null {
  if (facilities.length === 0) return null;

  const key = `${date}_${startTime.slice(0, 5)}`;
  const usedFacilities = context.facilityUsage.get(key) || new Set();

  // Find first available
  for (const facility of facilities) {
    if (!usedFacilities.has(facility.id)) {
      return facility.id;
    }
  }

  // All facilities are busy - return null
  return null;
}

// Helper functions
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function incrementActivityUsage(context: GeneratorContext, groupId: string, activityId: string) {
  if (!context.activityUsage.has(groupId)) {
    context.activityUsage.set(groupId, new Map());
  }
  const groupUsage = context.activityUsage.get(groupId)!;
  groupUsage.set(activityId, (groupUsage.get(activityId) || 0) + 1);
}

function getActivityUsage(context: GeneratorContext, groupId: string, activityId: string): number {
  return context.activityUsage.get(groupId)?.get(activityId) || 0;
}

function reserveFacility(context: GeneratorContext, date: string, startTime: string, facilityId: string) {
  const key = `${date}_${startTime.slice(0, 5)}`;
  if (!context.facilityUsage.has(key)) {
    context.facilityUsage.set(key, new Set());
  }
  context.facilityUsage.get(key)!.add(facilityId);
}

function getSlotDuration(slot: DayTemplateSlot): number {
  const [startH, startM] = slot.start_time.slice(0, 5).split(':').map(Number);
  const [endH, endM] = slot.end_time.slice(0, 5).split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate overall schedule score
function calculateScore(
  context: GeneratorContext,
  slots: GeneratedSlot[],
  constraints: Constraint[]
): GenerationScore {
  // Constraint score - based on soft constraint satisfaction
  const softConstraints = constraints.filter(c => c.is_active && !c.is_hard);
  let constraintScore = 100;
  // Would evaluate each slot against soft constraints

  // Balance score - how evenly activities are distributed
  let balanceScore = 100;
  const activityCounts = new Map<string, number>();
  for (const slot of slots) {
    activityCounts.set(slot.activityId, (activityCounts.get(slot.activityId) || 0) + 1);
  }
  if (activityCounts.size > 0) {
    const counts = Array.from(activityCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / counts.length;
    balanceScore = Math.max(0, 100 - variance * 2);
  }

  // Variety score - different activities per group per day
  let varietyScore = 100;
  // Would check unique activities per group per day

  // Facility utilization
  let facilityUtilizationScore = 100;
  const totalFacilitySlots = slots.filter(s => s.facilityId).length;
  facilityUtilizationScore = slots.length > 0
    ? (totalFacilitySlots / slots.length) * 100
    : 100;

  const total = (constraintScore + balanceScore + varietyScore + facilityUtilizationScore) / 4;

  return {
    total,
    constraintScore,
    balanceScore,
    varietyScore,
    facilityUtilizationScore
  };
}

// Simple optimization pass
async function optimizeSchedule(
  context: GeneratorContext,
  slots: GeneratedSlot[],
  constraints: Constraint[]
): Promise<void> {
  // This is a placeholder for more sophisticated optimization
  // Full OR-Tools integration would go here
  context.stats.iterationsUsed = 1;
}
