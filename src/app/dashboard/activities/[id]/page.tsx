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

type Activity = Database['public']['Tables']['activities']['Row'];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [setupMinutes, setSetupMinutes] = useState('');
  const [cleanupMinutes, setCleanupMinutes] = useState('');
  const [minParticipants, setMinParticipants] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [requiredStaffCount, setRequiredStaffCount] = useState('');
  const [weatherDependent, setWeatherDependent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadActivity();
    }
  }, [id, currentOrganization?.id]);

  const loadActivity = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setActivity(data);
      populateForm(data);
    } catch (error: any) {
      console.error('Error loading activity:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: Activity) => {
    setName(data.name);
    setCode(data.code || '');
    setDescription(data.description || '');
    setColor(data.color || COLORS[4]);
    setDurationMinutes(data.duration_minutes.toString());
    setSetupMinutes(data.setup_minutes?.toString() || '');
    setCleanupMinutes(data.cleanup_minutes?.toString() || '');
    setMinParticipants(data.min_participants?.toString() || '');
    setMaxParticipants(data.max_participants?.toString() || '');
    setMinAge(data.min_age?.toString() || '');
    setMaxAge(data.max_age?.toString() || '');
    setRequiredStaffCount(data.required_staff_count?.toString() || '1');
    setWeatherDependent(data.weather_dependent || false);
  };

  const handleSave = async () => {
    if (!activity) return;

    if (!name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    if (!durationMinutes || parseInt(durationMinutes) <= 0) {
      setError('Η διάρκεια είναι υποχρεωτική.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          color,
          duration_minutes: parseInt(durationMinutes),
          setup_minutes: setupMinutes ? parseInt(setupMinutes) : 0,
          cleanup_minutes: cleanupMinutes ? parseInt(cleanupMinutes) : 0,
          min_participants: minParticipants ? parseInt(minParticipants) : null,
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
          min_age: minAge ? parseInt(minAge) : null,
          max_age: maxAge ? parseInt(maxAge) : null,
          required_staff_count: requiredStaffCount ? parseInt(requiredStaffCount) : 1,
          weather_dependent: weatherDependent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activity.id);

      if (error) throw error;

      await loadActivity();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating activity:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;

    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις τη δραστηριότητα "${activity.name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', activity.id);

      if (error) throw error;

      router.push('/dashboard/activities');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      setError(error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!activity) return;

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          is_active: !activity.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activity.id);

      if (error) throw error;

      await loadActivity();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      setError(error.message);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} λεπτά`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ώρ${hours === 1 ? 'α' : 'ες'}`;
    return `${hours}ώ ${mins}λ`;
  };

  const cancelEdit = () => {
    setEditing(false);
    if (activity) {
      populateForm(activity);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Η δραστηριότητα δεν βρέθηκε.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/activities" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Δραστηριότητες
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activity.color && (
              <div
                className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: activity.color }}
              >
                {activity.icon || activity.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{activity.name}</h1>
              {activity.code && (
                <p className="text-gray-500">Κωδικός: {activity.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activity.weather_dependent && (
              <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                Εξαρτάται από καιρό
              </span>
            )}
            {!activity.is_active && (
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
              <CardTitle>Στοιχεία Δραστηριότητας</CardTitle>
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Επεξεργασία
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {editing ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Όνομα *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Κωδικός</label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={saving} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Χρώμα</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`h-8 w-8 rounded-lg border-2 transition-transform ${
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
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Χρόνος</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Διάρκεια (λεπτά) *</label>
                      <Input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Προετοιμασία</label>
                      <Input type="number" min="0" value={setupMinutes} onChange={(e) => setSetupMinutes(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Καθαρισμός</label>
                      <Input type="number" min="0" value={cleanupMinutes} onChange={(e) => setCleanupMinutes(e.target.value)} disabled={saving} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Συμμετέχοντες</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Ελάχιστοι</label>
                      <Input type="number" min="1" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Μέγιστοι</label>
                      <Input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Ελάχιστη Ηλικία</label>
                      <Input type="number" min="1" value={minAge} onChange={(e) => setMinAge(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Μέγιστη Ηλικία</label>
                      <Input type="number" min="1" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} disabled={saving} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Προσωπικό & Καιρός</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Απαιτούμενο Προσωπικό</label>
                      <Input type="number" min="1" value={requiredStaffCount} onChange={(e) => setRequiredStaffCount(e.target.value)} disabled={saving} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={weatherDependent}
                        onChange={(e) => setWeatherDependent(e.target.checked)}
                        disabled={saving}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <span className="text-sm">Εξαρτάται από τον καιρό</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
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
                {activity.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Περιγραφή</div>
                    <div className="mt-1 text-gray-900">{activity.description}</div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Διάρκεια</div>
                    <div className="mt-1 text-gray-900">{formatDuration(activity.duration_minutes)}</div>
                  </div>
                  {(activity.setup_minutes || 0) > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Προετοιμασία</div>
                      <div className="mt-1 text-gray-900">{activity.setup_minutes} λεπτά</div>
                    </div>
                  )}
                  {(activity.cleanup_minutes || 0) > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Καθαρισμός</div>
                      <div className="mt-1 text-gray-900">{activity.cleanup_minutes} λεπτά</div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(activity.min_participants || activity.max_participants) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Συμμετέχοντες</div>
                      <div className="mt-1 text-gray-900">
                        {activity.min_participants || '?'} - {activity.max_participants || '?'}
                      </div>
                    </div>
                  )}
                  {(activity.min_age || activity.max_age) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Ηλικίες</div>
                      <div className="mt-1 text-gray-900">
                        {activity.min_age || '?'} - {activity.max_age || '?'} ετών
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-500">Απαιτούμενο Προσωπικό</div>
                    <div className="mt-1 text-gray-900">{activity.required_staff_count || 1}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ενέργειες</CardTitle>
            <CardDescription>Διαχείριση δραστηριότητας</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleToggleActive}>
                {activity.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή Δραστηριότητας
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
