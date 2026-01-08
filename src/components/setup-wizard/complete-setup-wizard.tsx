'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CompleteSetupWizardProps {
  onClose?: () => void;
  onComplete?: () => void;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

const QUICK_ACTIVITIES = [
  { name: 'Κολύμβηση', icon: '🏊', duration: 45, selected: true },
  { name: 'Ποδόσφαιρο', icon: '⚽', duration: 60, selected: true },
  { name: 'Χειροτεχνία', icon: '🎨', duration: 45, selected: true },
  { name: 'Μουσική', icon: '🎵', duration: 30, selected: false },
  { name: 'Θέατρο', icon: '🎭', duration: 45, selected: false },
  { name: 'Αθλοπαιδιές', icon: '🏃', duration: 45, selected: true },
  { name: 'Πεζοπορία', icon: '🥾', duration: 90, selected: false },
  { name: 'Μπάσκετ', icon: '🏀', duration: 45, selected: false },
  { name: 'Βόλεϊ', icon: '🏐', duration: 45, selected: false },
  { name: 'Αναρρίχηση', icon: '🧗', duration: 60, selected: false },
];

const QUICK_FACILITIES = [
  { name: 'Πισίνα', icon: '🏊', capacity: 30, selected: true },
  { name: 'Γήπεδο Ποδοσφαίρου', icon: '⚽', capacity: 40, selected: true },
  { name: 'Αίθουσα Χειροτεχνίας', icon: '🎨', capacity: 25, selected: true },
  { name: 'Αμφιθέατρο', icon: '🎭', capacity: 100, selected: true },
  { name: 'Τραπεζαρία', icon: '🍽️', capacity: 150, selected: false },
  { name: 'Γυμναστήριο', icon: '💪', capacity: 30, selected: false },
  { name: 'Γήπεδο Μπάσκετ', icon: '🏀', capacity: 20, selected: false },
  { name: 'Γήπεδο Βόλεϊ', icon: '🏐', capacity: 16, selected: false },
];

const QUICK_GROUPS = [
  { name: 'Αστεράκια', icon: '⭐', ageMin: 6, ageMax: 8, selected: true },
  { name: 'Δελφινάκια', icon: '🐬', ageMin: 9, ageMax: 10, selected: true },
  { name: 'Αετοί', icon: '🦅', ageMin: 11, ageMax: 12, selected: true },
  { name: 'Λιοντάρια', icon: '🦁', ageMin: 13, ageMax: 15, selected: true },
];

type Step = 'session' | 'groups' | 'activities' | 'facilities' | 'review';

const STEPS: { id: Step; title: string; icon: string; description: string }[] = [
  { id: 'session', title: 'Περίοδος', icon: '📅', description: 'Ορισμός περιόδου' },
  { id: 'groups', title: 'Ομάδες', icon: '👥', description: 'Επιλογή ομάδων' },
  { id: 'activities', title: 'Δραστηριότητες', icon: '🎯', description: 'Επιλογή δραστηριοτήτων' },
  { id: 'facilities', title: 'Εγκαταστάσεις', icon: '🏟️', description: 'Επιλογή εγκαταστάσεων' },
  { id: 'review', title: 'Ολοκλήρωση', icon: '✅', description: 'Επισκόπηση & Δημιουργία' },
];

export function CompleteSetupWizard({ onClose, onComplete }: CompleteSetupWizardProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [currentStep, setCurrentStep] = useState<Step>('session');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session data
  const [sessionName, setSessionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selections
  const [selectedGroups, setSelectedGroups] = useState(() =>
    QUICK_GROUPS.filter(g => g.selected).map(g => g.name)
  );
  const [selectedActivities, setSelectedActivities] = useState(() =>
    QUICK_ACTIVITIES.filter(a => a.selected).map(a => a.name)
  );
  const [selectedFacilities, setSelectedFacilities] = useState(() =>
    QUICK_FACILITIES.filter(f => f.selected).map(f => f.name)
  );

  // Custom additions
  const [customGroup, setCustomGroup] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [customFacility, setCustomFacility] = useState('');

  const supabase = createClient();

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endOfMonth = new Date(nextMonth);
    endOfMonth.setDate(endOfMonth.getDate() + 14);

    setStartDate(nextMonth.toISOString().split('T')[0]);
    setEndDate(endOfMonth.toISOString().split('T')[0]);

    const year = nextMonth.getFullYear();
    const monthName = nextMonth.toLocaleDateString('el-GR', { month: 'long' });
    setSessionName(`Καλοκαίρι ${year} - ${monthName}`);
  }, []);

  const toggleGroup = (name: string) => {
    setSelectedGroups(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleActivity = (name: string) => {
    setSelectedActivities(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleFacility = (name: string) => {
    setSelectedFacilities(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const addCustomGroup = () => {
    if (customGroup.trim() && !selectedGroups.includes(customGroup.trim())) {
      setSelectedGroups(prev => [...prev, customGroup.trim()]);
      setCustomGroup('');
    }
  };

  const addCustomActivity = () => {
    if (customActivity.trim() && !selectedActivities.includes(customActivity.trim())) {
      setSelectedActivities(prev => [...prev, customActivity.trim()]);
      setCustomActivity('');
    }
  };

  const addCustomFacility = () => {
    if (customFacility.trim() && !selectedFacilities.includes(customFacility.trim())) {
      setSelectedFacilities(prev => [...prev, customFacility.trim()]);
      setCustomFacility('');
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const nextStep = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const prevStep = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  const handleComplete = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          organization_id: currentOrganization.id,
          name: sessionName,
          start_date: startDate,
          end_date: endDate,
          status: 'planning',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Create activities
      if (selectedActivities.length > 0) {
        const activities = selectedActivities.map((name, idx) => {
          const preset = QUICK_ACTIVITIES.find(a => a.name === name);
          return {
            organization_id: currentOrganization.id,
            name,
            color: COLORS[idx % COLORS.length],
            duration_minutes: preset?.duration || 45,
            is_active: true,
          };
        });

        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(activities);

        if (activitiesError) throw activitiesError;
      }

      // 3. Create facilities
      if (selectedFacilities.length > 0) {
        const facilities = selectedFacilities.map((name) => {
          const preset = QUICK_FACILITIES.find(f => f.name === name);
          return {
            organization_id: currentOrganization.id,
            name,
            capacity: preset?.capacity || null,
            is_active: true,
          };
        });

        const { error: facilitiesError } = await supabase
          .from('facilities')
          .insert(facilities);

        if (facilitiesError) throw facilitiesError;
      }

      // 4. Create groups
      if (selectedGroups.length > 0) {
        const groups = selectedGroups.map((name, idx) => {
          const preset = QUICK_GROUPS.find(g => g.name === name);
          return {
            session_id: session.id,
            name,
            color: COLORS[idx % COLORS.length],
            age_min: preset?.ageMin || null,
            age_max: preset?.ageMax || null,
            is_active: true,
          };
        });

        const { error: groupsError } = await supabase
          .from('groups')
          .insert(groups);

        if (groupsError) throw groupsError;
      }

      onComplete?.();
      router.push('/dashboard/schedule');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'session':
        return sessionName.trim() && startDate && endDate;
      case 'groups':
        return selectedGroups.length > 0;
      case 'activities':
        return selectedActivities.length > 0;
      case 'facilities':
        return selectedFacilities.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Γρήγορη Ρύθμιση Camp</h2>
              <p className="text-primary-100 text-sm mt-1">
                Ρύθμισε τα πάντα σε λίγα λεπτά
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={idx > currentStepIndex}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                    currentStep === step.id
                      ? 'bg-white text-primary-700 font-medium shadow-lg'
                      : idx < currentStepIndex
                        ? 'bg-white/20 text-white hover:bg-white/30 cursor-pointer'
                        : 'bg-white/10 text-white/60 cursor-not-allowed'
                  )}
                >
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    idx < currentStepIndex ? 'bg-white/40' : 'bg-white/20'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Step: Session */}
          {currentStep === 'session' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <span className="text-5xl">📅</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Δημιουργία Περιόδου
                </h3>
                <p className="text-gray-500 mt-2">
                  Η περίοδος καθορίζει πότε θα λειτουργήσει το camp σου
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Όνομα Περιόδου
                  </label>
                  <Input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="π.χ. Καλοκαίρι 2025 - Ιούνιος"
                    className="text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Έναρξη
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Λήξη
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-blue-700">
                      Διάρκεια:{' '}
                      <strong>
                        {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} ημέρες
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Groups */}
          {currentStep === 'groups' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <span className="text-5xl">👥</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Επιλογή Ομάδων
                </h3>
                <p className="text-gray-500 mt-2">
                  Επίλεξε τις ομάδες που θα έχει το camp σου
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_GROUPS.map((group) => (
                  <button
                    key={group.name}
                    onClick={() => toggleGroup(group.name)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      selectedGroups.includes(group.name)
                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-3xl block mb-2">{group.icon}</span>
                    <span className="font-medium text-gray-900">{group.name}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {group.ageMin}-{group.ageMax} ετών
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom group */}
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  placeholder="Προσθήκη δικής σου ομάδας..."
                  onKeyPress={(e) => e.key === 'Enter' && addCustomGroup()}
                />
                <Button onClick={addCustomGroup} variant="outline">
                  Προσθήκη
                </Button>
              </div>

              {/* Custom groups display */}
              {selectedGroups.filter(g => !QUICK_GROUPS.find(qg => qg.name === g)).length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedGroups
                    .filter(g => !QUICK_GROUPS.find(qg => qg.name === g))
                    .map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {group}
                        <button
                          onClick={() => toggleGroup(group)}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                Επιλεγμένες: <strong>{selectedGroups.length}</strong> ομάδες
              </p>
            </div>
          )}

          {/* Step: Activities */}
          {currentStep === 'activities' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <span className="text-5xl">🎯</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Επιλογή Δραστηριοτήτων
                </h3>
                <p className="text-gray-500 mt-2">
                  Επίλεξε τι δραστηριότητες θα κάνει το camp σου
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {QUICK_ACTIVITIES.map((activity) => (
                  <button
                    key={activity.name}
                    onClick={() => toggleActivity(activity.name)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all',
                      selectedActivities.includes(activity.name)
                        ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-2xl block mb-1">{activity.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{activity.name}</span>
                    <p className="text-xs text-gray-500">{activity.duration}΄</p>
                  </button>
                ))}
              </div>

              {/* Custom activity */}
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="Προσθήκη δικής σου δραστηριότητας..."
                  onKeyPress={(e) => e.key === 'Enter' && addCustomActivity()}
                />
                <Button onClick={addCustomActivity} variant="outline">
                  Προσθήκη
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500">
                Επιλεγμένες: <strong>{selectedActivities.length}</strong> δραστηριότητες
              </p>
            </div>
          )}

          {/* Step: Facilities */}
          {currentStep === 'facilities' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <span className="text-5xl">🏟️</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Επιλογή Εγκαταστάσεων
                </h3>
                <p className="text-gray-500 mt-2">
                  Επίλεξε τους χώρους που διαθέτει το camp σου
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_FACILITIES.map((facility) => (
                  <button
                    key={facility.name}
                    onClick={() => toggleFacility(facility.name)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      selectedFacilities.includes(facility.name)
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-2xl block mb-2">{facility.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{facility.name}</span>
                    {facility.capacity && (
                      <p className="text-xs text-gray-500">Χωρ. {facility.capacity}</p>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom facility */}
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  value={customFacility}
                  onChange={(e) => setCustomFacility(e.target.value)}
                  placeholder="Προσθήκη δικής σου εγκατάστασης..."
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFacility()}
                />
                <Button onClick={addCustomFacility} variant="outline">
                  Προσθήκη
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500">
                Επιλεγμένες: <strong>{selectedFacilities.length}</strong> εγκαταστάσεις
              </p>
            </div>
          )}

          {/* Step: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <span className="text-5xl">✅</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Επισκόπηση & Ολοκλήρωση
                </h3>
                <p className="text-gray-500 mt-2">
                  Έλεγξε τις επιλογές σου και ξεκίνα!
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Session */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📅</span>
                    <h4 className="font-semibold text-gray-900">Περίοδος</h4>
                  </div>
                  <p className="font-medium text-gray-900">{sessionName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(startDate).toLocaleDateString('el-GR')} - {new Date(endDate).toLocaleDateString('el-GR')}
                  </p>
                </div>

                {/* Groups */}
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">👥</span>
                    <h4 className="font-semibold text-gray-900">
                      Ομάδες ({selectedGroups.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedGroups.map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎯</span>
                    <h4 className="font-semibold text-gray-900">
                      Δραστηριότητες ({selectedActivities.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedActivities.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Facilities */}
                <div className="p-4 bg-cyan-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🏟️</span>
                    <h4 className="font-semibold text-gray-900">
                      Εγκαταστάσεις ({selectedFacilities.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedFacilities.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-green-800">
                  Μόλις πατήσεις <strong>Ολοκλήρωση</strong>, θα δημιουργηθούν όλα τα παραπάνω
                  και θα μεταφερθείς στο πρόγραμμα!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={currentStepIndex === 0 ? onClose : prevStep}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            {currentStepIndex === 0 ? (
              'Ακύρωση'
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Προηγούμενο
              </>
            )}
          </button>

          {currentStep === 'review' ? (
            <Button onClick={handleComplete} disabled={loading} className="min-w-[150px]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Δημιουργία...
                </span>
              ) : (
                '🚀 Ολοκλήρωση'
              )}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Επόμενο
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
