'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardFooter } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';

export default function NewFacilityPage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [indoor, setIndoor] = useState(false);

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

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('facilities')
        .insert({
          organization_id: currentOrganization.id,
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          capacity: capacity ? parseInt(capacity) : null,
          location: location.trim() || null,
          indoor,
          is_active: true,
        });

      if (error) throw error;

      router.push('/dashboard/facilities');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating facility:', error);
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
      <Link href="/dashboard/facilities" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στους Χώρους
      </Link>

      <PageHeader
        title="Νέος Χώρος"
        description="Πρόσθεσε έναν χώρο όπου γίνονται δραστηριότητες"
        icon="🏠"
        helpText="Οι Χώροι είναι τα σημεία της κατασκήνωσης όπου γίνονται δραστηριότητες: γήπεδα, αίθουσες, πισίνα κλπ. Όταν φτιάχνεις πρόγραμμα, επιλέγεις πού θα γίνει κάθε δραστηριότητα."
        tips={[
          'Σημείωσε αν είναι εσωτερικός ή υπαίθριος - βοηθάει στις αντικαταστάσεις καιρού',
          'Η χωρητικότητα βοηθάει να μην προγραμματίσεις πολλά άτομα σε μικρό χώρο',
          'Μπορείς να έχεις πολλούς χώρους του ίδιου τύπου (π.χ. Γήπεδο 1, Γήπεδο 2)'
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
          description="Όνομα και περιγραφή του χώρου"
          icon="📝"
          required
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Όνομα Χώρου *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Γήπεδο Ποδοσφαίρου"
                disabled={loading}
                required
              />
              <FieldHelp
                text="Ένα αναγνωρίσιμο όνομα για τον χώρο"
                example="Πισίνα, Αίθουσα Χειροτεχνίας, Γήπεδο Μπάσκετ, Αμφιθέατρο"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Τι εξοπλισμό έχει, τι δραστηριότητες γίνονται εκεί..."
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
                placeholder="π.χ. POOL-1"
                disabled={loading}
                className="max-w-xs"
              />
              <FieldHelp text="Εσωτερικός κωδικός για γρήγορη αναφορά" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Χαρακτηριστικά"
          description="Χωρητικότητα και τοποθεσία"
          icon="📍"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Χωρητικότητα (άτομα)
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="π.χ. 30"
                disabled={loading}
              />
              <FieldHelp text="Πόσα άτομα χωράνε με άνεση" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Τοποθεσία
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="π.χ. Κεντρικός χώρος"
                disabled={loading}
              />
              <FieldHelp text="Πού βρίσκεται μέσα στην κατασκήνωση" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Τύπος Χώρου"
          description="Εσωτερικός ή υπαίθριος"
          icon="🌤️"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${!indoor ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="indoor"
                checked={!indoor}
                onChange={() => setIndoor(false)}
                disabled={loading}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌳</span>
                  <span className="font-medium text-gray-900">Υπαίθριος</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Επηρεάζεται από τον καιρό
                </p>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${indoor ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="indoor"
                checked={indoor}
                onChange={() => setIndoor(true)}
                disabled={loading}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  <span className="font-medium text-gray-900">Εσωτερικός</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Δεν επηρεάζεται από τον καιρό
                </p>
              </div>
            </label>
          </div>

          <InfoBox type="info" title="Γιατί είναι σημαντικό;">
            Όταν βρέχει, το σύστημα μπορεί αυτόματα να προτείνει μετακίνηση δραστηριοτήτων από υπαίθριους σε εσωτερικούς χώρους.
          </InfoBox>
        </FormSection>

        <InfoBox type="tip" title="Συμβουλή">
          Μετά τη δημιουργία, μπορείς να συνδέσεις <strong>Δραστηριότητες</strong> με αυτόν τον χώρο - έτσι το σύστημα θα ξέρει πού μπορεί να γίνει κάθε δραστηριότητα.
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/facilities">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία Χώρου'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
