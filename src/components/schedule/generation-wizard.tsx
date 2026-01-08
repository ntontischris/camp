'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';
import {
  checkFeasibility,
  generateSchedule,
  type FeasibilityResult,
  type GenerationResult,
  type GenerationProgress,
  type GenerationOptions,
  type GeneratedSlot
} from '@/lib/scheduling';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];

interface GenerationWizardProps {
  session: Session;
  groups: Group[];
  activities: Activity[];
  facilities: Facility[];
  template: DayTemplate | null;
  templateSlots: DayTemplateSlot[];
  constraints: Constraint[];
  existingSlots: ScheduleSlot[];
  onClose: () => void;
  onApply: (slots: GeneratedSlot[]) => Promise<void>;
}

type WizardStep = 'check' | 'options' | 'generating' | 'results';

export function GenerationWizard({
  session,
  groups,
  activities,
  facilities,
  template,
  templateSlots,
  constraints,
  existingSlots,
  onClose,
  onApply
}: GenerationWizardProps) {
  const [step, setStep] = useState<WizardStep>('check');
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    respectExistingSlots: true,
    optimizationLevel: 'balanced',
    maxIterations: 1000,
    prioritizeFacilityUtilization: true,
    balanceActivityDistribution: true
  });
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run feasibility check on mount
  useEffect(() => {
    const result = checkFeasibility({
      session,
      groups,
      activities,
      facilities,
      template,
      templateSlots,
      constraints
    });
    setFeasibility(result);
  }, [session, groups, activities, facilities, template, templateSlots, constraints]);

  // Handle generation
  const startGeneration = useCallback(async () => {
    setStep('generating');
    setError(null);
    setProgress({
      phase: 'initializing',
      percentage: 0,
      slotsGenerated: 0,
      totalSlots: 0,
      message: 'Εκκίνηση...'
    });

    try {
      const generationResult = await generateSchedule(
        {
          session,
          groups,
          activities,
          facilities,
          templateSlots,
          constraints,
          existingSlots
        },
        {
          sessionId: session.id,
          startDate: session.start_date,
          endDate: session.end_date,
          options
        },
        setProgress
      );

      setResult(generationResult);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Σφάλμα κατά τη δημιουργία');
      setStep('options');
    }
  }, [session, groups, activities, facilities, templateSlots, constraints, existingSlots, options]);

  // Handle apply
  const handleApply = async () => {
    if (!result) return;

    setApplying(true);
    setError(null);

    try {
      await onApply(result.slots);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Σφάλμα κατά την αποθήκευση');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Αυτόματη Δημιουργία Προγράμματος
            </h2>
            <p className="text-sm text-gray-500">
              {session.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={step === 'generating'}
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2 text-sm">
            <StepIndicator
              label="1. Έλεγχος"
              active={step === 'check'}
              completed={step !== 'check'}
            />
            <div className="flex-1 h-px bg-gray-300" />
            <StepIndicator
              label="2. Ρυθμίσεις"
              active={step === 'options'}
              completed={step === 'generating' || step === 'results'}
            />
            <div className="flex-1 h-px bg-gray-300" />
            <StepIndicator
              label="3. Δημιουργία"
              active={step === 'generating'}
              completed={step === 'results'}
            />
            <div className="flex-1 h-px bg-gray-300" />
            <StepIndicator
              label="4. Αποτελέσματα"
              active={step === 'results'}
              completed={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {step === 'check' && feasibility && (
            <FeasibilityStep feasibility={feasibility} />
          )}

          {step === 'options' && feasibility && (
            <OptionsStep
              options={options}
              setOptions={setOptions}
              stats={feasibility.stats}
              existingSlotsCount={existingSlots.length}
            />
          )}

          {step === 'generating' && progress && (
            <GeneratingStep progress={progress} />
          )}

          {step === 'results' && result && (
            <ResultsStep result={result} activities={activities} facilities={facilities} groups={groups} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between bg-gray-50">
          <div>
            {step !== 'check' && step !== 'generating' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 'options') setStep('check');
                  if (step === 'results') setStep('options');
                }}
              >
                Πίσω
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={step === 'generating' || applying}>
              Ακύρωση
            </Button>

            {step === 'check' && (
              <Button
                onClick={() => setStep('options')}
                disabled={!feasibility?.canGenerate}
              >
                Συνέχεια
              </Button>
            )}

            {step === 'options' && (
              <Button onClick={startGeneration}>
                Δημιουργία
              </Button>
            )}

            {step === 'results' && result && (
              <Button
                onClick={handleApply}
                disabled={applying || result.slots.length === 0}
              >
                {applying ? 'Αποθήκευση...' : `Εφαρμογή (${result.slots.length} slots)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        active
          ? 'bg-primary-100 text-primary-700'
          : completed
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {completed ? '✓ ' : ''}{label}
    </div>
  );
}

// Step 1: Feasibility Check
function FeasibilityStep({ feasibility }: { feasibility: FeasibilityResult }) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div
        className={`p-4 rounded-lg ${
          feasibility.canGenerate
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {feasibility.canGenerate ? '✅' : '❌'}
          </span>
          <div>
            <h3 className={`font-medium ${feasibility.canGenerate ? 'text-green-800' : 'text-red-800'}`}>
              {feasibility.canGenerate
                ? 'Έτοιμο για δημιουργία!'
                : 'Δεν είναι δυνατή η δημιουργία'}
            </h3>
            <p className={`text-sm ${feasibility.canGenerate ? 'text-green-600' : 'text-red-600'}`}>
              {feasibility.canGenerate
                ? 'Όλα τα απαραίτητα στοιχεία είναι διαθέσιμα'
                : 'Διόρθωσε τα σφάλματα παρακάτω'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Στοιχεία Προγράμματος</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{feasibility.stats.totalDays}</div>
              <div className="text-xs text-gray-500">Ημέρες</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{feasibility.stats.totalGroups}</div>
              <div className="text-xs text-gray-500">Ομάδες</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{feasibility.stats.totalActivities}</div>
              <div className="text-xs text-gray-500">Δραστηριότητες</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{feasibility.stats.totalFacilities}</div>
              <div className="text-xs text-gray-500">Εγκαταστάσεις</div>
            </div>
          </div>
          <div className="mt-4 text-center p-3 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-700">{feasibility.stats.totalSlots}</div>
            <div className="text-sm text-primary-600">Συνολικά slots προς δημιουργία</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-medium text-red-700">{feasibility.stats.hardConstraints}</div>
              <div className="text-xs text-red-500">Αυστηροί Περιορισμοί</div>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <div className="text-lg font-medium text-yellow-700">{feasibility.stats.softConstraints}</div>
              <div className="text-xs text-yellow-500">Ευέλικτοι Περιορισμοί</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {feasibility.issues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700">Σφάλματα</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feasibility.issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500">●</span>
                  <div>
                    <div className="font-medium text-red-800">{issue.message}</div>
                    {issue.details && (
                      <div className="text-red-600 text-xs">{issue.details}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {feasibility.warnings.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700">Προειδοποιήσεις</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feasibility.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500">⚠</span>
                  <div>
                    <div className="font-medium text-yellow-800">{warning.message}</div>
                    {warning.details && (
                      <div className="text-yellow-600 text-xs">{warning.details}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step 2: Options
function OptionsStep({
  options,
  setOptions,
  stats,
  existingSlotsCount
}: {
  options: GenerationOptions;
  setOptions: (options: GenerationOptions) => void;
  stats: FeasibilityResult['stats'];
  existingSlotsCount: number;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ρυθμίσεις Δημιουργίας</CardTitle>
          <CardDescription>
            Ρύθμισε πώς θα δημιουργηθεί το πρόγραμμα
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing slots option */}
          {existingSlotsCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="respectExisting"
                checked={options.respectExistingSlots}
                onChange={(e) =>
                  setOptions({ ...options, respectExistingSlots: e.target.checked })
                }
                className="mt-1"
              />
              <label htmlFor="respectExisting" className="flex-1">
                <div className="font-medium text-gray-900">
                  Διατήρηση υπαρχόντων καταχωρήσεων
                </div>
                <div className="text-sm text-gray-500">
                  Υπάρχουν {existingSlotsCount} slots ήδη. Αν το ενεργοποιήσεις,
                  θα δημιουργηθούν μόνο τα κενά.
                </div>
              </label>
            </div>
          )}

          {/* Optimization level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Επίπεδο Βελτιστοποίησης
            </label>
            <select
              value={options.optimizationLevel}
              onChange={(e) =>
                setOptions({
                  ...options,
                  optimizationLevel: e.target.value as 'fast' | 'balanced' | 'thorough'
                })
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="fast">Γρήγορο - Βασική κατανομή</option>
              <option value="balanced">Ισορροπημένο - Καλή ποιότητα (Προτείνεται)</option>
              <option value="thorough">Λεπτομερές - Βέλτιστη κατανομή (πιο αργό)</option>
            </select>
            <p className="text-xs text-gray-500">
              {options.optimizationLevel === 'fast' && 'Γρήγορη δημιουργία χωρίς βελτιστοποίηση'}
              {options.optimizationLevel === 'balanced' && 'Καλή ισορροπία ταχύτητας και ποιότητας'}
              {options.optimizationLevel === 'thorough' && 'Πλήρης βελτιστοποίηση - μπορεί να πάρει περισσότερο χρόνο'}
            </p>
          </div>

          {/* Distribution preferences */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Προτιμήσεις Κατανομής
            </label>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="balanceActivities"
                checked={options.balanceActivityDistribution}
                onChange={(e) =>
                  setOptions({ ...options, balanceActivityDistribution: e.target.checked })
                }
              />
              <label htmlFor="balanceActivities" className="text-sm text-gray-700">
                Ισορροπημένη κατανομή δραστηριοτήτων
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="facilityUtil"
                checked={options.prioritizeFacilityUtilization}
                onChange={(e) =>
                  setOptions({ ...options, prioritizeFacilityUtilization: e.target.checked })
                }
              />
              <label htmlFor="facilityUtil" className="text-sm text-gray-700">
                Μεγιστοποίηση χρήσης εγκαταστάσεων
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Τι θα γίνει:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Δημιουργία {stats.totalSlots - (options.respectExistingSlots ? existingSlotsCount : 0)} νέων slots</li>
          <li>• Για {stats.totalGroups} ομάδες × {stats.totalDays} ημέρες</li>
          <li>• Με {stats.hardConstraints} αυστηρούς και {stats.softConstraints} ευέλικτους περιορισμούς</li>
        </ul>
      </div>
    </div>
  );
}

// Step 3: Generating
function GeneratingStep({ progress }: { progress: GenerationProgress }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        {/* Spinner */}
        <div className="inline-block w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {progress.phase === 'initializing' && 'Αρχικοποίηση...'}
          {progress.phase === 'validating' && 'Έλεγχος περιορισμών...'}
          {progress.phase === 'generating' && 'Δημιουργία προγράμματος...'}
          {progress.phase === 'optimizing' && 'Βελτιστοποίηση...'}
          {progress.phase === 'finalizing' && 'Ολοκλήρωση...'}
        </h3>

        <p className="text-sm text-gray-500">
          {progress.message}
        </p>

        {/* Progress bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>{progress.slotsGenerated} slots</span>
            <span>{progress.percentage}%</span>
          </div>
        </div>

        {/* Current item */}
        {progress.currentGroup && progress.currentDay && (
          <div className="mt-4 text-sm text-gray-500">
            {progress.currentDay} - {progress.currentGroup}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 4: Results
function ResultsStep({
  result,
  activities,
  facilities,
  groups
}: {
  result: GenerationResult;
  activities: Activity[];
  facilities: Facility[];
  groups: Group[];
}) {
  const activityMap = new Map(activities.map(a => [a.id, a]));
  const facilityMap = new Map(facilities.map(f => [f.id, f]));
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Count activities in result
  const activityCounts = new Map<string, number>();
  result.slots.forEach(slot => {
    activityCounts.set(slot.activityId, (activityCounts.get(slot.activityId) || 0) + 1);
  });

  return (
    <div className="space-y-6">
      {/* Status */}
      <div
        className={`p-4 rounded-lg ${
          result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {result.status === 'completed' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'}
          </span>
          <div>
            <h3 className={`font-medium ${
              result.status === 'completed'
                ? 'text-green-800'
                : result.status === 'partial'
                ? 'text-yellow-800'
                : 'text-red-800'
            }`}>
              {result.status === 'completed' && 'Δημιουργία Ολοκληρώθηκε!'}
              {result.status === 'partial' && 'Μερική Δημιουργία'}
              {result.status === 'failed' && 'Αποτυχία Δημιουργίας'}
            </h3>
            <p className="text-sm text-gray-600">
              Δημιουργήθηκαν {result.slots.length} slots σε {(result.duration / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Βαθμολογία Προγράμματος</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary-600">
                {Math.round(result.score.total)}
              </div>
              <div className="text-sm text-gray-500">Συνολικό Score</div>
            </div>
            <div className="space-y-2">
              <ScoreBar label="Περιορισμοί" value={result.score.constraintScore} />
              <ScoreBar label="Ισορροπία" value={result.score.balanceScore} />
              <ScoreBar label="Ποικιλία" value={result.score.varietyScore} />
              <ScoreBar label="Χώροι" value={result.score.facilityUtilizationScore} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Στατιστικά</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-700">
                {result.stats.totalSlotsGenerated}
              </div>
              <div className="text-xs text-green-600">Νέα Slots</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-700">
                {result.stats.totalSlotsSkipped}
              </div>
              <div className="text-xs text-yellow-600">Αγνοήθηκαν</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-700">
                {result.stats.totalSlotsExisting}
              </div>
              <div className="text-xs text-gray-500">Υπάρχοντα</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Κατανομή Δραστηριοτήτων</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-auto">
            {Array.from(activityCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([activityId, count]) => {
                const activity = activityMap.get(activityId);
                return (
                  <div key={activityId} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: activity?.color || '#6B7280' }}
                    />
                    <div className="flex-1 text-sm">{activity?.name || activityId}</div>
                    <div className="text-sm font-medium text-gray-600">{count}</div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Violations */}
      {result.violations.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-700">
              Παραβιάσεις ({result.violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 max-h-32 overflow-auto">
              {result.violations.slice(0, 10).map((violation, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className={violation.isHard ? 'text-red-500' : 'text-yellow-500'}>
                    {violation.isHard ? '●' : '○'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-700">{violation.constraintName}</div>
                    <div className="text-gray-500 text-xs">{violation.message}</div>
                  </div>
                </li>
              ))}
              {result.violations.length > 10 && (
                <li className="text-xs text-gray-500">
                  ... και {result.violations.length - 10} ακόμα
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Score bar component
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-xs text-gray-500">{label}</div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-8 text-xs text-gray-600 text-right">{Math.round(value)}</div>
    </div>
  );
}
