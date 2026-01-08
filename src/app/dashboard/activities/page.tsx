'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Activity = Database['public']['Tables']['activities']['Row'];

export default function ActivitiesPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadActivities();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadActivities = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setActivities(data || []);
    } catch (error: any) {
      console.error('Error loading activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} λεπτά`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ώρ${hours === 1 ? 'α' : 'ες'}`;
    return `${hours}ώ ${mins}λ`;
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
          <h1 className="text-3xl font-bold text-gray-900">Δραστηριότητες</h1>
          <p className="mt-2 text-gray-600">Βιβλιοθήκη δραστηριοτήτων κατασκήνωσης</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}
            >
              Table
            </button>
          </div>
          <Link href="/dashboard/activities/new">
            <Button>Νέα Δραστηριότητα</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν δραστηριότητες
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Ξεκίνα δημιουργώντας την πρώτη δραστηριότητα
            </p>
            <div className="mt-6">
              <Link href="/dashboard/activities/new">
                <Button>Δημιουργία Δραστηριότητας</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/dashboard/activities/${activity.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {activity.color && (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: activity.color }}
                      >
                        {activity.icon || activity.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{activity.name}</CardTitle>
                      {activity.code && (
                        <span className="text-sm text-gray-500">{activity.code}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activity.description && (
                    <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Διάρκεια:</span>
                      <span className="font-medium">
                        {formatDuration(activity.duration_minutes)}
                      </span>
                    </div>
                    {(activity.min_participants || activity.max_participants) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Συμμετέχοντες:</span>
                        <span className="font-medium">
                          {activity.min_participants || '?'} - {activity.max_participants || '?'}
                        </span>
                      </div>
                    )}
                    {activity.required_staff_count && activity.required_staff_count > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Staff:</span>
                        <span className="font-medium">{activity.required_staff_count}</span>
                      </div>
                    )}
                    {activity.weather_dependent && (
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Εξαρτάται από καιρό
                        </span>
                      </div>
                    )}
                    {!activity.is_active && (
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Όλες οι Δραστηριότητες ({activities.length})</CardTitle>
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
                      Διάρκεια
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Συμμετέχοντες
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Staff
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
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {activity.color && (
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: activity.color }}
                            >
                              {activity.icon || activity.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{activity.name}</div>
                            {activity.code && (
                              <div className="text-sm text-gray-500">{activity.code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDuration(activity.duration_minutes)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {activity.min_participants || '-'} - {activity.max_participants || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {activity.required_staff_count || 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          {activity.is_active ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Ενεργή
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Ανενεργή
                            </span>
                          )}
                          {activity.weather_dependent && (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              Καιρός
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/dashboard/activities/${activity.id}`}>
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
