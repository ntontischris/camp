'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerationWizard } from '@/components/schedule/generation-wizard';
import { ExportModal } from '@/components/schedule/export-modal';
import { WeatherPanel } from '@/components/schedule/weather-panel';
import { detectConflicts, type Conflict } from '@/lib/scheduling/conflicts';
import type { Database } from '@/lib/types/database';
import type { GeneratedSlot } from '@/lib/scheduling';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];

type ScheduleSlotWithRelations = ScheduleSlot & {
  activities?: Activity | null;
  facilities?: Facility | null;
  groups?: Group | null;
};
type Staff = Database['public']['Tables']['staff']['Row'];

const DAYS_GR = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
const DAYS_FULL = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];

type ViewMode = 'week' | 'day' | 'facility' | 'staff';

function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [defaultTemplate, setDefaultTemplate] = useState<DayTemplate | null>(null);
  const [templateSlots, setTemplateSlots] = useState<DayTemplateSlot[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlotWithRelations[]>([]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });

  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [allScheduleSlots, setAllScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [staff, setStaff] = useState<Staff[]>([]);

  // Generation wizard state
  const [showGenerationWizard, setShowGenerationWizard] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);

  // Weather panel state
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);

  // Conflict detection
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);

  // Modal state
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState<{
    date: string;
    groupId: string;
    templateSlot: DayTemplateSlot | null;
    existingSlot: ScheduleSlotWithRelations | null;
  } | null>(null);
  const [modalActivityId, setModalActivityId] = useState<string>('');
  const [modalFacilityId, setModalFacilityId] = useState<string>('');
  const [modalNotes, setModalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Filter week dates to session range
  const validWeekDates = useMemo(() => {
    if (!selectedSession) return weekDates;
    const start = new Date(selectedSession.start_date);
    const end = new Date(selectedSession.end_date);
    return weekDates.filter(d => d >= start && d <= end);
  }, [weekDates, selectedSession]);

  useEffect(() => {
    if (!orgLoading && currentOrganization) {
      loadSessions();
      loadActivities();
      loadFacilities();
      loadDefaultTemplate();
      loadStaff();
    }
  }, [currentOrganization?.id, orgLoading]);

  useEffect(() => {
    if (selectedSessionId) {
      loadGroups();
      loadScheduleSlots();
      loadConstraints();
      loadAllScheduleSlots();
      const session = sessions.find(s => s.id === selectedSessionId);
      setSelectedSession(session || null);

      // Set week to session start if out of range
      if (session) {
        const sessionStart = new Date(session.start_date);
        const sessionEnd = new Date(session.end_date);
        if (currentWeekStart < sessionStart || currentWeekStart > sessionEnd) {
          const day = sessionStart.getDay();
          const diff = sessionStart.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(sessionStart);
          weekStart.setDate(diff);
          setCurrentWeekStart(weekStart);
        }
      }
    }
  }, [selectedSessionId, sessions, currentOrganization?.id]);

  useEffect(() => {
    if (selectedSessionId) {
      loadScheduleSlots();
    }
  }, [currentWeekStart, selectedSessionId]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .in('status', ['planning', 'active'])
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      // Auto-select first session
      if (data && data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    if (!selectedSessionId) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('session_id', selectedSessionId)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error loading groups:', error);
    }
  };

  const loadActivities = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Error loading activities:', error);
    }
  };

  const loadFacilities = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setFacilities(data || []);
    } catch (error: any) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadStaff = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error loading staff:', error);
    }
  };

  const loadDefaultTemplate = async () => {
    if (!currentOrganization) return;

    try {
      const { data: template, error: templateError } = await supabase
        .from('day_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_default', true)
        .is('deleted_at', null)
        .single();

      if (templateError && templateError.code !== 'PGRST116') throw templateError;

      if (template) {
        setDefaultTemplate(template);

        const { data: slots, error: slotsError } = await supabase
          .from('day_template_slots')
          .select('*')
          .eq('day_template_id', template.id)
          .order('sort_order', { ascending: true });

        if (slotsError) throw slotsError;
        setTemplateSlots(slots || []);
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
    }
  };

  const loadConstraints = async () => {
    if (!currentOrganization || !selectedSessionId) return;

    try {
      const { data, error } = await supabase
        .from('constraints')
        .select('*')
        .or(`organization_id.eq.${currentOrganization.id},session_id.eq.${selectedSessionId}`)
        .is('deleted_at', null)
        .order('priority', { ascending: true });

      if (error) throw error;
      setConstraints(data || []);
    } catch (error: any) {
      console.error('Error loading constraints:', error);
    }
  };

  const loadAllScheduleSlots = async () => {
    if (!selectedSessionId) return;

    try {
      const { data, error } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('session_id', selectedSessionId);

      if (error) throw error;
      setAllScheduleSlots(data || []);

      // Detect conflicts after loading slots
      if (data && data.length > 0) {
        const detectedConflicts = detectConflicts({
          slots: data,
          activities,
          facilities,
          groups,
          constraints
        });
        setConflicts(detectedConflicts);
      } else {
        setConflicts([]);
      }
    } catch (error: any) {
      console.error('Error loading all schedule slots:', error);
    }
  };

  // Apply weather substitutions
  const handleApplyWeatherSubstitutions = async (substitutions: { slotId: string; activityId: string }[]) => {
    for (const sub of substitutions) {
      const { error } = await supabase
        .from('schedule_slots')
        .update({ activity_id: sub.activityId })
        .eq('id', sub.slotId);

      if (error) {
        console.error('Error applying substitution:', error);
        throw error;
      }
    }

    // Reload schedule after applying
    await loadScheduleSlots();
    await loadAllScheduleSlots();
  };

  const loadScheduleSlots = async () => {
    if (!selectedSessionId) return;

    try {
      const startDate = formatDate(weekDates[0]);
      const endDate = formatDate(weekDates[6]);

      const { data, error } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('session_id', selectedSessionId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Map relations manually
      const slotsWithRelations: ScheduleSlotWithRelations[] = (data || []).map(slot => ({
        ...slot,
        activities: slot.activity_id ? activities.find(a => a.id === slot.activity_id) || null : null,
        facilities: slot.facility_id ? facilities.find(f => f.id === slot.facility_id) || null : null,
        groups: slot.group_id ? groups.find(g => g.id === slot.group_id) || null : null
      }));

      setScheduleSlots(slotsWithRelations);
    } catch (error: any) {
      console.error('Error loading schedule:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const getSlotForCell = (groupId: string, date: Date, templateSlot: DayTemplateSlot) => {
    const dateStr = formatDate(date);
    return scheduleSlots.find(
      s => s.group_id === groupId &&
           s.date === dateStr &&
           s.start_time.slice(0, 5) === templateSlot.start_time.slice(0, 5)
    );
  };

  const openSlotModal = (
    date: Date,
    groupId: string,
    templateSlot: DayTemplateSlot,
    existingSlot: ScheduleSlotWithRelations | null
  ) => {
    setSelectedSlotData({
      date: formatDate(date),
      groupId,
      templateSlot,
      existingSlot,
    });
    setModalActivityId(existingSlot?.activity_id || '');
    setModalFacilityId(existingSlot?.facility_id || '');
    setModalNotes(existingSlot?.notes || '');
    setShowSlotModal(true);
  };

  const closeSlotModal = () => {
    setShowSlotModal(false);
    setSelectedSlotData(null);
    setModalActivityId('');
    setModalFacilityId('');
    setModalNotes('');
  };

  const saveSlot = async () => {
    if (!selectedSlotData || !selectedSessionId) return;

    setSaving(true);
    setError(null);

    try {
      const slotData = {
        session_id: selectedSessionId,
        date: selectedSlotData.date,
        group_id: selectedSlotData.groupId,
        start_time: selectedSlotData.templateSlot?.start_time || '00:00',
        end_time: selectedSlotData.templateSlot?.end_time || '00:00',
        day_template_slot_id: selectedSlotData.templateSlot?.id || null,
        activity_id: modalActivityId || null,
        facility_id: modalFacilityId || null,
        notes: modalNotes || null,
        status: 'scheduled' as const,
        generation_method: 'manual' as const,
      };

      if (selectedSlotData.existingSlot) {
        // Update
        const { error } = await supabase
          .from('schedule_slots')
          .update({
            activity_id: modalActivityId || null,
            facility_id: modalFacilityId || null,
            notes: modalNotes || null,
          })
          .eq('id', selectedSlotData.existingSlot.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('schedule_slots')
          .insert(slotData);

        if (error) throw error;
      }

      await loadScheduleSlots();
      closeSlotModal();
    } catch (error: any) {
      console.error('Error saving slot:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async () => {
    if (!selectedSlotData?.existingSlot) return;
    if (!confirm('Διαγραφή αυτής της καταχώρησης;')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('schedule_slots')
        .delete()
        .eq('id', selectedSlotData.existingSlot.id);

      if (error) throw error;

      await loadScheduleSlots();
      closeSlotModal();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle applying generated slots from the wizard
  const handleApplyGeneratedSlots = useCallback(async (generatedSlots: GeneratedSlot[]) => {
    if (!selectedSessionId || generatedSlots.length === 0) return;

    const slotsToInsert = generatedSlots.map(slot => ({
      session_id: selectedSessionId,
      date: slot.date,
      group_id: slot.groupId,
      day_template_slot_id: slot.templateSlotId,
      start_time: slot.startTime,
      end_time: slot.endTime,
      activity_id: slot.activityId,
      facility_id: slot.facilityId,
      status: 'scheduled' as const,
      generation_method: 'auto_generated' as const
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < slotsToInsert.length; i += batchSize) {
      const batch = slotsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('schedule_slots')
        .insert(batch);

      if (error) {
        throw new Error(`Σφάλμα κατά την αποθήκευση: ${error.message}`);
      }
    }

    // Reload schedule data
    await loadScheduleSlots();
    await loadAllScheduleSlots();
  }, [selectedSessionId, supabase]);

  if (orgLoading || loading) {
    return (
      <div className="mx-auto max-w-full px-4 py-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-full px-4 py-8">
        <div className="text-center text-gray-600">Δεν έχεις επιλέξει οργανισμό.</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Δεν υπάρχουν διαθέσιμες περίοδοι
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Δημιούργησε μια περίοδο με status &quot;planning&quot; ή &quot;active&quot; για να ξεκινήσεις
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const schedulableSlots = templateSlots.filter(s => s.slot_type === 'activity' && s.is_schedulable);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Πρόγραμμα</h1>
            <p className="text-sm text-gray-600">Εβδομαδιαία προβολή δραστηριοτήτων</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Selector */}
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>

            {/* View Mode Selector */}
            <div className="flex items-center border rounded-md overflow-hidden">
              {[
                { mode: 'week' as ViewMode, label: 'Εβδομάδα' },
                { mode: 'day' as ViewMode, label: 'Ημέρα' },
                { mode: 'facility' as ViewMode, label: 'Χώροι' },
                { mode: 'staff' as ViewMode, label: 'Staff' },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                ←
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Σήμερα
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                →
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Conflict Indicator */}
            {conflicts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConflicts(!showConflicts)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                ⚠️ {conflicts.length} συγκρούσεις
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Weather Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWeatherPanel(true)}
            >
              🌤️ Καιρός
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
            >
              📄 Εξαγωγή
            </Button>

            {/* Generate Button */}
            <Button
              onClick={() => setShowGenerationWizard(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              ✨ Αυτόματη Δημιουργία
            </Button>
          </div>
        </div>

        {/* Week Display */}
        <div className="mt-2 text-sm text-gray-600">
          {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[6])}
          {selectedSession && (
            <span className="ml-4 text-gray-400">
              Περίοδος: {new Date(selectedSession.start_date).toLocaleDateString('el-GR')} -{' '}
              {new Date(selectedSession.end_date).toLocaleDateString('el-GR')}
            </span>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Δεν υπάρχουν ομάδες
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Πρόσθεσε ομάδες στην περίοδο για να δημιουργήσεις πρόγραμμα
              </p>
            </CardContent>
          </Card>
        ) : !defaultTemplate ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Δεν υπάρχει προεπιλεγμένο πρότυπο ημέρας
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Δημιούργησε ένα πρότυπο και όρισέ το ως προεπιλογή
              </p>
            </CardContent>
          </Card>
        ) : schedulableSlots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Το πρότυπο δεν έχει slots δραστηριοτήτων
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Πρόσθεσε χρονοθυρίδες τύπου &quot;Δραστηριότητα&quot; στο πρότυπο
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-gray-50 p-2 text-left text-sm font-medium text-gray-700 sticky left-0 z-10 min-w-[120px]">
                    Ομάδα / Slot
                  </th>
                  {validWeekDates.map((date, idx) => {
                    const dayIdx = (date.getDay() + 6) % 7; // Monday = 0
                    return (
                      <th
                        key={idx}
                        className="border border-gray-200 bg-gray-50 p-2 text-center text-sm font-medium text-gray-700 min-w-[140px]"
                      >
                        <div>{DAYS_GR[dayIdx]}</div>
                        <div className="text-xs font-normal text-gray-500">
                          {formatDateDisplay(date)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  schedulableSlots.map((slot, slotIdx) => (
                    <tr key={`${group.id}-${slot.id}`}>
                      <td className="border border-gray-200 bg-gray-50 p-2 sticky left-0 z-10">
                        <div className="flex items-center gap-2">
                          {slotIdx === 0 && (
                            <div
                              className="h-6 w-1 rounded"
                              style={{ backgroundColor: group.color || '#6B7280' }}
                            />
                          )}
                          <div>
                            {slotIdx === 0 && (
                              <div className="font-medium text-gray-900 text-sm">
                                {group.name}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                          </div>
                        </div>
                      </td>
                      {validWeekDates.map((date, dateIdx) => {
                        const existingSlot = getSlotForCell(group.id, date, slot);
                        const activity = existingSlot?.activities;

                        return (
                          <td
                            key={dateIdx}
                            className={`border border-gray-200 p-1 cursor-pointer transition-colors hover:bg-gray-50 ${
                              existingSlot ? '' : 'bg-gray-25'
                            }`}
                            onClick={() => openSlotModal(date, group.id, slot, existingSlot || null)}
                          >
                            {existingSlot && activity ? (
                              <div
                                className="rounded p-2 text-sm h-full min-h-[50px]"
                                style={{
                                  backgroundColor: activity.color ? `${activity.color}20` : '#E5E7EB',
                                  borderLeft: `3px solid ${activity.color || '#6B7280'}`,
                                }}
                              >
                                <div className="font-medium text-gray-900 truncate">
                                  {activity.name}
                                </div>
                                {existingSlot.facilities && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {existingSlot.facilities.name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-[50px] flex items-center justify-center text-gray-300 text-xs">
                                + Προσθήκη
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slot Modal */}
      {showSlotModal && selectedSlotData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedSlotData.existingSlot ? 'Επεξεργασία' : 'Νέα'} Δραστηριότητα
              </h2>
              <p className="text-sm text-gray-500">
                {groups.find(g => g.id === selectedSlotData.groupId)?.name} •{' '}
                {new Date(selectedSlotData.date).toLocaleDateString('el-GR')} •{' '}
                {selectedSlotData.templateSlot && formatTime(selectedSlotData.templateSlot.start_time)}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Δραστηριότητα
                </label>
                <select
                  value={modalActivityId}
                  onChange={(e) => setModalActivityId(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  disabled={saving}
                >
                  <option value="">Επίλεξε δραστηριότητα...</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Εγκατάσταση
                </label>
                <select
                  value={modalFacilityId}
                  onChange={(e) => setModalFacilityId(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  disabled={saving}
                >
                  <option value="">Επίλεξε εγκατάσταση...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Σημειώσεις
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  disabled={saving}
                  placeholder="Προαιρετικές σημειώσεις..."
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-between">
              <div>
                {selectedSlotData.existingSlot && (
                  <Button
                    variant="outline"
                    onClick={deleteSlot}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700"
                  >
                    Διαγραφή
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeSlotModal} disabled={saving}>
                  Ακύρωση
                </Button>
                <Button onClick={saveSlot} disabled={saving || !modalActivityId}>
                  {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Wizard */}
      {showGenerationWizard && selectedSession && defaultTemplate && (
        <GenerationWizard
          session={selectedSession}
          groups={groups}
          activities={activities}
          facilities={facilities}
          template={defaultTemplate}
          templateSlots={templateSlots}
          constraints={constraints}
          existingSlots={allScheduleSlots}
          onClose={() => setShowGenerationWizard(false)}
          onApply={handleApplyGeneratedSlots}
        />
      )}

      {/* Export Modal */}
      {showExportModal && selectedSession && (
        <ExportModal
          data={{
            session: selectedSession,
            groups,
            activities,
            facilities,
            slots: allScheduleSlots,
            dateRange: {
              start: selectedSession.start_date,
              end: selectedSession.end_date
            }
          }}
          groups={groups}
          facilities={facilities}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Weather Panel */}
      {showWeatherPanel && selectedSession && (
        <WeatherPanel
          dateRange={{
            start: selectedSession.start_date,
            end: selectedSession.end_date
          }}
          slots={allScheduleSlots}
          activities={activities}
          constraints={constraints}
          onApplySubstitutions={handleApplyWeatherSubstitutions}
          onClose={() => setShowWeatherPanel(false)}
        />
      )}

      {/* Conflicts Panel */}
      {showConflicts && conflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                ⚠️ Συγκρούσεις Προγράμματος ({conflicts.length})
              </h2>
              <button
                onClick={() => setShowConflicts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    conflict.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    conflict.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-lg ${
                        conflict.severity === 'critical' ? 'text-red-600' :
                        conflict.severity === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {conflict.severity === 'critical' ? '🔴' : conflict.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{conflict.message}</div>
                        <div className="text-sm text-gray-600">{conflict.description}</div>
                        {conflict.suggestion && (
                          <div className="text-xs text-gray-500 mt-1">
                            💡 {conflict.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end bg-gray-50">
              <Button onClick={() => setShowConflicts(false)}>
                Κλείσιμο
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Φόρτωση προγράμματος...</div>
        </div>
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  );
}
