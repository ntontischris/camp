'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';
import type { ConstraintType } from '@/lib/types/database';

type Constraint = Database['public']['Tables']['constraints']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

const CONSTRAINT_TYPE_INFO: Record<ConstraintType, { label: string; description: string; icon: string }> = {
  time_restriction: {
    label: 'Χρονικός Περιορισμός',
    description: 'Δραστηριότητα μόνο σε συγκεκριμένες ώρες',
    icon: '🕐',
  },
  sequence: {
    label: 'Ακολουθία',
    description: 'Μετά από Α πρέπει/δεν πρέπει να ακολουθεί Β',
    icon: '➡️',
  },
  daily_limit: {
    label: 'Ημερήσιο Όριο',
    description: 'Μέγιστες φορές ανά ημέρα',
    icon: '📊',
  },
  daily_minimum: {
    label: 'Ημερήσιο Ελάχιστο',
    description: 'Τουλάχιστον Χ φορές την ημέρα',
    icon: '📈',
  },
  consecutive_limit: {
    label: 'Όριο Συνεχόμενων',
    description: 'Μέγιστες συνεχόμενες επαναλήψεις',
    icon: '🔁',
  },
  staff_limit: {
    label: 'Όριο Προσωπικού',
    description: 'Μέγιστες αναθέσεις προσωπικού',
    icon: '👥',
  },
  weather_substitute: {
    label: 'Αντικατάσταση Καιρού',
    description: 'Εναλλακτική για κακοκαιρία',
    icon: '🌧️',
  },
  facility_exclusive: {
    label: 'Αποκλειστικότητα Χώρου',
    description: 'Μία ομάδα κάθε φορά στον χώρο',
    icon: '🏟️',
  },
  gap_required: {
    label: 'Απαιτούμενο Κενό',
    description: 'Χρόνος ανάμεσα σε δραστηριότητες',
    icon: '⏸️',
  },
  group_separation: {
    label: 'Διαχωρισμός Ομάδων',
    description: 'Ομάδες που δεν πρέπει να είναι μαζί',
    icon: '↔️',
  },
};

export default function ConstraintsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedScope, setSelectedScope] = useState<'all' | 'organization' | string>('all');
  const [filterType, setFilterType] = useState<ConstraintType | 'all'>('all');
  const [filterHard, setFilterHard] = useState<'all' | 'hard' | 'soft'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadData();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('start_date', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Load constraints
      const { data: constraintsData, error: constraintsError } = await supabase
        .from('constraints')
        .select('*')
        .or(`organization_id.eq.${currentOrganization.id},session_id.in.(${sessionsData?.map(s => s.id).join(',') || ''})`)
        .is('deleted_at', null)
        .order('priority', { ascending: true })
        .order('name', { ascending: true });

      if (constraintsError) throw constraintsError;
      setConstraints(constraintsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (constraint: Constraint) => {
    try {
      const { error } = await supabase
        .from('constraints')
        .update({ is_active: !constraint.is_active })
        .eq('id', constraint.id);

      if (error) throw error;

      setConstraints(constraints.map(c =>
        c.id === constraint.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error: any) {
      console.error('Error toggling constraint:', error);
      setError(error.message);
    }
  };

  const deleteConstraint = async (id: string) => {
    if (!confirm('Διαγραφή αυτού του περιορισμού;')) return;

    try {
      const { error } = await supabase
        .from('constraints')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setConstraints(constraints.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Error deleting constraint:', error);
      setError(error.message);
    }
  };

  // Filter constraints
  const filteredConstraints = constraints.filter(c => {
    // Scope filter
    if (selectedScope === 'organization' && !c.organization_id) return false;
    if (selectedScope !== 'all' && selectedScope !== 'organization' && c.session_id !== selectedScope) return false;

    // Type filter
    if (filterType !== 'all' && c.constraint_type !== filterType) return false;

    // Hard/Soft filter
    if (filterHard === 'hard' && !c.is_hard) return false;
    if (filterHard === 'soft' && c.is_hard) return false;

    return true;
  });

  if (orgLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Περιορισμοί</h1>
          <p className="mt-2 text-gray-600">
            Διαχείριση κανόνων για τη δημιουργία προγράμματος
          </p>
        </div>
        <Link href="/dashboard/constraints/new">
          <Button>Νέος Περιορισμός</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Εμβέλεια</label>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="all">Όλα</option>
                <option value="organization">Οργανισμός (Global)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Περίοδος: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Τύπος</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ConstraintType | 'all')}
                className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="all">Όλοι οι τύποι</option>
                {Object.entries(CONSTRAINT_TYPE_INFO).map(([type, info]) => (
                  <option key={type} value={type}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Είδος</label>
              <select
                value={filterHard}
                onChange={(e) => setFilterHard(e.target.value as 'all' | 'hard' | 'soft')}
                className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="all">Όλα</option>
                <option value="hard">Αυστηροί (Hard)</option>
                <option value="soft">Ευέλικτοι (Soft)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Constraints List */}
      {filteredConstraints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν περιορισμοί
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Δημιούργησε περιορισμούς για να ελέγξεις πώς δημιουργείται το πρόγραμμα
            </p>
            <div className="mt-6">
              <Link href="/dashboard/constraints/new">
                <Button>Δημιουργία Περιορισμού</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConstraints.map((constraint) => {
            const typeInfo = CONSTRAINT_TYPE_INFO[constraint.constraint_type];
            const session = sessions.find(s => s.id === constraint.session_id);

            return (
              <Card
                key={constraint.id}
                className={`transition-opacity ${!constraint.is_active ? 'opacity-60' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{typeInfo.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {constraint.name}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              constraint.is_hard
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {constraint.is_hard ? 'Αυστηρός' : 'Ευέλικτος'}
                          </span>
                          {!constraint.is_active && (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Ανενεργός
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{typeInfo.label}</p>
                        {constraint.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {constraint.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <span>
                            {constraint.organization_id ? 'Global' : `Περίοδος: ${session?.name || '-'}`}
                          </span>
                          <span>Προτεραιότητα: {constraint.priority}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(constraint)}
                        className={`rounded-full p-1.5 text-sm ${
                          constraint.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={constraint.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                      >
                        {constraint.is_active ? '✓' : '○'}
                      </button>
                      <Link href={`/dashboard/constraints/${constraint.id}`}>
                        <Button variant="outline" size="sm">
                          Επεξεργασία
                        </Button>
                      </Link>
                      <button
                        onClick={() => deleteConstraint(constraint.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Διαγραφή"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Στατιστικά</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {constraints.length}
              </div>
              <div className="text-sm text-gray-500">Σύνολο</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {constraints.filter(c => c.is_hard).length}
              </div>
              <div className="text-sm text-gray-500">Αυστηροί</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {constraints.filter(c => !c.is_hard).length}
              </div>
              <div className="text-sm text-gray-500">Ευέλικτοι</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {constraints.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Ενεργοί</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
