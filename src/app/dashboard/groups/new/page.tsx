'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';
import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

const GROUP_PRESETS = [
  { name: 'Αετοί', icon: '🦅', description: 'Κλασικό όνομα ομάδας για παιδιά 10-12 ετών' },
  { name: 'Λιοντάρια', icon: '🦁', description: 'Δυναμική ομάδα για μεγαλύτερα παιδιά' },
  { name: 'Δελφίνια', icon: '🐬', description: 'Ιδανικό για ομάδες κολύμβησης' },
  { name: 'Αστέρια', icon: '⭐', description: 'Για τους μικρότερους κατασκηνωτές' },
];

function NewGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState(searchParams.get('session') || '');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [capacity, setCapacity] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'mixed'>('mixed');
  const [cabinLocation, setCabinLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadSessions();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      // Auto-select if only one session or if session param provided
      if (data && data.length === 1 && !sessionId) {
        setSessionId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId) {
      setError('Επίλεξε περίοδο.');
      return;
    }

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    // Validate ages
    if (ageMin && ageMax && parseInt(ageMin) > parseInt(ageMax)) {
      setError('Η ελάχιστη ηλικία δεν μπορεί να είναι μεγαλύτερη από τη μέγιστη.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          session_id: sessionId,
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          color,
          age_min: ageMin ? parseInt(ageMin) : null,
          age_max: ageMax ? parseInt(ageMax) : null,
          capacity: capacity ? parseInt(capacity) : null,
          gender,
          cabin_location: cabinLocation.trim() || null,
          is_active: true,
        });

      if (error) throw error;

      router.push('/dashboard/groups');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating group:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
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

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-4 block">📅</span>
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν διαθέσιμες περίοδοι
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Για να φτιάξεις ομάδες, χρειάζεσαι πρώτα τουλάχιστον μία περίοδο κατασκήνωσης.
              Η περίοδος καθορίζει το χρονικό διάστημα λειτουργίας του camp.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/sessions/new">
                <Button>Δημιουργία Περιόδου</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard/groups" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στις Ομάδες
      </Link>

      <PageHeader
        title="Νέα Ομάδα"
        description="Δημιούργησε μια ομάδα κατασκηνωτών"
        icon="👥"
        helpText="Οι Ομάδες είναι τα σύνολα παιδιών που συμμετέχουν μαζί στις δραστηριότητες. Κάθε ομάδα ανήκει σε μια συγκεκριμένη περίοδο και μπορεί να έχει τους δικούς της περιορισμούς (ηλικία, χωρητικότητα, φύλο)."
        tips={[
          'Διάλεξε ξεχωριστά χρώματα για κάθε ομάδα - βοηθάει στο πρόγραμμα!',
          'Η ηλικιακή ομάδα βοηθάει στην αυτόματη κατανομή παιδιών',
          'Μπορείς να έχεις ομάδες με διαφορετική χωρητικότητα'
        ]}
        steps={[
          { title: 'Επίλεξε περίοδο', description: 'Σε ποια περίοδο ανήκει η ομάδα' },
          { title: 'Δώσε όνομα & χρώμα', description: 'Για να ξεχωρίζει στο πρόγραμμα' },
          { title: 'Όρισε χαρακτηριστικά', description: 'Ηλικίες, χωρητικότητα, τύπος' }
        ]}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <FormSection
          title="Περίοδος"
          description="Σε ποια περίοδο κατασκήνωσης ανήκει η ομάδα"
          icon="📅"
          required
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Περίοδος Κατασκήνωσης *
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={loading}
              required
            >
              <option value="">Επίλεξε περίοδο...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
            <FieldHelp
              text="Η ομάδα θα συμμετέχει μόνο σε δραστηριότητες αυτής της περιόδου"
            />
          </div>
        </FormSection>

        <FormSection
          title="Ταυτότητα Ομάδας"
          description="Όνομα και εμφάνιση"
          icon="🏷️"
          required
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Όνομα Ομάδας *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Αετοί, Λιοντάρια, Ομάδα Α"
                disabled={loading}
                required
              />
              <FieldHelp
                text="Ένα διασκεδαστικό όνομα που ταιριάζει στην ηλικία των παιδιών"
                example="Αετοί, Δελφίνια, Αστέρια, Τίγρεις"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Κωδικός (προαιρετικό)
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="π.χ. GR-A, Α1"
                disabled={loading}
                className="max-w-xs"
              />
              <FieldHelp text="Σύντομος κωδικός για γρήγορη αναφορά σε λίστες και αναφορές" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Χρώμα Ομάδας
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-125 border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    disabled={loading}
                    title={`Επιλογή χρώματος`}
                  />
                ))}
              </div>
              <FieldHelp text="Το χρώμα εμφανίζεται στο πρόγραμμα και τις λίστες" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Σημειώσεις για την ομάδα..."
                disabled={loading}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Ηλικιακή Ομάδα"
          description="Εύρος ηλικιών για τα παιδιά"
          icon="🎂"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ελάχιστη Ηλικία
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="π.χ. 8"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Μέγιστη Ηλικία
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="π.χ. 12"
                disabled={loading}
              />
            </div>
          </div>
          <FieldHelp
            text="Αφησέ κενό αν η ομάδα δεν έχει ηλικιακό περιορισμό"
            example="8-10 για μικρούς, 11-14 για μεγαλύτερους"
          />
        </FormSection>

        <FormSection
          title="Χωρητικότητα & Τύπος"
          description="Πόσα παιδιά και τι είδους ομάδα"
          icon="⚙️"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Μέγιστος Αριθμός Κατασκηνωτών
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="π.χ. 20"
                disabled={loading}
                className="max-w-xs"
              />
              <FieldHelp text="Βοηθάει να μην υπερφορτωθεί η ομάδα κατά τις εγγραφές" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Τύπος Ομάδας
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'mixed', label: 'Μικτή', icon: '👫', desc: 'Αγόρια & Κορίτσια' },
                  { value: 'male', label: 'Αγόρια', icon: '👦', desc: 'Μόνο αγόρια' },
                  { value: 'female', label: 'Κορίτσια', icon: '👧', desc: 'Μόνο κορίτσια' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      gender === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={gender === option.value}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'mixed')}
                      disabled={loading}
                      className="sr-only"
                    />
                    <span className="text-xl">{option.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      <p className="text-xs text-gray-500">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Διαμονή"
          description="Πού μένει η ομάδα"
          icon="🏕️"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Θέση/Καμπίνα
            </label>
            <Input
              value={cabinLocation}
              onChange={(e) => setCabinLocation(e.target.value)}
              placeholder="π.χ. Καμπίνα 3, Πτέρυγα Α"
              disabled={loading}
            />
            <FieldHelp
              text="Βοηθάει στον εντοπισμό και τη διαχείριση της διαμονής"
              example="Καμπίνα 3, Σκηνή Β2, Δωμάτιο 101"
            />
          </div>
        </FormSection>

        <InfoBox type="tip" title="Συμβουλή">
          Μετά τη δημιουργία, μπορείς να προσθέσεις <strong>κατασκηνωτές</strong> στην ομάδα
          και να δεις το πρόγραμμα δραστηριοτήτων της.
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/groups">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία Ομάδας'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Quick Start Presets */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            ⚡ Δημοφιλή Ονόματα
          </CardTitle>
          <CardDescription>
            Κάνε κλικ για να συμπληρωθεί το όνομα αυτόματα
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {GROUP_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setName(preset.name);
                  setColor(COLORS[idx % COLORS.length]);
                }}
                className="rounded-lg border-2 border-gray-200 p-3 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <span>{preset.icon}</span> {preset.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewGroupPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    }>
      <NewGroupForm />
    </Suspense>
  );
}
