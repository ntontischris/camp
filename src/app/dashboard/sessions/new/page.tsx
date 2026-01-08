'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';

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
      <Link href="/dashboard/sessions" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στις Περιόδους
      </Link>

      <PageHeader
        title="Νέα Περίοδος Κατασκήνωσης"
        description="Δημιούργησε μια χρονική περίοδο λειτουργίας του camp"
        icon="📅"
        helpText="Η Περίοδος είναι το χρονικό διάστημα που λειτουργεί η κατασκήνωση (π.χ. 1-15 Ιουλίου). Κάθε περίοδος έχει τις δικές της ομάδες, πρόγραμμα και ρυθμίσεις."
        tips={[
          'Μπορείς να έχεις πολλές περιόδους το καλοκαίρι (π.χ. 1η, 2η, 3η περίοδος)',
          'Κάθε περίοδος ξεκινάει σε κατάσταση "Πρόχειρο" - θα την αλλάξεις σε "Ενεργή" όταν είσαι έτοιμος',
          'Οι ομάδες που θα φτιάξεις θα συνδεθούν με αυτή την περίοδο'
        ]}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <FormSection
          title="Βασικές Πληροφορίες"
          description="Δώσε ένα όνομα και περιγραφή στην περίοδο"
          icon="📝"
          required
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Όνομα Περιόδου *
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. 1η Θερινή Περίοδος 2026"
                required
                disabled={loading}
              />
              <FieldHelp
                text="Διάλεξε ένα όνομα που να ξεχωρίζει εύκολα από άλλες περιόδους"
                example="Θερινή Κατασκήνωση Ιούλιος, 2η Περίοδος Αυγούστου"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="π.χ. Για παιδιά 8-14 ετών με έμφαση στα αθλήματα"
                disabled={loading}
              />
              <FieldHelp text="Προαιρετικό - βοηθάει να θυμάσαι τι περιλαμβάνει η περίοδος" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Ημερομηνίες"
          description="Πότε ξεκινάει και τελειώνει η περίοδος"
          icon="🗓️"
          required
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
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
              <FieldHelp text="Η πρώτη μέρα λειτουργίας της κατασκήνωσης" />
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
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
              <FieldHelp text="Η τελευταία μέρα λειτουργίας" />
            </div>
          </div>

          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
              ✅ Διάρκεια: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} ημέρες
            </div>
          )}
        </FormSection>

        <FormSection
          title="Χωρητικότητα"
          description="Προαιρετικό - πόσα παιδιά αναμένεις"
          icon="👥"
        >
          <div className="space-y-2">
            <label htmlFor="maxCampers" className="text-sm font-medium text-gray-700">
              Μέγιστος Αριθμός Κατασκηνωτών
            </label>
            <Input
              id="maxCampers"
              type="number"
              min="1"
              value={maxCampers}
              onChange={(e) => setMaxCampers(e.target.value)}
              placeholder="π.χ. 100"
              disabled={loading}
              className="max-w-xs"
            />
            <FieldHelp text="Αφησέ το κενό αν δεν θέλεις να βάλεις όριο" />
          </div>
        </FormSection>

        <InfoBox type="tip" title="Τι γίνεται μετά;">
          Αφού δημιουργήσεις την περίοδο, το επόμενο βήμα είναι να προσθέσεις <strong>Ομάδες</strong> (π.χ. "Αετοί", "Λιοντάρια") που θα συμμετέχουν σε αυτή την περίοδο.
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/sessions">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία Περιόδου'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
