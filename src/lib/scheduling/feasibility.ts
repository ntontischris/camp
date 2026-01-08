// Feasibility Check for Schedule Generation

import type { Database } from '@/lib/types/database';
import type { FeasibilityResult, FeasibilityIssue, FeasibilityStats } from './types';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];

interface FeasibilityInput {
  session: Session;
  groups: Group[];
  activities: Activity[];
  facilities: Facility[];
  template: DayTemplate | null;
  templateSlots: DayTemplateSlot[];
  constraints: Constraint[];
}

export function checkFeasibility(input: FeasibilityInput): FeasibilityResult {
  const issues: FeasibilityIssue[] = [];
  const warnings: FeasibilityIssue[] = [];

  // Check session dates
  const sessionStart = new Date(input.session.start_date);
  const sessionEnd = new Date(input.session.end_date);
  const totalDays = Math.ceil((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays <= 0) {
    issues.push({
      type: 'error',
      category: 'dates',
      message: 'Οι ημερομηνίες της περιόδου δεν είναι έγκυρες',
      details: 'Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης'
    });
  }

  // Check session status
  if (input.session.status !== 'planning' && input.session.status !== 'active') {
    issues.push({
      type: 'error',
      category: 'dates',
      message: 'Η περίοδος δεν είναι σε κατάσταση σχεδιασμού',
      details: `Τρέχουσα κατάσταση: ${input.session.status}`
    });
  }

  // Check groups
  const activeGroups = input.groups.filter(g => g.is_active);
  if (activeGroups.length === 0) {
    issues.push({
      type: 'error',
      category: 'groups',
      message: 'Δεν υπάρχουν ενεργές ομάδες',
      details: 'Πρέπει να υπάρχει τουλάχιστον μία ενεργή ομάδα για τη δημιουργία προγράμματος'
    });
  }

  // Check activities
  const activeActivities = input.activities.filter(a => a.is_active);
  if (activeActivities.length === 0) {
    issues.push({
      type: 'error',
      category: 'activities',
      message: 'Δεν υπάρχουν ενεργές δραστηριότητες',
      details: 'Πρέπει να υπάρχει τουλάχιστον μία ενεργή δραστηριότητα'
    });
  } else if (activeActivities.length < 3) {
    warnings.push({
      type: 'warning',
      category: 'activities',
      message: 'Λίγες διαθέσιμες δραστηριότητες',
      details: `Μόνο ${activeActivities.length} δραστηριότητες. Για καλύτερη ποικιλία προτείνονται τουλάχιστον 5`
    });
  }

  // Check facilities
  const activeFacilities = input.facilities.filter(f => f.is_active);
  if (activeFacilities.length === 0) {
    warnings.push({
      type: 'warning',
      category: 'facilities',
      message: 'Δεν υπάρχουν εγκαταστάσεις',
      details: 'Το πρόγραμμα θα δημιουργηθεί χωρίς ανάθεση χώρων'
    });
  }

  // Check template
  if (!input.template) {
    issues.push({
      type: 'error',
      category: 'template',
      message: 'Δεν υπάρχει προεπιλεγμένο πρότυπο ημέρας',
      details: 'Πρέπει να ορίσεις ένα πρότυπο ως προεπιλογή'
    });
  }

  // Check template slots
  const schedulableSlots = input.templateSlots.filter(s => s.slot_type === 'activity' && s.is_schedulable);
  if (schedulableSlots.length === 0 && input.template) {
    issues.push({
      type: 'error',
      category: 'template',
      message: 'Το πρότυπο δεν έχει χρονοθυρίδες δραστηριοτήτων',
      details: 'Πρόσθεσε χρονοθυρίδες τύπου "Δραστηριότητα" στο πρότυπο'
    });
  }

  // Check constraints
  const activeConstraints = input.constraints.filter(c => c.is_active);
  const hardConstraints = activeConstraints.filter(c => c.is_hard);
  const softConstraints = activeConstraints.filter(c => !c.is_hard);

  if (hardConstraints.length > 20) {
    warnings.push({
      type: 'warning',
      category: 'constraints',
      message: 'Πολλοί αυστηροί περιορισμοί',
      details: `${hardConstraints.length} αυστηροί περιορισμοί μπορεί να δυσκολέψουν τη δημιουργία έγκυρου προγράμματος`
    });
  }

  // Check for potentially conflicting constraints
  const facilityExclusiveConstraints = hardConstraints.filter(c => c.constraint_type === 'facility_exclusive');
  if (facilityExclusiveConstraints.length > 0 && activeFacilities.length < activeGroups.length) {
    warnings.push({
      type: 'warning',
      category: 'constraints',
      message: 'Πιθανή σύγκρουση αποκλειστικότητας χώρων',
      details: `Υπάρχουν ${activeGroups.length} ομάδες αλλά μόνο ${activeFacilities.length} εγκαταστάσεις με περιορισμούς αποκλειστικότητας`
    });
  }

  // Calculate stats
  const stats: FeasibilityStats = {
    totalDays: totalDays > 0 ? totalDays : 0,
    totalGroups: activeGroups.length,
    totalActivities: activeActivities.length,
    totalFacilities: activeFacilities.length,
    slotsPerDay: schedulableSlots.length,
    totalSlots: (totalDays > 0 ? totalDays : 0) * activeGroups.length * schedulableSlots.length,
    hardConstraints: hardConstraints.length,
    softConstraints: softConstraints.length
  };

  // Additional feasibility checks based on scale
  if (stats.totalSlots > 1000) {
    warnings.push({
      type: 'warning',
      category: 'dates',
      message: 'Μεγάλο πρόγραμμα',
      details: `${stats.totalSlots} slots προς δημιουργία. Η διαδικασία μπορεί να διαρκέσει λίγα λεπτά`
    });
  }

  return {
    canGenerate: issues.length === 0,
    issues,
    warnings,
    stats
  };
}

// Check if a specific day can be scheduled
export function checkDayFeasibility(
  date: Date,
  groups: Group[],
  activities: Activity[],
  facilities: Facility[],
  constraints: Constraint[]
): { feasible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for weekend/holiday constraints
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Future: Check for specific day constraints
  // For now, assume all days are schedulable

  return {
    feasible: issues.length === 0,
    issues
  };
}

// Get scheduling requirements summary
export function getSchedulingRequirements(
  totalSlots: number,
  activities: Activity[],
  constraints: Constraint[]
): string[] {
  const requirements: string[] = [];

  // Each activity should appear at least once
  const minActivityAppearances = Math.floor(totalSlots / activities.length);
  requirements.push(`Κάθε δραστηριότητα θα εμφανιστεί περίπου ${minActivityAppearances} φορές`);

  // Check for minimum requirements from constraints
  const dailyMinConstraints = constraints.filter(c => c.constraint_type === 'daily_minimum' && c.is_active);
  dailyMinConstraints.forEach(c => {
    requirements.push(`${c.name}: ${c.description || 'Ελάχιστο ημερήσιο'}`);
  });

  return requirements;
}
