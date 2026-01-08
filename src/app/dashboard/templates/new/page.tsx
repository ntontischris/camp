'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewTemplatePage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

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
      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('day_templates')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('day_templates')
        .insert({
          organization_id: currentOrganization.id,
          name: name.trim(),
          description: description.trim() || null,
          is_default: isDefault,
          is_active: true,
          total_activity_slots: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to detail page to add slots
      router.push(`/dashboard/templates/${data.id}`);
    } catch (error: any) {
      console.error('Error creating template:', error);
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
        <Link href="/dashboard/templates" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στα Πρότυπα
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέο Πρότυπο Ημέρας</h1>
        <p className="mt-2 text-gray-600">
          Δημιούργησε ένα πρότυπο για τη δομή της ημέρας
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Προτύπου</CardTitle>
          <CardDescription>
            Μετά τη δημιουργία θα μπορείς να προσθέσεις χρονοθυρίδες
          </CardDescription>
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
                Όνομα Προτύπου *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Κανονική Ημέρα, Μισή Ημέρα, Θεματική"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Περιγραφή του προτύπου..."
                disabled={loading}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Ορισμός ως προεπιλεγμένο πρότυπο
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Το προεπιλεγμένο πρότυπο χρησιμοποιείται αυτόματα για νέες ημέρες
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία & Προσθήκη Slots'}
              </Button>
              <Link href="/dashboard/templates">
                <Button type="button" variant="outline" disabled={loading}>
                  Ακύρωση
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Start Templates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Γρήγορη Εκκίνηση</CardTitle>
          <CardDescription>
            Ή επίλεξε ένα έτοιμο πρότυπο για αρχή
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setName('Κανονική Ημέρα');
                setDescription('Πλήρης ημέρα με όλες τις δραστηριότητες');
              }}
              className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Κανονική Ημέρα</div>
              <div className="text-sm text-gray-500">08:00 - 21:00</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Μισή Ημέρα');
                setDescription('Σύντομη ημέρα (π.χ. άφιξη/αναχώρηση)');
              }}
              className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Μισή Ημέρα</div>
              <div className="text-sm text-gray-500">08:00 - 14:00</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Εκδρομή');
                setDescription('Ημέρα εκδρομής εκτός κατασκήνωσης');
              }}
              className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Εκδρομή</div>
              <div className="text-sm text-gray-500">Χωρίς δραστηριότητες</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Θεματική Ημέρα');
                setDescription('Ειδική ημέρα με θεματικές δραστηριότητες');
              }}
              className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Θεματική Ημέρα</div>
              <div className="text-sm text-gray-500">Events & activities</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
