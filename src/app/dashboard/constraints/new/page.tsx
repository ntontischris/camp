'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="mb-8">
        <Link href="/dashboard/constraints" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στους Περιορισμούς
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέος Περιορισμός</h1>
        <p className="mt-2 text-gray-600">
          Δημιούργησε έναν κανόνα για τη δημιουργία προγράμματος
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-16 sm:w-24 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Τύπος</span>
          <span>Εμβέλεια</span>
          <span>Συνθήκη</span>
          <span>Ρυθμίσεις</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Επίλεξε Τύπο</CardTitle>
              <CardDescription>Τι είδους περιορισμό θέλεις να δημιουργήσεις;</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {CONSTRAINT_TYPES.map((ct) => (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => {
                      setConstraintType(ct.type);
                      nextStep();
                    }}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      constraintType === ct.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ct.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{ct.label}</div>
                        <div className="text-xs text-gray-500">{ct.description}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 italic">
                      π.χ. {ct.example}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Έτοιμα Πρότυπα</CardTitle>
              <CardDescription>Ξεκίνα με ένα συνηθισμένο περιορισμό</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
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
        </div>
      )}

      {/* Step 2: Define Scope */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Εμβέλεια & Εφαρμογή</CardTitle>
            <CardDescription>Σε τι εφαρμόζεται αυτός ο περιορισμός;</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Εμβέλεια</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scopeType"
                    checked={scopeType === 'organization'}
                    onChange={() => setScopeType('organization')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Global (όλες οι περίοδοι)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scopeType"
                    checked={scopeType === 'session'}
                    onChange={() => setScopeType('session')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Συγκεκριμένη περίοδος</span>
                </label>
              </div>
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
              </div>
            )}

            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Εφαρμόζεται σε:</h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Δραστηριότητες
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded border border-gray-200 p-2">
                    {activities.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
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
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: a.color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-700">{a.name}</span>
                      </label>
                    ))}
                    {activities.length === 0 && (
                      <div className="text-sm text-gray-400 py-2">Δεν υπάρχουν δραστηριότητες</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {scopeActivities.length === 0 ? 'Όλες οι δραστηριότητες' : `${scopeActivities.length} επιλεγμένες`}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Εγκαταστάσεις
                  </label>
                  <div className="max-h-32 overflow-y-auto rounded border border-gray-200 p-2">
                    {facilities.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
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
                      </label>
                    ))}
                    {facilities.length === 0 && (
                      <div className="text-sm text-gray-400 py-2">Δεν υπάρχουν εγκαταστάσεις</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {scopeFacilities.length === 0 ? 'Όλες οι εγκαταστάσεις' : `${scopeFacilities.length} επιλεγμένες`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                Πίσω
              </Button>
              <Button onClick={nextStep}>
                Συνέχεια
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Set Condition */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Συνθήκη</CardTitle>
            <CardDescription>Ποια είναι η συνθήκη του περιορισμού;</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {constraintType === 'time_restriction' && (
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
                <p className="sm:col-span-2 text-sm text-gray-500">
                  Οι επιλεγμένες δραστηριότητες επιτρέπονται μόνο σε αυτό το χρονικό διάστημα
                </p>
              </div>
            )}

            {(constraintType === 'daily_limit' || constraintType === 'daily_minimum') && (
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
                />
              </div>
            )}

            {constraintType === 'consecutive_limit' && (
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
                />
                <p className="text-sm text-gray-500">
                  Π.χ. αν βάλεις 1, δεν μπορεί η ίδια δραστηριότητα 2 φορές στη σειρά
                </p>
              </div>
            )}

            {constraintType === 'staff_limit' && (
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
                />
              </div>
            )}

            {constraintType === 'gap_required' && (
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
                />
              </div>
            )}

            {(constraintType === 'sequence' || constraintType === 'weather_substitute' ||
              constraintType === 'facility_exclusive' || constraintType === 'group_separation') && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Πληροφορία:</p>
                <p>
                  Αυτός ο τύπος περιορισμού χρησιμοποιεί αυτόματα τις επιλεγμένες
                  δραστηριότητες και εγκαταστάσεις από το προηγούμενο βήμα.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                Πίσω
              </Button>
              <Button onClick={nextStep}>
                Συνέχεια
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Configure */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Ρυθμίσεις</CardTitle>
            <CardDescription>Τελικές ρυθμίσεις του περιορισμού</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Όνομα *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Κολύμβηση μόνο πρωί"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Περιγραφή</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Περιγραφή του περιορισμού..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Είδος Περιορισμού</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isHard"
                    checked={isHard}
                    onChange={() => setIsHard(true)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-red-700">Αυστηρός (Hard)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isHard"
                    checked={!isHard}
                    onChange={() => setIsHard(false)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-yellow-700">Ευέλικτος (Soft)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {isHard
                  ? 'Δεν επιτρέπεται παραβίαση - το πρόγραμμα θα απορριφθεί'
                  : 'Προτιμάται η τήρηση αλλά μπορεί να παραβιαστεί αν χρειαστεί'}
              </p>
            </div>

            {!isHard && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Προτεραιότητα: {priority}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Υψηλότερη = πιο σημαντικό να τηρηθεί
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Μήνυμα Σφάλματος (προαιρετικό)
              </label>
              <Input
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="π.χ. Η κολύμβηση επιτρέπεται μόνο 10:00-12:00"
              />
              <p className="text-xs text-gray-500">
                Εμφανίζεται όταν παραβιάζεται ο περιορισμός
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Σύνοψη:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <strong>Τύπος:</strong>{' '}
                  {CONSTRAINT_TYPES.find(ct => ct.type === constraintType)?.label || '-'}
                </li>
                <li>
                  <strong>Εμβέλεια:</strong>{' '}
                  {scopeType === 'organization' ? 'Global' : sessions.find(s => s.id === sessionId)?.name || '-'}
                </li>
                <li>
                  <strong>Δραστηριότητες:</strong>{' '}
                  {scopeActivities.length === 0 ? 'Όλες' : `${scopeActivities.length} επιλεγμένες`}
                </li>
                <li>
                  <strong>Είδος:</strong>{' '}
                  {isHard ? 'Αυστηρός' : `Ευέλικτος (${priority}/10)`}
                </li>
              </ul>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                Πίσω
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Αποθήκευση...' : 'Δημιουργία Περιορισμού'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
