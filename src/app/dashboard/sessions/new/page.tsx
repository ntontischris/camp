'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCampers, setMaxCampers] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization || !user) {
      setError('Δεν βρέθηκε οργανισμός ή χρήστης.');
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setError('Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          organization_id: currentOrganization.id,
          name,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          max_campers: maxCampers ? parseInt(maxCampers) : null,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Session created:', data);
      router.push('/dashboard/sessions');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating session:', error);
      setError(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/sessions" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Περιόδους
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέα Περίοδος Κατασκήνωσης</h1>
        <p className="mt-2 text-gray-600">
          Δημιούργησε μια νέα περίοδο για τον οργανισμό σου
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Περιόδου</CardTitle>
          <CardDescription>
            Συμπλήρωσε τα βασικά στοιχεία της περιόδου κατασκήνωσης
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Όνομα Περιόδου *
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Θερινή Κατασκήνωση 2026"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Περιγραφή
              </label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="π.χ. Θερινή περίοδος για παιδιά 8-14 ετών"
                disabled={loading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Ημερομηνία Έναρξης *
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  Ημερομηνία Λήξης *
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="maxCampers" className="text-sm font-medium">
                Μέγιστος Αριθμός Κατασκηνωτών (προαιρετικό)
              </label>
              <Input
                id="maxCampers"
                type="number"
                min="1"
                value={maxCampers}
                onChange={(e) => setMaxCampers(e.target.value)}
                placeholder="π.χ. 100"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/dashboard/sessions">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : 'Δημιουργία Περιόδου'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
