'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';
import type { Database, ConstraintType, Json } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];

const CONSTRAINT_TYPES: { type: ConstraintType; label: string; description: string; icon: string; example: string }[] = [
  {
    type: 'time_restriction',
    label: 'Χρονικός Περιορισμός',
    description: 'Δραστηριότητα μόνο σε συγκεκριμένες ώρες',
    icon: '🕐',
    example: 'Κολύμβηση μόνο 10:00-12:00',
  },
  {
    type: 'sequence',
    label: 'Ακολουθία',
    description: 'Μετά από Α πρέπει/δεν πρέπει να ακολουθεί Β',
    icon: '➡️',
    example: 'Μετά από έντονη δραστηριότητα, όχι άλλη έντονη',
  },
  {
    type: 'daily_limit',
    label: 'Ημερήσιο Όριο',
    description: 'Μέγιστες φορές ανά ημέρα',
    icon: '📊',
    example: 'Κολύμβηση μέχρι 2 φορές/ημέρα',
  },
  {
    type: 'daily_minimum',
    label: 'Ημερήσιο Ελάχιστο',
    description: 'Τουλάχιστον Χ φορές την ημέρα',
    icon: '📈',
    example: 'Τουλάχιστον 1 αθλητική/ημέρα',
  },
  {
    type: 'consecutive_limit',
    label: 'Όριο Συνεχόμενων',
    description: 'Μέγιστες συνεχόμενες επαναλήψεις',
    icon: '🔁',
    example: 'Όχι ίδια δραστηριότητα 2+ φορές συνεχόμενα',
  },
  {
    type: 'staff_limit',
    label: 'Όριο Προσωπικού',
    description: 'Μέγιστες αναθέσεις προσωπικού ανά ημέρα',
    icon: '👥',
    example: 'Μέγιστο 4 slots/ημέρα ανά εκπαιδευτή',
  },
  {
    type: 'weather_substitute',
    label: 'Αντικατάσταση Καιρού',
    description: 'Εναλλακτική δραστηριότητα για κακοκαιρία',
    icon: '🌧️',
    example: 'Αν βρέχει, αντί Ποδόσφαιρο → Επιτραπέζια',
  },
  {
    type: 'facility_exclusive',
    label: 'Αποκλειστικότητα Χώρου',
    description: 'Μία ομάδα κάθε φορά στον χώρο',
    icon: '🏟️',
    example: 'Πισίνα: μόνο 1 ομάδα κάθε φορά',
  },
  {
    type: 'gap_required',
    label: 'Απαιτούμενο Κενό',
    description: 'Χρόνος ανάμεσα σε δραστηριότητες',
    icon: '⏸️',
    example: '30 λεπτά μετά το μεσημεριανό',
  },
  {
    type: 'group_separation',
    label: 'Διαχωρισμός Ομάδων',
    description: 'Ομάδες που δεν πρέπει να είναι μαζί',
    icon: '↔️',
    example: 'Αγόρια/Κορίτσια ξεχωριστά στην πισίνα',
  },
];

const TEMPLATES = [
  {
    name: 'Κολύμβηση μόνο πρωί',
    type: 'time_restriction' as ConstraintType,
    description: 'Η κολύμβηση επιτρέπεται μόνο 10:00-12:00',
    is_hard: true,
    priority: 8,
  },
  {
    name: 'Πισίνα: 1 ομάδα',
    type: 'facility_exclusive' as ConstraintType,
    description: 'Μόνο μία ομάδα στην πισίνα κάθε φορά',
    is_hard: true,
    priority: 10,
  },
  {
    name: 'Όχι 2 έντονες συνεχόμενα',
    type: 'sequence' as ConstraintType,
    description: 'Μετά από έντονη δραστηριότητα, η επόμενη να είναι ήπια',
    is_hard: false,
    priority: 6,
  },
  {
    name: 'Διάλειμμα μετά το φαγητό',
    type: 'gap_required' as ConstraintType,
    description: '30 λεπτά διάλειμμα μετά το μεσημεριανό',
    is_hard: true,
    priority: 9,
  },
  {
    name: 'Μέγιστο 4 αναθέσεις/εκπαιδευτή',
    type: 'staff_limit' as ConstraintType,
    description: 'Κάθε εκπαιδευτής μέχρι 4 slots/ημέρα',
    is_hard: false,
    priority: 5,
  },
];

const STEP_LABELS = [
  { step: 1, name: 'Τύπος', icon: '🎯' },
  { step: 2, name: 'Εμβέλεια', icon: '📍' },
  { step: 3, name: 'Συνθήκη', icon: '⚡' },
  { step: 4, name: 'Ρυθμίσεις', icon: '⚙️' },
];

export default function NewConstraintPage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  // Wizard state
  const [step, setStep] = useState(1);

  // Data
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [constraintType, setConstraintType] = useState<ConstraintType | ''>('');
  const [scopeType, setScopeType] = useState<'organization' | 'session'>('organization');
  const [sessionId, setSessionId] = useState('');
  const [isHard, setIsHard] = useState(true);
  const [priority, setPriority] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  // Scope selectors
  const [scopeActivities, setScopeActivities] = useState<string[]>([]);
  const [scopeFacilities, setScopeFacilities] = useState<string[]>([]);
  const [scopeGroups, setScopeGroups] = useState<string[]>([]);

  // Condition fields (varies by type)
  const [conditionTimeStart, setConditionTimeStart] = useState('');
  const [conditionTimeEnd, setConditionTimeEnd] = useState('');
  const [conditionLimit, setConditionLimit] = useState('');
  const [conditionMinutes, setConditionMinutes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadData();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const [sessionsRes, activitiesRes, facilitiesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .in('status', ['draft', 'planning', 'active']),
        supabase
          .from('activities')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .eq('is_active', true),
        supabase
          .from('facilities')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .eq('is_active', true),
      ]);

      setSessions(sessionsRes.data || []);
      setActivities(activitiesRes.data || []);
      setFacilities(facilitiesRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load groups when session changes
  useEffect(() => {
    if (sessionId) {
      loadGroups();
    } else {
      setGroups([]);
    }
  }, [sessionId]);

  const loadGroups = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('session_id', sessionId)
        .is('deleted_at', null)
        .eq('is_active', true);

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error loading groups:', error);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setConstraintType(template.type);
    setIsHard(template.is_hard);
    setPriority(template.priority);
    setStep(2);
  };

  const buildScope = (): Json => {
    const scope: { [key: string]: Json } = {};
    if (scopeActivities.length > 0) scope.activity_ids = scopeActivities;
    if (scopeFacilities.length > 0) scope.facility_ids = scopeFacilities;
    if (scopeGroups.length > 0) scope.group_ids = scopeGroups;
    return scope;
  };

  const buildCondition = (): Json => {
    const condition: { [key: string]: Json } = {};

    switch (constraintType) {
      case 'time_restriction':
        if (conditionTimeStart) condition.start_time = conditionTimeStart;
        if (conditionTimeEnd) condition.end_time = conditionTimeEnd;
        break;
      case 'daily_limit':
      case 'daily_minimum':
      case 'consecutive_limit':
      case 'staff_limit':
        if (conditionLimit) condition.limit = parseInt(conditionLimit);
        break;
      case 'gap_required':
        if (conditionMinutes) condition.minutes = parseInt(conditionMinutes);
        break;
    }

    return condition;
  };

  const handleSubmit = async () => {
    if (!currentOrganization) {
      setError('Δεν έχεις επιλέξει οργανισμό.');
      return;
    }

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    if (!constraintType) {
      setError('Επίλεξε τύπο περιορισμού.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('constraints')
        .insert({
          organization_id: scopeType === 'organization' ? currentOrganization.id : null,
          session_id: scopeType === 'session' ? sessionId : null,
          name: name.trim(),
          description: description.trim() || null,
          constraint_type: constraintType,
          is_hard: isHard,
          priority,
          is_active: true,
          scope: buildScope(),
          condition: buildCondition(),
          action: {},
          error_message: errorMessage.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      router.push('/dashboard/constraints');
    } catch (error: any) {
      console.error('Error creating constraint:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (orgLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard/constraints" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στους Περιορισμούς
      </Link>

      <PageHeader
        title="Νέος Περιορισμός"
        description="Δημιούργησε έναν κανόνα για τη δημιουργία προγράμματος"
        icon="⚡"
        helpText="Οι Περιορισμοί (Constraints) είναι κανόνες που πρέπει να τηρούνται κατά τη δημιουργία προγράμματος. Για παράδειγμα: 'η κολύμβηση γίνεται μόνο πρωί', 'μετά το φαγητό 30 λεπτά διάλειμμα', 'η πισίνα δέχεται μόνο 1 ομάδα κάθε φορά'."
        tips={[
          'Ξεκίνα με τους πιο σημαντικούς περιορισμούς (ασφάλεια, χωρητικότητα)',
          'Χρησιμοποίησε «Αυστηρούς» για απόλυτους κανόνες, «Ευέλικτους» για προτιμήσεις',
          'Δοκίμασε τα έτοιμα πρότυπα για γρήγορη εκκίνηση'
        ]}
      />

      {/* Progress Steps */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((s, idx) => (
            <div key={s.step} className="flex items-center">
              <button
                onClick={() => s.step < step && setStep(s.step)}
                disabled={s.step > step}
                className={`flex flex-col items-center ${s.step <= step ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-medium transition-colors ${
                    step === s.step
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : step > s.step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.step ? '✓' : s.icon}
                </div>
                <span className={`mt-1 text-xs ${step === s.step ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                  {s.name}
                </span>
              </button>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`h-1 w-12 sm:w-20 mx-2 rounded ${
                    step > s.step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-6">
          <FormSection
            title="Επίλεξε Τύπο Περιορισμού"
            description="Τι είδους κανόνα θέλεις να δημιουργήσεις;"
            icon="🎯"
            required
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {CONSTRAINT_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  type="button"
                  onClick={() => {
                    setConstraintType(ct.type);
                    nextStep();
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                    constraintType === ct.type
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ct.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{ct.label}</div>
                      <div className="text-xs text-gray-500 truncate">{ct.description}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 italic bg-gray-50 p-2 rounded">
                    π.χ. {ct.example}
                  </div>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ⚡ Έτοιμα Πρότυπα
              </CardTitle>
              <CardDescription>
                Ξεκίνα γρήγορα με έναν συνηθισμένο περιορισμό - κάνε κλικ για να τον φορτώσεις
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-primary-50 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          template.is_hard
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {template.is_hard ? 'Αυστηρός' : 'Ευέλικτος'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <InfoBox type="info" title="Αυστηρός vs Ευέλικτος">
            <ul className="space-y-1">
              <li><strong>Αυστηρός (Hard):</strong> Δεν επιτρέπεται παραβίαση - αν δεν τηρηθεί, δεν μπορεί να δημιουργηθεί πρόγραμμα</li>
              <li><strong>Ευέλικτος (Soft):</strong> Προτιμάται η τήρηση, αλλά μπορεί να παραβιαστεί αν είναι απαραίτητο</li>
            </ul>
          </InfoBox>
        </div>
      )}

      {/* Step 2: Define Scope */}
      {step === 2 && (
        <div className="space-y-6">
          <FormSection
            title="Εμβέλεια Περιορισμού"
            description="Πού ισχύει αυτός ο περιορισμός;"
            icon="📍"
            required
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  scopeType === 'organization' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="scopeType"
                    checked={scopeType === 'organization'}
                    onChange={() => setScopeType('organization')}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌍</span>
                      <span className="font-medium text-gray-900">Global</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ισχύει σε όλες τις περιόδους
                    </p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  scopeType === 'session' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="scopeType"
                    checked={scopeType === 'session'}
                    onChange={() => setScopeType('session')}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <span className="font-medium text-gray-900">Συγκεκριμένη Περίοδος</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ισχύει μόνο σε μία περίοδο
                    </p>
                  </div>
                </label>
              </div>

              {scopeType === 'session' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Περίοδος</label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Επίλεξε περίοδο...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <FieldHelp text="Ο περιορισμός θα ισχύει μόνο για αυτή την περίοδο" />
                </div>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Εφαρμόζεται σε"
            description="Ποιες δραστηριότητες/εγκαταστάσεις αφορά (προαιρετικό)"
            icon="🎯"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Δραστηριότητες
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {activities.length > 0 ? (
                    activities.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={scopeActivities.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScopeActivities([...scopeActivities, a.id]);
                            } else {
                              setScopeActivities(scopeActivities.filter(id => id !== a.id));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                        />
                        <span
                          className="w-3 h-3 rounded flex-shrink-0"
                          style={{ backgroundColor: a.color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-700">{a.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 py-4 text-center">
                      Δεν υπάρχουν δραστηριότητες. <Link href="/dashboard/activities/new" className="text-primary-600 hover:underline">Πρόσθεσε μία</Link>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {scopeActivities.length === 0 ? '📌 Αν δεν επιλέξεις, ισχύει για όλες τις δραστηριότητες' : `✓ ${scopeActivities.length} επιλεγμένες`}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Χώροι
                </label>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {facilities.length > 0 ? (
                    facilities.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={scopeFacilities.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScopeFacilities([...scopeFacilities, f.id]);
                            } else {
                              setScopeFacilities(scopeFacilities.filter(id => id !== f.id));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{f.name}</span>
                        {f.indoor && <span className="text-xs text-gray-400">(εσωτ.)</span>}
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 py-4 text-center">
                      Δεν υπάρχουν χώροι. <Link href="/dashboard/facilities/new" className="text-primary-600 hover:underline">Πρόσθεσε έναν</Link>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {scopeFacilities.length === 0 ? '📌 Αν δεν επιλέξεις, ισχύει για όλους τους χώρους' : `✓ ${scopeFacilities.length} επιλεγμένοι`}
                </p>
              </div>
            </div>
          </FormSection>

          <Card>
            <CardFooter className="flex justify-between py-4">
              <Button variant="outline" onClick={prevStep}>
                ← Πίσω
              </Button>
              <Button onClick={nextStep}>
                Συνέχεια →
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 3: Set Condition */}
      {step === 3 && (
        <div className="space-y-6">
          <FormSection
            title="Συνθήκη Περιορισμού"
            description={`Ρύθμισε τις παραμέτρους για τον τύπο: ${CONSTRAINT_TYPES.find(ct => ct.type === constraintType)?.label}`}
            icon="⚡"
            required
          >
            {constraintType === 'time_restriction' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Από ώρα</label>
                    <Input
                      type="time"
                      value={conditionTimeStart}
                      onChange={(e) => setConditionTimeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Έως ώρα</label>
                    <Input
                      type="time"
                      value={conditionTimeEnd}
                      onChange={(e) => setConditionTimeEnd(e.target.value)}
                    />
                  </div>
                </div>
                <InfoBox type="info">
                  Οι επιλεγμένες δραστηριότητες θα επιτρέπονται <strong>μόνο</strong> μέσα σε αυτό το χρονικό διάστημα.
                </InfoBox>
              </div>
            )}

            {(constraintType === 'daily_limit' || constraintType === 'daily_minimum') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {constraintType === 'daily_limit' ? 'Μέγιστες φορές/ημέρα' : 'Ελάχιστες φορές/ημέρα'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={conditionLimit}
                    onChange={(e) => setConditionLimit(e.target.value)}
                    placeholder="π.χ. 2"
                    className="max-w-xs"
                  />
                  <FieldHelp
                    text={constraintType === 'daily_limit'
                      ? 'Η δραστηριότητα δεν μπορεί να εμφανιστεί περισσότερες φορές'
                      : 'Η δραστηριότητα πρέπει να εμφανιστεί τουλάχιστον τόσες φορές'}
                    example={constraintType === 'daily_limit' ? 'Κολύμβηση max 2 φορές/ημέρα' : 'Τουλάχιστον 1 αθλητική/ημέρα'}
                  />
                </div>
              </div>
            )}

            {constraintType === 'consecutive_limit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Μέγιστες συνεχόμενες φορές
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={conditionLimit}
                    onChange={(e) => setConditionLimit(e.target.value)}
                    placeholder="π.χ. 1"
                    className="max-w-xs"
                  />
                  <FieldHelp
                    text="Αν βάλεις 1, η ίδια δραστηριότητα δεν μπορεί να γίνει 2 φορές στη σειρά"
                    example="Όχι Ποδόσφαιρο → Ποδόσφαιρο"
                  />
                </div>
              </div>
            )}

            {constraintType === 'staff_limit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Μέγιστα slots/εκπαιδευτή/ημέρα
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={conditionLimit}
                    onChange={(e) => setConditionLimit(e.target.value)}
                    placeholder="π.χ. 4"
                    className="max-w-xs"
                  />
                  <FieldHelp
                    text="Κάθε μέλος προσωπικού μπορεί να αναλάβει το πολύ τόσα slots/ημέρα"
                  />
                </div>
              </div>
            )}

            {constraintType === 'gap_required' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Απαιτούμενο κενό (λεπτά)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={conditionMinutes}
                    onChange={(e) => setConditionMinutes(e.target.value)}
                    placeholder="π.χ. 30"
                    className="max-w-xs"
                  />
                  <FieldHelp
                    text="Πρέπει να υπάρχει τουλάχιστον αυτό το κενό μετά τις επιλεγμένες δραστηριότητες"
                    example="30 λεπτά μετά το φαγητό πριν από κολύμβηση"
                  />
                </div>
              </div>
            )}

            {(constraintType === 'sequence' || constraintType === 'weather_substitute' ||
              constraintType === 'facility_exclusive' || constraintType === 'group_separation') && (
              <InfoBox type="info" title="Αυτόματη ρύθμιση">
                Αυτός ο τύπος περιορισμού χρησιμοποιεί αυτόματα τις επιλεγμένες
                δραστηριότητες και εγκαταστάσεις από το προηγούμενο βήμα.
                <br /><br />
                <strong>Πώς λειτουργεί:</strong>
                <ul className="list-disc ml-4 mt-2">
                  {constraintType === 'sequence' && <li>Οι επιλεγμένες δραστηριότητες δεν μπορούν να ακολουθήσουν η μία την άλλη</li>}
                  {constraintType === 'facility_exclusive' && <li>Οι επιλεγμένοι χώροι δέχονται μόνο μία ομάδα κάθε φορά</li>}
                  {constraintType === 'group_separation' && <li>Οι ομάδες που θα επιλέξεις δεν μπορούν να έχουν δραστηριότητα ταυτόχρονα</li>}
                  {constraintType === 'weather_substitute' && <li>Όταν ο καιρός δεν επιτρέπει υπαίθριες δραστηριότητες, γίνεται αντικατάσταση</li>}
                </ul>
              </InfoBox>
            )}
          </FormSection>

          <Card>
            <CardFooter className="flex justify-between py-4">
              <Button variant="outline" onClick={prevStep}>
                ← Πίσω
              </Button>
              <Button onClick={nextStep}>
                Συνέχεια →
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 4: Configure */}
      {step === 4 && (
        <div className="space-y-6">
          <FormSection
            title="Ονομασία & Περιγραφή"
            description="Δώσε ένα αναγνωρίσιμο όνομα"
            icon="📝"
            required
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Όνομα Περιορισμού *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="π.χ. Κολύμβηση μόνο πρωί"
                />
                <FieldHelp text="Ένα σύντομο, περιγραφικό όνομα" example="Μέγιστο 2 κολύμπι/ημέρα, Πισίνα: 1 ομάδα" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Περιγραφή</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Γιατί υπάρχει αυτός ο περιορισμός..."
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Τύπος Περιορισμού"
            description="Πόσο αυστηρός είναι;"
            icon="⚖️"
            required
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                isHard ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="isHard"
                  checked={isHard}
                  onChange={() => setIsHard(true)}
                  className="h-5 w-5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔴</span>
                    <span className="font-medium text-red-800">Αυστηρός (Hard)</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Δεν επιτρέπεται παραβίαση - απόλυτος κανόνας
                  </p>
                </div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                !isHard ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="isHard"
                  checked={!isHard}
                  onChange={() => setIsHard(false)}
                  className="h-5 w-5 text-yellow-600 focus:ring-yellow-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🟡</span>
                    <span className="font-medium text-yellow-800">Ευέλικτος (Soft)</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Προτιμάται αλλά μπορεί να παραβιαστεί
                  </p>
                </div>
              </label>
            </div>

            {!isHard && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Προτεραιότητα: <strong>{priority}/10</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Χαμηλή</span>
                  <span>Υψηλή</span>
                </div>
                <FieldHelp text="Υψηλότερη = πιο σημαντικό να τηρηθεί" />
              </div>
            )}
          </FormSection>

          <FormSection
            title="Μήνυμα Σφάλματος"
            description="Τι να εμφανίζεται όταν παραβιάζεται"
            icon="💬"
          >
            <Input
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="π.χ. Η κολύμβηση επιτρέπεται μόνο 10:00-12:00"
            />
            <FieldHelp text="Εμφανίζεται όταν κάποιος προσπαθεί να παραβιάσει τον περιορισμό" />
          </FormSection>

          {/* Summary */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📋 Σύνοψη
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Τύπος:</span>
                  <span className="font-medium">
                    {CONSTRAINT_TYPES.find(ct => ct.type === constraintType)?.icon}{' '}
                    {CONSTRAINT_TYPES.find(ct => ct.type === constraintType)?.label || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Εμβέλεια:</span>
                  <span className="font-medium">
                    {scopeType === 'organization' ? '🌍 Global' : `📅 ${sessions.find(s => s.id === sessionId)?.name || '-'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Δραστηριότητες:</span>
                  <span className="font-medium">
                    {scopeActivities.length === 0 ? 'Όλες' : `${scopeActivities.length} επιλεγμένες`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Είδος:</span>
                  <span className={`font-medium ${isHard ? 'text-red-600' : 'text-yellow-600'}`}>
                    {isHard ? '🔴 Αυστηρός' : `🟡 Ευέλικτος (${priority}/10)`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardFooter className="flex justify-between py-4">
              <Button variant="outline" onClick={prevStep}>
                ← Πίσω
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Αποθήκευση...' : '✓ Δημιουργία Περιορισμού'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
