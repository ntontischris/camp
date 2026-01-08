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

type Group = Database['public']['Tables']['groups']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [group, setGroup] = useState<Group | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [capacity, setCapacity] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'mixed'>('mixed');
  const [cabinLocation, setCabinLocation] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadGroup();
    }
  }, [id, currentOrganization?.id]);

  const loadGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      // Load session separately
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', data.session_id)
        .single();

      if (sessionError) throw sessionError;

      // Verify group belongs to user's organization through session
      const groupSession = sessionData as Session;
      if (groupSession?.organization_id !== currentOrganization?.id) {
        throw new Error('Δεν έχεις πρόσβαση σε αυτή την ομάδα');
      }

      setGroup(data);
      setSession(groupSession);
      setName(data.name);
      setCode(data.code || '');
      setDescription(data.description || '');
      setColor(data.color || COLORS[0]);
      setAgeMin(data.age_min?.toString() || '');
      setAgeMax(data.age_max?.toString() || '');
      setCapacity(data.capacity?.toString() || '');
      setGender(data.gender || 'mixed');
      setCabinLocation(data.cabin_location || '');
      setIsActive(data.is_active);
    } catch (error: any) {
      console.error('Error loading group:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!group) return;

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    if (ageMin && ageMax && parseInt(ageMin) > parseInt(ageMax)) {
      setError('Η ελάχιστη ηλικία δεν μπορεί να είναι μεγαλύτερη από τη μέγιστη.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          color,
          age_min: ageMin ? parseInt(ageMin) : null,
          age_max: ageMax ? parseInt(ageMax) : null,
          capacity: capacity ? parseInt(capacity) : null,
          gender,
          cabin_location: cabinLocation.trim() || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);

      if (error) throw error;

      await loadGroup();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating group:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;

    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις την ομάδα "${group.name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', group.id);

      if (error) throw error;

      router.push('/dashboard/groups');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      setError(error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!group) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({
          is_active: !group.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);

      if (error) throw error;

      await loadGroup();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      setError(error.message);
    }
  };

  const getGenderLabel = (g: string | null) => {
    const labels: Record<string, string> = {
      male: 'Αγόρια',
      female: 'Κορίτσια',
      mixed: 'Μικτή',
    };
    return labels[g || 'mixed'] || 'Μικτή';
  };

  const cancelEdit = () => {
    setEditing(false);
    if (group) {
      setName(group.name);
      setCode(group.code || '');
      setDescription(group.description || '');
      setColor(group.color || COLORS[0]);
      setAgeMin(group.age_min?.toString() || '');
      setAgeMax(group.age_max?.toString() || '');
      setCapacity(group.capacity?.toString() || '');
      setGender(group.gender || 'mixed');
      setCabinLocation(group.cabin_location || '');
      setIsActive(group.is_active);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Η ομάδα δεν βρέθηκε.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/groups" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Ομάδες
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {group.color && (
              <div
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: group.color }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              {group.code && (
                <p className="text-gray-500">Κωδικός: {group.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!group.is_active && (
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                Ανενεργή
              </span>
            )}
          </div>
        </div>
        {session && (
          <p className="mt-2 text-gray-600">
            Περίοδος: <Link href={`/dashboard/sessions/${session.id}`} className="text-primary-600 hover:underline">{session.name}</Link>
          </p>
        )}
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
              <CardTitle>Στοιχεία Ομάδας</CardTitle>
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
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Κωδικός</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Χρώμα</label>
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
                        disabled={saving}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Περιγραφή</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ελάχιστη Ηλικία</label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Μέγιστη Ηλικία</label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Χωρητικότητα</label>
                  <Input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Τύπος</label>
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
                          disabled={saving}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Θέση/Καμπίνα</label>
                  <Input
                    value={cabinLocation}
                    onChange={(e) => setCabinLocation(e.target.value)}
                    disabled={saving}
                  />
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
                {group.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Περιγραφή</div>
                    <div className="mt-1 text-gray-900">{group.description}</div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Κατασκηνωτές</div>
                    <div className="mt-1 text-gray-900">
                      {group.current_count || 0}
                      {group.capacity && ` / ${group.capacity}`}
                    </div>
                  </div>

                  {(group.age_min || group.age_max) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Ηλικίες</div>
                      <div className="mt-1 text-gray-900">
                        {group.age_min || '?'} - {group.age_max || '?'} ετών
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-500">Τύπος</div>
                    <div className="mt-1 text-gray-900">{getGenderLabel(group.gender)}</div>
                  </div>

                  {group.cabin_location && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Θέση/Καμπίνα</div>
                      <div className="mt-1 text-gray-900">{group.cabin_location}</div>
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
            <CardDescription>Διαχείριση ομάδας</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleToggleActive}
              >
                {group.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή Ομάδας
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
