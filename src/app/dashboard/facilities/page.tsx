'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Facility = Database['public']['Tables']['facilities']['Row'];

export default function FacilitiesPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadFacilities();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadFacilities = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setFacilities(data || []);
    } catch (error: any) {
      console.error('Error loading facilities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Εγκαταστάσεις</h1>
          <p className="mt-2 text-gray-600">Χώροι και εγκαταστάσεις της κατασκήνωσης</p>
        </div>
        <Link href="/dashboard/facilities/new">
          <Button>Νέα Εγκατάσταση</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν εγκαταστάσεις
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Ξεκίνα προσθέτοντας τους χώρους της κατασκήνωσης
            </p>
            <div className="mt-6">
              <Link href="/dashboard/facilities/new">
                <Button>Προσθήκη Εγκατάστασης</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Link key={facility.id} href={`/dashboard/facilities/${facility.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{facility.name}</CardTitle>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      facility.indoor
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {facility.indoor ? 'Εσωτερικός' : 'Υπαίθριος'}
                    </span>
                  </div>
                  {facility.code && (
                    <span className="text-sm text-gray-500">{facility.code}</span>
                  )}
                </CardHeader>
                <CardContent>
                  {facility.description && (
                    <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                      {facility.description}
                    </p>
                  )}
                  <div className="space-y-1 text-sm">
                    {facility.capacity && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Χωρητικότητα:</span>
                        <span className="font-medium">{facility.capacity} άτομα</span>
                      </div>
                    )}
                    {facility.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Τοποθεσία:</span>
                        <span className="font-medium">{facility.location}</span>
                      </div>
                    )}
                    {!facility.is_active && (
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
      )}
    </div>
  );
}
