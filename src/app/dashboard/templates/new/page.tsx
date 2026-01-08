'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';

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
      <Link href="/dashboard/templates" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στα Πρότυπα
      </Link>

      <PageHeader
        title="Νέο Πρότυπο Ημέρας"
        description="Δημιούργησε τη δομή μιας τυπικής ημέρας στο camp"
        icon="📄"
        helpText="Το Πρότυπο Ημέρας καθορίζει τη δομή κάθε ημέρας: πότε είναι οι δραστηριότητες, τα διαλείμματα, τα γεύματα. Φτιάξε ένα και χρησιμοποίησέ το σε όλες τις ημέρες!"
        steps={[
          { title: 'Δημιούργησε το πρότυπο', description: 'Δώσε όνομα και περιγραφή' },
          { title: 'Πρόσθεσε χρονοθυρίδες', description: 'Όρισε τις ώρες για δραστηριότητες, γεύματα, διαλείμματα' },
          { title: 'Όρισε ως προεπιλογή', description: 'Θα χρησιμοποιείται αυτόματα για όλες τις ημέρες' }
        ]}
        tips={[
          'Συνήθως χρειάζεσαι 1-3 πρότυπα: Κανονική Ημέρα, Μισή Ημέρα, Εκδρομή',
          'Οι χρονοθυρίδες μπορούν να είναι: Δραστηριότητα, Γεύμα, Διάλειμμα, Ελεύθερος χρόνος',
          'Το πρότυπο "Κανονική Ημέρα" συνήθως ορίζεται ως προεπιλογή'
        ]}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <FormSection
          title="Στοιχεία Προτύπου"
          description="Όνομα και περιγραφή"
          icon="📝"
          required
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Όνομα Προτύπου *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="π.χ. Κανονική Ημέρα"
                disabled={loading}
                required
              />
              <FieldHelp
                text="Ένα περιγραφικό όνομα για το πρότυπο"
                example="Κανονική Ημέρα, Μισή Ημέρα, Ημέρα Εκδρομής"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Περιγραφή
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Πότε χρησιμοποιείται αυτό το πρότυπο..."
                disabled={loading}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Ρυθμίσεις"
          description="Προεπιλογή για νέες ημέρες"
          icon="⚙️"
        >
          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={loading}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">
                ⭐ Ορισμός ως προεπιλεγμένο πρότυπο
              </div>
              <p className="text-sm text-gray-500">
                Αυτό το πρότυπο θα χρησιμοποιείται αυτόματα για κάθε νέα ημέρα στο πρόγραμμα
              </p>
            </div>
          </label>
        </FormSection>

        <InfoBox type="info" title="Τι γίνεται μετά;">
          Αφού δημιουργήσεις το πρότυπο, θα μεταφερθείς στη σελίδα επεξεργασίας όπου θα προσθέσεις τις <strong>χρονοθυρίδες</strong> (π.χ. 09:00-10:00 Δραστηριότητα, 10:00-10:30 Διάλειμμα, κλπ).
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/templates">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία & Προσθήκη Slots'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Quick Start Templates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            ⚡ Γρήγορη Εκκίνηση
          </CardTitle>
          <CardDescription>
            Κάνε κλικ για να συμπληρωθούν αυτόματα τα πεδία
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setName('Κανονική Ημέρα');
                setDescription('Πλήρης ημέρα με όλες τις δραστηριότητες, γεύματα και διαλείμματα');
                setIsDefault(true);
              }}
              className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <span>☀️</span> Κανονική Ημέρα
              </div>
              <div className="text-sm text-gray-500 mt-1">08:00 - 21:00 • 4-6 δραστηριότητες</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Μισή Ημέρα');
                setDescription('Σύντομη ημέρα για αφίξεις ή αναχωρήσεις');
              }}
              className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <span>🌅</span> Μισή Ημέρα
              </div>
              <div className="text-sm text-gray-500 mt-1">08:00 - 14:00 • 2-3 δραστηριότητες</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Ημέρα Εκδρομής');
                setDescription('Εκδρομή εκτός κατασκήνωσης - χωρίς προγραμματισμένες δραστηριότητες');
              }}
              className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <span>🚌</span> Ημέρα Εκδρομής
              </div>
              <div className="text-sm text-gray-500 mt-1">Ελεύθερη δομή</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Θεματική Ημέρα');
                setDescription('Ειδική ημέρα με θεματικές δραστηριότητες και events');
              }}
              className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <span>🎉</span> Θεματική Ημέρα
              </div>
              <div className="text-sm text-gray-500 mt-1">Events & ειδικές δραστηριότητες</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
