'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

export default function SessionsPage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadSessions();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Περίοδοι Κατασκήνωσης</h1>
          <p className="mt-2 text-gray-600">
            Διαχείριση περιόδων και προγραμμάτων
          </p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button>Νέα Περίοδος</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν περίοδοι ακόμα
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Ξεκίνα δημιουργώντας την πρώτη περίοδο κατασκήνωσης
            </p>
            <div className="mt-6">
              <Link href="/dashboard/sessions/new">
                <Button>Δημιουργία Περιόδου</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Όλες οι Περίοδοι ({sessions.length})</CardTitle>
            <CardDescription>
              Προβολή και διαχείριση όλων των περιόδων κατασκήνωσης
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Όνομα
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Ημερομηνίες
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Κατασκηνωτές
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Κατάσταση
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      Ενέργειες
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{session.name}</div>
                        {session.description && (
                          <div className="mt-1 text-sm text-gray-500">
                            {session.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(session.start_date)} - {formatDate(session.end_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {session.current_campers || 0}
                        {session.max_campers && ` / ${session.max_campers}`}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          <Button variant="outline" size="sm">
                            Προβολή
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
