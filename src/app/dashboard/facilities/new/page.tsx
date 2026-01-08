'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <Link href="/dashboard/facilities" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Εγκαταστάσεις
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέα Εγκατάσταση</h1>
        <p className="mt-2 text-gray-600">Πρόσθεσε έναν νέο χώρο στην κατασκήνωση</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Εγκατάστασης</CardTitle>
          <CardDescription>Συμπλήρωσε τα στοιχεία του χώρου</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Όνομα *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Γήπεδο Ποδοσφαίρου, Αίθουσα Χειροτεχνίας"
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
                placeholder="π.χ. FAC-001, Γ1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Περιγραφή του χώρου..."
                disabled={loading}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

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
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Τοποθεσία
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="π.χ. Κεντρικός χώρος, Βόρεια πτέρυγα"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Τύπος Χώρου
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="indoor"
                    checked={!indoor}
                    onChange={() => setIndoor(false)}
                    disabled={loading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Υπαίθριος</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="indoor"
                    checked={indoor}
                    onChange={() => setIndoor(true)}
                    disabled={loading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Εσωτερικός</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Οι υπαίθριοι χώροι επηρεάζονται από τον καιρό
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία Εγκατάστασης'}
              </Button>
              <Link href="/dashboard/facilities">
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
