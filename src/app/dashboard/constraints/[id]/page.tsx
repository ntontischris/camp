'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database, ConstraintType, Json } from '@/lib/types/database';

type Constraint = Database['public']['Tables']['constraints']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

const CONSTRAINT_TYPE_INFO: Record<ConstraintType, { label: string; description: string; icon: string }> = {
  time_restriction: { label: 'Χρονικός Περιορισμός', description: 'Δραστηριότητα μόνο σε συγκεκριμένες ώρες', icon: '🕐' },
  sequence: { label: 'Ακολουθία', description: 'Μετά από Α πρέπει/δεν πρέπει να ακολουθεί Β', icon: '➡️' },
  daily_limit: { label: 'Ημερήσιο Όριο', description: 'Μέγιστες φορές ανά ημέρα', icon: '📊' },
  daily_minimum: { label: 'Ημερήσιο Ελάχιστο', description: 'Τουλάχιστον Χ φορές την ημέρα', icon: '📈' },
  consecutive_limit: { label: 'Όριο Συνεχόμενων', description: 'Μέγιστες συνεχόμενες επαναλήψεις', icon: '🔁' },
  staff_limit: { label: 'Όριο Προσωπικού', description: 'Μέγιστες αναθέσεις προσωπικού', icon: '👥' },
  weather_substitute: { label: 'Αντικατάσταση Καιρού', description: 'Εναλλακτική για κακοκαιρία', icon: '🌧️' },
  facility_exclusive: { label: 'Αποκλειστικότητα Χώρου', description: 'Μία ομάδα κάθε φορά στον χώρο', icon: '🏟️' },
  gap_required: { label: 'Απαιτούμενο Κενό', description: 'Χρόνος ανάμεσα σε δραστηριότητες', icon: '⏸️' },
  group_separation: { label: 'Διαχωρισμός Ομάδων', description: 'Ομάδες που δεν πρέπει να είναι μαζί', icon: '↔️' },
};

export default function ConstraintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();

  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isHard, setIsHard] = useState(true);
  const [priority, setPriority] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadConstraint();
    }
  }, [id, currentOrganization?.id]);

  const loadConstraint = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('constraints')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      // Load session if constraint is session-scoped
      if (data.session_id) {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', data.session_id)
          .single();
        setSession(sessionData);
      }

      setConstraint(data);
      setName(data.name);
      setDescription(data.description || '');
      setIsHard(data.is_hard);
      setPriority(data.priority);
      setIsActive(data.is_active);
      setErrorMessage(data.error_message || '');
    } catch (error: any) {
      console.error('Error loading constraint:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!constraint || !name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('constraints')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_hard: isHard,
          priority,
          is_active: isActive,
          error_message: errorMessage.trim() || null,
        })
        .eq('id', id);

      if (error) throw error;

      setConstraint({
        ...constraint,
        name: name.trim(),
        description: description.trim() || null,
        is_hard: isHard,
        priority,
        is_active: isActive,
        error_message: errorMessage.trim() || null,
      });
      setEditing(false);
    } catch (error: any) {
      console.error('Error saving constraint:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Διαγραφή αυτού του περιορισμού;')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('constraints')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      router.push('/dashboard/constraints');
    } catch (error: any) {
      console.error('Error deleting constraint:', error);
      setError(error.message);
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!constraint) return;

    try {
      const newActive = !constraint.is_active;
      const { error } = await supabase
        .from('constraints')
        .update({ is_active: newActive })
        .eq('id', id);

      if (error) throw error;

      setConstraint({ ...constraint, is_active: newActive });
      setIsActive(newActive);
    } catch (error: any) {
      console.error('Error toggling constraint:', error);
      setError(error.message);
    }
  };

  const formatScope = (scope: Json): string => {
    if (!scope || typeof scope !== 'object') return 'Όλα';
    const s = scope as Record<string, unknown>;
    const parts: string[] = [];
    if (Array.isArray(s.activity_ids) && s.activity_ids.length > 0) {
      parts.push(`${s.activity_ids.length} δραστηριότητες`);
    }
    if (Array.isArray(s.facility_ids) && s.facility_ids.length > 0) {
      parts.push(`${s.facility_ids.length} εγκαταστάσεις`);
    }
    if (Array.isArray(s.group_ids) && s.group_ids.length > 0) {
      parts.push(`${s.group_ids.length} ομάδες`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Όλα';
  };

  const formatCondition = (condition: Json, type: ConstraintType): string => {
    if (!condition || typeof condition !== 'object') return '-';
    const c = condition as Record<string, unknown>;

    switch (type) {
      case 'time_restriction':
        if (c.start_time && c.end_time) {
          return `${c.start_time} - ${c.end_time}`;
        }
        return '-';
      case 'daily_limit':
        return c.limit ? `Μέγιστο ${c.limit} φορές/ημέρα` : '-';
      case 'daily_minimum':
        return c.limit ? `Τουλάχιστον ${c.limit} φορές/ημέρα` : '-';
      case 'consecutive_limit':
        return c.limit ? `Μέγιστο ${c.limit} συνεχόμενες` : '-';
      case 'staff_limit':
        return c.limit ? `Μέγιστο ${c.limit} slots/άτομο/ημέρα` : '-';
      case 'gap_required':
        return c.minutes ? `${c.minutes} λεπτά κενό` : '-';
      default:
        return 'Αυτόματη εφαρμογή';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!constraint) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Ο περιορισμός δεν βρέθηκε.</div>
      </div>
    );
  }

  const typeInfo = CONSTRAINT_TYPE_INFO[constraint.constraint_type];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/constraints" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στους Περιορισμούς
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{typeInfo.icon}</div>
              <div>
                <CardTitle className="text-2xl">{constraint.name}</CardTitle>
                <CardDescription className="mt-1">
                  {typeInfo.label}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  constraint.is_hard
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {constraint.is_hard ? 'Αυστηρός' : 'Ευέλικτος'}
              </span>
              <button
                onClick={toggleActive}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  constraint.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {constraint.is_active ? 'Ενεργός' : 'Ανενεργός'}
              </button>
            </div>
          </div>
        </CardHeader>
        {constraint.description && (
          <CardContent className="pt-0">
            <p className="text-gray-600">{constraint.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Λεπτομέρειες</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Τύπος</dt>
              <dd className="mt-1 text-gray-900">{typeInfo.label}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Εμβέλεια</dt>
              <dd className="mt-1 text-gray-900">
                {constraint.organization_id ? 'Global (όλες οι περίοδοι)' : `Περίοδος: ${session?.name || '-'}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Εφαρμόζεται σε</dt>
              <dd className="mt-1 text-gray-900">{formatScope(constraint.scope)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Συνθήκη</dt>
              <dd className="mt-1 text-gray-900">
                {formatCondition(constraint.condition, constraint.constraint_type)}
              </dd>
            </div>
            {!constraint.is_hard && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Προτεραιότητα</dt>
                <dd className="mt-1 text-gray-900">{constraint.priority}/10</dd>
              </div>
            )}
            {constraint.error_message && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Μήνυμα Σφάλματος</dt>
                <dd className="mt-1 text-gray-900">{constraint.error_message}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Επεξεργασία</CardTitle>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Επεξεργασία
              </Button>
            )}
          </div>
        </CardHeader>
        {editing && (
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Όνομα *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Περιγραφή</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Είδος</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isHard}
                    onChange={() => setIsHard(true)}
                    disabled={saving}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-red-700">Αυστηρός</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isHard}
                    onChange={() => setIsHard(false)}
                    disabled={saving}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-yellow-700">Ευέλικτος</span>
                </label>
              </div>
            </div>

            {!isHard && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Προτεραιότητα: {priority}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full"
                  disabled={saving}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Μήνυμα Σφάλματος</label>
              <Input
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                disabled={saving}
                placeholder="Προαιρετικό μήνυμα..."
              />
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:text-red-700"
              >
                Διαγραφή
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Ακύρωση
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
