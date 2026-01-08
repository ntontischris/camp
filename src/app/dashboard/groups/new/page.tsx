'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
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

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν διαθέσιμες περίοδοι
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Πρέπει πρώτα να δημιουργήσεις μια περίοδο κατασκήνωσης
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/groups" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Ομάδες
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέα Ομάδα</h1>
        <p className="mt-2 text-gray-600">Δημιούργησε μια νέα ομάδα κατασκηνωτών</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Ομάδας</CardTitle>
          <CardDescription>Συμπλήρωσε τα στοιχεία της νέας ομάδας</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Session Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περίοδος *
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
            </div>

            {/* Name */}
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
            </div>

            {/* Code */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Κωδικός
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="π.χ. GR-A, Α1"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Σύντομος κωδικός για γρήγορη αναφορά</p>
            </div>

            {/* Color */}
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
                      color === c ? 'scale-125 border-gray-900' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Περιγραφή της ομάδας..."
                disabled={loading}
              />
            </div>

            {/* Ages */}
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

            {/* Capacity */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Χωρητικότητα (μέγιστοι κατασκηνωτές)
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="π.χ. 20"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Τύπος Ομάδας
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'mixed', label: 'Μικτή' },
                  { value: 'male', label: 'Αγόρια' },
                  { value: 'female', label: 'Κορίτσια' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={gender === option.value}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'mixed')}
                      disabled={loading}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cabin Location */}
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
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία Ομάδας'}
              </Button>
              <Link href="/dashboard/groups">
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

export default function NewGroupPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    }>
      <NewGroupForm />
    </Suspense>
  );
}
