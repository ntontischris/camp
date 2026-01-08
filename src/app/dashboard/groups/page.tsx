'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Group = Database['public']['Tables']['groups']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

type GroupWithSession = Group & { sessions: Session | null };

export default function GroupsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [groups, setGroups] = useState<GroupWithSession[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadSessions();
    }
  }, [currentOrganization?.id, orgLoading]);

  useEffect(() => {
    if (!orgLoading && currentOrganization && sessions.length >= 0) {
      loadGroups();
    }
  }, [currentOrganization?.id, orgLoading, selectedSessionId, sessions]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

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
    }
  };

  const loadGroups = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      // Get session IDs for current organization
      const sessionIds = sessions.map(s => s.id);

      if (sessionIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('groups')
        .select('*')
        .in('session_id', sessionIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (selectedSessionId !== 'all') {
        query = query.eq('session_id', selectedSessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map sessions to groups
      const groupsWithSessions: GroupWithSession[] = (data || []).map(group => ({
        ...group,
        sessions: sessions.find(s => s.id === group.session_id) || null
      }));

      setGroups(groupsWithSessions);
    } catch (error: any) {
      console.error('Error loading groups:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGenderLabel = (gender: string | null) => {
    const labels: Record<string, string> = {
      male: 'Αγόρια',
      female: 'Κορίτσια',
      mixed: 'Μικτή',
    };
    return labels[gender || 'mixed'] || 'Μικτή';
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

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ομάδες Κατασκηνωτών</h1>
          <p className="mt-2 text-gray-600">Διαχείριση ομάδων ανά περίοδο</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν περίοδοι
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Πρέπει πρώτα να δημιουργήσεις μια περίοδο κατασκήνωσης
            </p>
            <div className="mt-6">
              <Link href="/dashboard/sessions/new">
                <Button>Δημιουργία Περιόδου</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ομάδες Κατασκηνωτών</h1>
          <p className="mt-2 text-gray-600">Διαχείριση ομάδων ανά περίοδο</p>
        </div>
        <Link href="/dashboard/groups/new">
          <Button>Νέα Ομάδα</Button>
        </Link>
      </div>

      {/* Session Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Φιλτράρισμα ανά Περίοδο
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="all">Όλες οι Περίοδοι</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν ομάδες
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {selectedSessionId === 'all'
                ? 'Ξεκίνα δημιουργώντας την πρώτη ομάδα κατασκηνωτών'
                : 'Δεν υπάρχουν ομάδες σε αυτή την περίοδο'}
            </p>
            <div className="mt-6">
              <Link href="/dashboard/groups/new">
                <Button>Δημιουργία Ομάδας</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {group.color && (
                      <div
                        className="h-10 w-10 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.code && (
                        <span className="text-sm text-gray-500">{group.code}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Περίοδος:</span>
                      <span className="font-medium">
                        {group.sessions?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Κατασκηνωτές:</span>
                      <span className="font-medium">
                        {group.current_count || 0}
                        {group.capacity && ` / ${group.capacity}`}
                      </span>
                    </div>
                    {(group.age_min || group.age_max) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ηλικίες:</span>
                        <span className="font-medium">
                          {group.age_min || '?'} - {group.age_max || '?'} ετών
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Τύπος:</span>
                      <span className="font-medium">{getGenderLabel(group.gender)}</span>
                    </div>
                    {!group.is_active && (
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          Ανενεργή
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
