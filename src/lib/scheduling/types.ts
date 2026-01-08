// Scheduling Types for Auto-Generation

import type {
  ConstraintType,
  GenerationMethod,
  ScheduleStatus,
  WeatherCondition
} from '@/lib/types/database';

// Feasibility Check Types
export interface FeasibilityResult {
  canGenerate: boolean;
  issues: FeasibilityIssue[];
  warnings: FeasibilityIssue[];
  stats: FeasibilityStats;
}

export interface FeasibilityIssue {
  type: 'error' | 'warning';
  category: 'groups' | 'activities' | 'facilities' | 'constraints' | 'template' | 'dates';
  message: string;
  details?: string;
}

export interface FeasibilityStats {
  totalDays: number;
  totalGroups: number;
  totalActivities: number;
  totalFacilities: number;
  totalSlots: number;
  slotsPerDay: number;
  hardConstraints: number;
  softConstraints: number;
}

// Generation Parameters
export interface GenerationParams {
  sessionId: string;
  startDate: string;
  endDate: string;
  options: GenerationOptions;
}

export interface GenerationOptions {
  respectExistingSlots: boolean;
  optimizationLevel: 'fast' | 'balanced' | 'thorough';
  maxIterations: number;
  randomSeed?: number;
  prioritizeFacilityUtilization: boolean;
  balanceActivityDistribution: boolean;
}

// Generation Result
export interface GenerationResult {
  success: boolean;
  status: 'completed' | 'partial' | 'failed';
  slots: GeneratedSlot[];
  score: GenerationScore;
  violations: ConstraintViolation[];
  stats: GenerationStats;
  duration: number;
}

export interface GeneratedSlot {
  date: string;
  groupId: string;
  templateSlotId: string;
  startTime: string;
  endTime: string;
  activityId: string;
  facilityId: string | null;
  isNew: boolean;
}

export interface GenerationScore {
  total: number;
  constraintScore: number;
  balanceScore: number;
  varietyScore: number;
  facilityUtilizationScore: number;
}

export interface ConstraintViolation {
  constraintId: string;
  constraintName: string;
  constraintType: ConstraintType;
  isHard: boolean;
  message: string;
  affectedSlots: string[];
  severity: 'critical' | 'major' | 'minor';
}

export interface GenerationStats {
  totalSlotsGenerated: number;
  totalSlotsSkipped: number;
  totalSlotsExisting: number;
  constraintsEvaluated: number;
  hardViolations: number;
  softViolations: number;
  iterationsUsed: number;
  backtrackCount: number;
}

// Constraint Evaluation Types
export interface ConstraintContext {
  sessionId: string;
  date: string;
  groupId: string;
  activityId: string;
  facilityId: string | null;
  startTime: string;
  endTime: string;
  allSlots: SlotAssignment[];
  daySlots: SlotAssignment[];
  groupSlots: SlotAssignment[];
}

export interface SlotAssignment {
  date: string;
  groupId: string;
  templateSlotId: string;
  startTime: string;
  endTime: string;
  activityId: string | null;
  facilityId: string | null;
}

export interface ConstraintEvaluation {
  satisfied: boolean;
  score: number; // 0-100
  message?: string;
}

// Generation Progress
export interface GenerationProgress {
  phase: 'initializing' | 'validating' | 'generating' | 'optimizing' | 'finalizing' | 'completed' | 'failed';
  percentage: number;
  currentDay?: string;
  currentGroup?: string;
  slotsGenerated: number;
  totalSlots: number;
  message: string;
}

// Activity Requirements (for future enhancement)
export interface ActivityRequirement {
  activityId: string;
  groupId?: string;
  frequencyType: 'per_day' | 'per_week' | 'per_session';
  minCount: number;
  maxCount: number;
  preferredTimes?: string[];
  requiredFacilities?: string[];
}

// Schedule Day for generation
export interface ScheduleDay {
  date: string;
  dayOfWeek: number; // 0-6, Monday = 0
  slots: TemplateSlotInfo[];
}

export interface TemplateSlotInfo {
  id: string;
  startTime: string;
  endTime: string;
  isSchedulable: boolean;
  slotType: string;
}

// Activity Pool - activities available for scheduling
export interface ActivityPool {
  activityId: string;
  name: string;
  durationMinutes: number;
  requiredFacilities: string[];
  weatherDependent: boolean;
  minParticipants: number | null;
  maxParticipants: number | null;
  weight: number; // Higher = more likely to be selected
}

// Facility Availability
export interface FacilityAvailability {
  facilityId: string;
  name: string;
  capacity: number | null;
  indoor: boolean;
  bookedSlots: Set<string>; // "date_startTime" format
}
