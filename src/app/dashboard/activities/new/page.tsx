'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

export default function NewActivityPage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[4]);

  const [durationMinutes, setDurationMinutes] = useState('45');
  const [setupMinutes, setSetupMinutes] = useState('');
  const [cleanupMinutes, setCleanupMinutes] = useState('');

  const [minParticipants, setMinParticipants] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  const [requiredStaffCount, setRequiredStaffCount] = useState('1');
  const [weatherDependent, setWeatherDependent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) {
      setError('Δεν έχεις επιλέξει οργανισμό.');
      return;
    }

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    if (!durationMinutes || parseInt(durationMinutes) <= 0) {
      setError('Η διάρκεια είναι υποχρεωτική.');
      return;
    }

    if (minParticipants && maxParticipants && parseInt(minParticipants) > parseInt(maxParticipants)) {
      setError('Ο ελάχιστος αριθμός συμμετεχόντων δεν μπορεί να είναι μεγαλύτερος από τον μέγιστο.');
      return;
    }

    if (minAge && maxAge && parseInt(minAge) > parseInt(maxAge)) {
      setError('Η ελάχιστη ηλικία δεν μπορεί να είναι μεγαλύτερη από τη μέγιστη.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          organization_id: currentOrganization.id,
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          color,
          duration_minutes: parseInt(durationMinutes),
          setup_minutes: setupMinutes ? parseInt(setupMinutes) : 0,
          cleanup_minutes: cleanupMinutes ? parseInt(cleanupMinutes) : 0,
          min_participants: minParticipants ? parseInt(minParticipants) : null,
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
          min_age: minAge ? parseInt(minAge) : null,
          max_age: maxAge ? parseInt(maxAge) : null,
          required_staff_count: requiredStaffCount ? parseInt(requiredStaffCount) : 1,
          weather_dependent: weatherDependent,
          is_active: true,
        });

      if (error) throw error;

      router.push('/dashboard/activities');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating activity:', error);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard/activities" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στις Δραστηριότητες
      </Link>

      <PageHeader
        title="Νέα Δραστηριότητα"
        description="Πρόσθεσε μια δραστηριότητα στη βιβλιοθήκη του camp"
        icon="🎯"
        helpText="Οι δραστηριότητες είναι όσα κάνουν τα παιδιά στο camp: αθλήματα, τέχνες, παιχνίδια κλπ. Δημιούργησε μια φορά και χρησιμοποίησε σε πολλές περιόδους!"
        tips={[
          'Κάθε δραστηριότητα έχει διάρκεια - συνήθως 45-60 λεπτά',
          'Το χρώμα βοηθάει να ξεχωρίζεις τις δραστηριότητες στο πρόγραμμα',
          'Αν μια δραστηριότητα γίνεται μόνο σε καλό καιρό, σημείωσέ το για αυτόματες αντικαταστάσεις'
        ]}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <FormSection
          title="Βασικά Στοιχεία"
          description="Όνομα και περιγραφή της δραστηριότητας"
          icon="📝"
          required
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Όνομα Δραστηριότητας *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Ποδόσφαιρο"
                disabled={loading}
                required
              />
              <FieldHelp
                text="Σύντομο και περιγραφικό όνομα"
                example="Κολύμβηση, Χειροτεχνία, Σκάκι, Θεατρικό Παιχνίδι"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Χρώμα στο Πρόγραμμα
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                      color === c ? 'scale-125 border-gray-900' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    disabled={loading}
                    title="Επίλεξε χρώμα"
                  />
                ))}
              </div>
              <FieldHelp text="Αυτό το χρώμα θα εμφανίζεται στο ημερήσιο πρόγραμμα" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Τι περιλαμβάνει η δραστηριότητα, τι χρειάζεται..."
                disabled={loading}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Κωδικός (προαιρετικό)
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="π.χ. SWIM-01"
                disabled={loading}
                className="max-w-xs"
              />
              <FieldHelp text="Εσωτερικός κωδικός για δική σου οργάνωση" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Χρονικά Στοιχεία"
          description="Πόσο διαρκεί η δραστηριότητα"
          icon="⏱️"
          required
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Διάρκεια (λεπτά) *
              </label>
              <Input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                disabled={loading}
                required
              />
              <FieldHelp text="Πόσο διαρκεί η κύρια δραστηριότητα" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Προετοιμασία (λεπτά)
              </label>
              <Input
                type="number"
                min="0"
                value={setupMinutes}
                onChange={(e) => setSetupMinutes(e.target.value)}
                placeholder="5"
                disabled={loading}
              />
              <FieldHelp text="Χρόνος στησίματος πριν ξεκινήσει" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Καθαρισμός (λεπτά)
              </label>
              <Input
                type="number"
                min="0"
                value={cleanupMinutes}
                onChange={(e) => setCleanupMinutes(e.target.value)}
                placeholder="5"
                disabled={loading}
              />
              <FieldHelp text="Χρόνος μαζέματος μετά το τέλος" />
            </div>
          </div>

          <InfoBox type="info" title="Συνολικός χρόνος">
            Η συνολική δέσμευση χώρου είναι: <strong>{(parseInt(setupMinutes) || 0) + parseInt(durationMinutes || '0') + (parseInt(cleanupMinutes) || 0)} λεπτά</strong>
          </InfoBox>
        </FormSection>

        <FormSection
          title="Συμμετέχοντες"
          description="Όρια ηλικιών και αριθμού παιδιών"
          icon="👥"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ελάχιστος Αριθμός Παιδιών
              </label>
              <Input
                type="number"
                min="1"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                placeholder="π.χ. 6"
                disabled={loading}
              />
              <FieldHelp text="Πόσα παιδιά χρειάζονται τουλάχιστον" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Μέγιστος Αριθμός Παιδιών
              </label>
              <Input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="π.χ. 20"
                disabled={loading}
              />
              <FieldHelp text="Πόσα παιδιά χωράνε το πολύ" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ελάχιστη Ηλικία
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="π.χ. 8"
                disabled={loading}
              />
              <FieldHelp text="Από ποια ηλικία μπορούν να συμμετέχουν" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Μέγιστη Ηλικία
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder="π.χ. 14"
                disabled={loading}
              />
              <FieldHelp text="Έως ποια ηλικία είναι κατάλληλη" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Απαιτήσεις"
          description="Προσωπικό και καιρικές συνθήκες"
          icon="⚙️"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Απαιτούμενο Προσωπικό
              </label>
              <Input
                type="number"
                min="1"
                value={requiredStaffCount}
                onChange={(e) => setRequiredStaffCount(e.target.value)}
                placeholder="1"
                disabled={loading}
              />
              <FieldHelp text="Πόσοι εκπαιδευτές χρειάζονται" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Εξάρτηση από Καιρό
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={weatherDependent}
                  onChange={(e) => setWeatherDependent(e.target.checked)}
                  disabled={loading}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    🌤️ Εξαρτάται από τον καιρό
                  </span>
                  <p className="text-xs text-gray-500">
                    Τσέκαρε αν γίνεται μόνο σε καλό καιρό (π.χ. υπαίθρια δραστηριότητα)
                  </p>
                </div>
              </label>
            </div>
          </div>
        </FormSection>

        <InfoBox type="tip" title="Συμβουλή">
          Μπορείς αργότερα να ορίσεις <strong>Κανόνες</strong> για αυτή τη δραστηριότητα, π.χ. "Η κολύμβηση γίνεται μόνο πρωί" ή "Μετά από έντονη δραστηριότητα, ακολουθεί ήπια".
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/activities">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία Δραστηριότητας'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
