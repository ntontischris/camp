'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { useOrganizationStore } from '@/stores/organization-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function GeneralSettings() {
  const { currentOrganization, refetch } = useOrganizations();
  const { setCurrentOrganization } = useOrganizationStore();
  const [name, setName] = useState(currentOrganization?.name || '');
  const [description, setDescription] = useState(currentOrganization?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentOrganization(data);
      setSuccess(true);
      await refetch();

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error updating organization:', error);
      setError(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Γενικές Ρυθμίσεις</CardTitle>
        <CardDescription>
          Ενημέρωση πληροφοριών οργανισμού
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              Οι αλλαγές αποθηκεύτηκαν επιτυχώς!
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Όνομα Οργανισμού *
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="π.χ. Κατασκήνωση Αγίας Παρασκευής"
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
              placeholder="π.χ. Θερινή κατασκήνωση για παιδιά 8-14 ετών"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
