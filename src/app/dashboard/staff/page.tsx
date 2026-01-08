'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Staff = Database['public']['Tables']['staff']['Row'];

const ROLE_LABELS: Record<string, string> = {
  director: 'Διευθυντής',
  coordinator: 'Συντονιστής',
  instructor: 'Εκπαιδευτής',
  counselor: 'Σύμβουλος',
  support: 'Υποστήριξη',
  volunteer: 'Εθελοντής',
};

export default function StaffPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadStaff();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadStaff = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('last_name', { ascending: true });

      if (error) throw error;

      setStaffList(data || []);
    } catch (error: any) {
      console.error('Error loading staff:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    const colors: Record<string, string> = {
      director: 'bg-purple-100 text-purple-800',
      coordinator: 'bg-blue-100 text-blue-800',
      instructor: 'bg-green-100 text-green-800',
      counselor: 'bg-yellow-100 text-yellow-800',
      support: 'bg-gray-100 text-gray-800',
      volunteer: 'bg-orange-100 text-orange-800',
    };
    return colors[role || 'instructor'] || colors.instructor;
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
          <h1 className="text-3xl font-bold text-gray-900">Προσωπικό</h1>
          <p className="mt-2 text-gray-600">Διαχείριση προσωπικού κατασκήνωσης</p>
        </div>
        <Link href="/dashboard/staff/new">
          <Button>Νέο Μέλος</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {staffList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχει προσωπικό
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Ξεκίνα προσθέτοντας τα μέλη του προσωπικού
            </p>
            <div className="mt-6">
              <Link href="/dashboard/staff/new">
                <Button>Προσθήκη Μέλους</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Όλο το Προσωπικό ({staffList.length})</CardTitle>
            <CardDescription>Μέλη προσωπικού της κατασκήνωσης</CardDescription>
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
                      Ρόλος
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Τηλέφωνο
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
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                            {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {staff.last_name} {staff.first_name}
                            </div>
                            {staff.employee_code && (
                              <div className="text-sm text-gray-500">
                                {staff.employee_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(staff.role)}`}>
                          {ROLE_LABELS[staff.role || 'instructor'] || staff.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {staff.email || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {staff.phone || '-'}
                      </td>
                      <td className="px-4 py-4">
                        {staff.is_active ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Ενεργό
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Ανενεργό
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/dashboard/staff/${staff.id}`}>
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
