'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Facility = Database['public']['Tables']['facilities']['Row'];

export default function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [indoor, setIndoor] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadFacility();
    }
  }, [id, currentOrganization?.id]);

  const loadFacility = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setFacility(data);
      populateForm(data);
    } catch (error: any) {
      console.error('Error loading facility:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: Facility) => {
    setName(data.name);
    setCode(data.code || '');
    setDescription(data.description || '');
    setCapacity(data.capacity?.toString() || '');
    setLocation(data.location || '');
    setIndoor(data.indoor || false);
  };

  const handleSave = async () => {
    if (!facility) return;

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          capacity: capacity ? parseInt(capacity) : null,
          location: location.trim() || null,
          indoor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', facility.id);

      if (error) throw error;

      await loadFacility();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating facility:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!facility) return;

    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις την εγκατάσταση "${facility.name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('facilities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', facility.id);

      if (error) throw error;

      router.push('/dashboard/facilities');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting facility:', error);
      setError(error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!facility) return;

    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          is_active: !facility.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', facility.id);

      if (error) throw error;

      await loadFacility();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      setError(error.message);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    if (facility) {
      populateForm(facility);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (error && !facility) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Η εγκατάσταση δεν βρέθηκε.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/facilities" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Εγκαταστάσεις
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
            {facility.code && (
              <p className="text-gray-500">Κωδικός: {facility.code}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              facility.indoor
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {facility.indoor ? 'Εσωτερικός' : 'Υπαίθριος'}
            </span>
            {!facility.is_active && (
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                Ανενεργή
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Στοιχεία Εγκατάστασης</CardTitle>
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Επεξεργασία
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Όνομα *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Κωδικός</label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={saving} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Περιγραφή</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                    rows={3}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Χωρητικότητα</label>
                    <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Τοποθεσία</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} disabled={saving} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Τύπος Χώρου</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="indoor"
                        checked={!indoor}
                        onChange={() => setIndoor(false)}
                        disabled={saving}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Υπαίθριος</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="indoor"
                        checked={indoor}
                        onChange={() => setIndoor(true)}
                        disabled={saving}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Εσωτερικός</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Ακύρωση
                  </Button>
                </div>
              </>
            ) : (
              <>
                {facility.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Περιγραφή</div>
                    <div className="mt-1 text-gray-900">{facility.description}</div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {facility.capacity && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Χωρητικότητα</div>
                      <div className="mt-1 text-gray-900">{facility.capacity} άτομα</div>
                    </div>
                  )}
                  {facility.location && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Τοποθεσία</div>
                      <div className="mt-1 text-gray-900">{facility.location}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ενέργειες</CardTitle>
            <CardDescription>Διαχείριση εγκατάστασης</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleToggleActive}>
                {facility.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή Εγκατάστασης
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
