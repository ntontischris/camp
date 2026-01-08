'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database, SessionStatus } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCampers, setMaxCampers] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadSession();
    }
  }, [id, currentOrganization?.id]);

  const loadSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setSession(data);
      setName(data.name);
      setDescription(data.description || '');
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      setMaxCampers(data.max_campers?.toString() || '');
    } catch (error: any) {
      console.error('Error loading session:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session) return;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setError('Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          name,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          max_campers: maxCampers ? parseInt(maxCampers) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;

      await loadSession();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating session:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;

    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις την περίοδο "${session.name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', session.id);

      if (error) throw error;

      router.push('/dashboard/sessions');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      setError(error.message);
    }
  };

  const handleStatusChange = async (newStatus: SessionStatus) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;

      await loadSession();
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      draft: 'Πρόχειρο',
      planning: 'Σχεδιασμός',
      active: 'Ενεργή',
      completed: 'Ολοκληρωμένη',
      cancelled: 'Ακυρωμένη',
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Η περίοδος δεν βρέθηκε.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/sessions" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στις Περιόδους
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.name}</h1>
            <p className="mt-2 text-gray-600">
              {formatDate(session.start_date)} - {formatDate(session.end_date)}
            </p>
          </div>
          <div>{getStatusBadge(session.status)}</div>
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
              <CardTitle>Στοιχεία Περιόδου</CardTitle>
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
                  <label className="text-sm font-medium">Περιγραφή</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Έναρξη *</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Λήξη *</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Μέγιστοι Κατασκηνωτές</label>
                  <Input
                    type="number"
                    value={maxCampers}
                    onChange={(e) => setMaxCampers(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setName(session.name);
                      setDescription(session.description || '');
                      setStartDate(session.start_date);
                      setEndDate(session.end_date);
                      setMaxCampers(session.max_campers?.toString() || '');
                    }}
                    disabled={saving}
                  >
                    Ακύρωση
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm font-medium text-gray-500">Περιγραφή</div>
                  <div className="mt-1 text-gray-900">
                    {session.description || 'Δεν υπάρχει περιγραφή'}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Κατασκηνωτές</div>
                    <div className="mt-1 text-gray-900">
                      {session.current_campers || 0}
                      {session.max_campers && ` / ${session.max_campers}`}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Κατάσταση</div>
                    <div className="mt-1">{getStatusBadge(session.status)}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ενέργειες</CardTitle>
            <CardDescription>Διαχείριση κατάστασης και περιόδου</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium">Αλλαγή Κατάστασης</div>
              <div className="flex flex-wrap gap-2">
                {session.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('planning')}
                  >
                    Μετάβαση σε Σχεδιασμός
                  </Button>
                )}
                {session.status === 'planning' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('active')}
                  >
                    Ενεργοποίηση
                  </Button>
                )}
                {session.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Ολοκλήρωση
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('cancelled')}
                  className="text-red-600 hover:text-red-700"
                >
                  Ακύρωση
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή Περιόδου
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
