'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [color, setColor] = useState(COLORS[4]); // Green default

  // Duration
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [setupMinutes, setSetupMinutes] = useState('');
  const [cleanupMinutes, setCleanupMinutes] = useState('');

  // Participants
  const [minParticipants, setMinParticipants] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  // Staff
  const [requiredStaffCount, setRequiredStaffCount] = useState('1');

  // Weather
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

    // Validate participants
    if (minParticipants && maxParticipants && parseInt(minParticipants) > parseInt(maxParticipants)) {
      setError('Ο ελάχιστος αριθμός συμμετεχόντων δεν μπορεί να είναι μεγαλύτερος από τον μέγιστο.');
      return;
    }

    // Validate ages
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/activities" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Δραστηριότητες
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέα Δραστηριότητα</h1>
        <p className="mt-2 text-gray-600">Πρόσθεσε μια νέα δραστηριότητα στη βιβλιοθήκη</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Δραστηριότητας</CardTitle>
          <CardDescription>Συμπλήρωσε τα βασικά στοιχεία</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Όνομα *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="π.χ. Ποδόσφαιρο, Κολύμβηση, Χειροτεχνία"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Κωδικός
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="π.χ. ACT-001"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Χρώμα
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
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Περιγραφή
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Περιγραφή της δραστηριότητας..."
                  disabled={loading}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Χρόνος</h3>
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
                    placeholder="60"
                    disabled={loading}
                    required
                  />
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
                    placeholder="0"
                    disabled={loading}
                  />
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
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Συμμετέχοντες</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ελάχιστοι
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(e.target.value)}
                    placeholder="π.χ. 5"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Μέγιστοι
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="π.χ. 30"
                    disabled={loading}
                  />
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
                    placeholder="π.χ. 6"
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
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="π.χ. 18"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Staff & Weather */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Προσωπικό & Καιρός</h3>
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
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Εξάρτηση από Καιρό
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={weatherDependent}
                      onChange={(e) => setWeatherDependent(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Εξαρτάται από τον καιρό (π.χ. υπαίθρια)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία Δραστηριότητας'}
              </Button>
              <Link href="/dashboard/activities">
                <Button type="button" variant="outline" disabled={loading}>
                  Ακύρωση
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
