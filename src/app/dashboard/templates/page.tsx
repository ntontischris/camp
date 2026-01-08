'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];

type DayTemplateWithSlots = DayTemplate & {
  day_template_slots: DayTemplateSlot[];
};

const SLOT_TYPE_LABELS: Record<string, string> = {
  activity: 'Δραστηριότητα',
  meal: 'Γεύμα',
  break: 'Διάλειμμα',
  rest: 'Ξεκούραση',
  free: 'Ελεύθερος Χρόνος',
  assembly: 'Συγκέντρωση',
  transition: 'Μετάβαση',
};

const SLOT_TYPE_COLORS: Record<string, string> = {
  activity: 'bg-blue-100 text-blue-800',
  meal: 'bg-orange-100 text-orange-800',
  break: 'bg-green-100 text-green-800',
  rest: 'bg-purple-100 text-purple-800',
  free: 'bg-gray-100 text-gray-800',
  assembly: 'bg-yellow-100 text-yellow-800',
  transition: 'bg-pink-100 text-pink-800',
};

export default function TemplatesPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();
  const [templates, setTemplates] = useState<DayTemplateWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadTemplates();
    }
  }, [currentOrganization?.id, orgLoading]);

  const loadTemplates = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('day_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (templatesError) throw templatesError;

      // Load all template slots for these templates
      const templateIds = templatesData?.map(t => t.id) || [];
      const { data: slotsData, error: slotsError } = await supabase
        .from('day_template_slots')
        .select('*')
        .in('day_template_id', templateIds)
        .order('sort_order', { ascending: true });

      if (slotsError) throw slotsError;

      // Map slots to templates
      const templatesWithSlots: DayTemplateWithSlots[] = (templatesData || []).map(template => ({
        ...template,
        day_template_slots: (slotsData || []).filter(s => s.day_template_id === template.id)
      }));

      setTemplates(templatesWithSlots);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const getActivitySlotCount = (slots: DayTemplateSlot[]) => {
    return slots.filter(s => s.slot_type === 'activity' && s.is_schedulable).length;
  };

  const getTotalDuration = (slots: DayTemplateSlot[]) => {
    if (slots.length === 0) return null;

    const sortedSlots = [...slots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    return `${formatTime(firstSlot.start_time)} - ${formatTime(lastSlot.end_time)}`;
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
          <h1 className="text-3xl font-bold text-gray-900">Πρότυπα Ημέρας</h1>
          <p className="mt-2 text-gray-600">
            Δημιούργησε πρότυπα για τη δομή της ημέρας με χρονοθυρίδες
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button>Νέο Πρότυπο</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν πρότυπα ημέρας
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Δημιούργησε ένα πρότυπο για να ορίσεις τη δομή μιας τυπικής ημέρας
            </p>
            <div className="mt-6">
              <Link href="/dashboard/templates/new">
                <Button>Δημιουργία Προτύπου</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {templates.map((template) => (
            <Link key={template.id} href={`/dashboard/templates/${template.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {template.is_default && (
                        <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                          Προεπιλογή
                        </span>
                      )}
                      {!template.is_active && (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Ανενεργό
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Χρονοθυρίδες:</span>
                      <span className="ml-2 font-medium">
                        {template.day_template_slots.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Δραστηριότητες:</span>
                      <span className="ml-2 font-medium">
                        {getActivitySlotCount(template.day_template_slots)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Διάρκεια:</span>
                      <span className="ml-2 font-medium">
                        {getTotalDuration(template.day_template_slots) || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Timeline Preview */}
                  {template.day_template_slots.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Προεπισκόπηση:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[...template.day_template_slots]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .slice(0, 8)
                          .map((slot) => (
                            <span
                              key={slot.id}
                              className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                                SLOT_TYPE_COLORS[slot.slot_type] || 'bg-gray-100 text-gray-800'
                              }`}
                              title={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}: ${slot.name || SLOT_TYPE_LABELS[slot.slot_type]}`}
                            >
                              {formatTime(slot.start_time)}
                            </span>
                          ))}
                        {template.day_template_slots.length > 8 && (
                          <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                            +{template.day_template_slots.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
