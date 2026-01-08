'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { entityToast, parseDbError } from '@/lib/toast';

type CreateType = 'group' | 'activity' | 'staff' | 'facility' | 'session';

interface QuickCreateModalProps {
  type: CreateType | null;
  onClose: () => void;
  onSuccess?: (type: CreateType, data: any) => void;
  defaultSessionId?: string;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

const PRESETS = {
  group: [
    { name: 'Αετοί', icon: '🦅' },
    { name: 'Λιοντάρια', icon: '🦁' },
    { name: 'Δελφίνια', icon: '🐬' },
    { name: 'Αστέρια', icon: '⭐' },
    { name: 'Τίγρεις', icon: '🐯' },
    { name: 'Πάνθηρες', icon: '🐆' },
  ],
  activity: [
    { name: 'Κολύμβηση', icon: '🏊', duration: 45 },
    { name: 'Ποδόσφαιρο', icon: '⚽', duration: 60 },
    { name: 'Χειροτεχνία', icon: '🎨', duration: 45 },
    { name: 'Μουσική', icon: '🎵', duration: 30 },
    { name: 'Θέατρο', icon: '🎭', duration: 45 },
    { name: 'Αθλοπαιδιές', icon: '🏃', duration: 45 },
    { name: 'Πεζοπορία', icon: '🥾', duration: 90 },
    { name: 'Αναρρίχηση', icon: '🧗', duration: 60 },
  ],
  facility: [
    { name: 'Πισίνα', icon: '🏊', capacity: 30 },
    { name: 'Γήπεδο Ποδοσφαίρου', icon: '⚽', capacity: 40 },
    { name: 'Αίθουσα Χειροτεχνίας', icon: '🎨', capacity: 25 },
    { name: 'Αμφιθέατρο', icon: '🎭', capacity: 100 },
    { name: 'Τραπεζαρία', icon: '🍽️', capacity: 150 },
    { name: 'Γυμναστήριο', icon: '💪', capacity: 30 },
  ],
  staff: [
    { role: 'instructor', label: 'Εκπαιδευτής' },
    { role: 'counselor', label: 'Συνοδός' },
    { role: 'coordinator', label: 'Συντονιστής' },
    { role: 'support', label: 'Βοηθητικό' },
  ],
};

const TYPE_CONFIG: Record<CreateType, { title: string; icon: string; color: string }> = {
  group: { title: 'Νέα Ομάδα', icon: '👥', color: 'purple' },
  activity: { title: 'Νέα Δραστηριότητα', icon: '🎯', color: 'orange' },
  staff: { title: 'Νέο Μέλος Προσωπικού', icon: '👤', color: 'green' },
  facility: { title: 'Νέα Εγκατάσταση', icon: '🏟️', color: 'cyan' },
  session: { title: 'Νέα Περίοδος', icon: '📅', color: 'blue' },
};

export function QuickCreateModal({
  type,
  onClose,
  onSuccess,
  defaultSessionId,
}: QuickCreateModalProps) {
  const { currentOrganization } = useOrganizations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [selectedSession, setSelectedSession] = useState(defaultSessionId || '');
  const [duration, setDuration] = useState('45');
  const [capacity, setCapacity] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('instructor');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isIndoor, setIsIndoor] = useState(false);
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  const supabase = createClient();

  // Load sessions for group creation
  useEffect(() => {
    if (type === 'group' && currentOrganization) {
      loadSessions();
    }
  }, [type, currentOrganization]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .is('deleted_at', null)
      .neq('status', 'cancelled')
      .order('start_date', { ascending: false });

    setSessions(data || []);
    if (data && data.length === 1 && !selectedSession) {
      setSelectedSession(data[0].id);
    }
  };

  // Reset form when type changes
  useEffect(() => {
    setName('');
    setError(null);
    setShowAdvanced(false);
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization || !type) return;

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (type) {
        case 'group':
          if (!selectedSession) throw new Error('Επίλεξε περίοδο');
          if (!name.trim()) throw new Error('Το όνομα είναι υποχρεωτικό');

          result = await supabase.from('groups').insert({
            session_id: selectedSession,
            name: name.trim(),
            color,
            age_min: ageMin ? parseInt(ageMin) : null,
            age_max: ageMax ? parseInt(ageMax) : null,
            capacity: capacity ? parseInt(capacity) : null,
            is_active: true,
          }).select().single();
          break;

        case 'activity':
          if (!name.trim()) throw new Error('Το όνομα είναι υποχρεωτικό');

          result = await supabase.from('activities').insert({
            organization_id: currentOrganization.id,
            name: name.trim(),
            color,
            duration_minutes: parseInt(duration) || 45,
            is_active: true,
          }).select().single();
          break;

        case 'facility':
          if (!name.trim()) throw new Error('Το όνομα είναι υποχρεωτικό');

          result = await supabase.from('facilities').insert({
            organization_id: currentOrganization.id,
            name: name.trim(),
            capacity: capacity ? parseInt(capacity) : null,
            is_indoor: isIndoor,
            is_active: true,
          }).select().single();
          break;

        case 'staff':
          if (!firstName.trim() || !lastName.trim()) {
            throw new Error('Το όνομα και επώνυμο είναι υποχρεωτικά');
          }

          result = await supabase.from('staff').insert({
            organization_id: currentOrganization.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role,
            is_active: true,
          }).select().single();
          break;

        case 'session':
          if (!name.trim()) throw new Error('Το όνομα είναι υποχρεωτικό');
          if (!startDate || !endDate) throw new Error('Οι ημερομηνίες είναι υποχρεωτικές');

          result = await supabase.from('sessions').insert({
            organization_id: currentOrganization.id,
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            status: 'draft',
          }).select().single();
          break;
      }

      if (result?.error) throw result.error;

      // Show success toast
      switch (type) {
        case 'group':
          entityToast.group.created();
          break;
        case 'activity':
          entityToast.activity.created();
          break;
        case 'facility':
          entityToast.facility.created();
          break;
        case 'staff':
          entityToast.staff.created();
          break;
        case 'session':
          entityToast.session.created();
          break;
      }

      onSuccess?.(type, result?.data);
      onClose();
    } catch (err: any) {
      setError(parseDbError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: any) => {
    setName(preset.name || '');
    if (preset.duration) setDuration(preset.duration.toString());
    if (preset.capacity) setCapacity(preset.capacity.toString());
    if (preset.role) setRole(preset.role);
  };

  if (!type) return null;

  const config = TYPE_CONFIG[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={cn(
          'px-6 py-4 border-b',
          config.color === 'purple' && 'bg-purple-50 border-purple-100',
          config.color === 'orange' && 'bg-orange-50 border-orange-100',
          config.color === 'green' && 'bg-green-50 border-green-100',
          config.color === 'cyan' && 'bg-cyan-50 border-cyan-100',
          config.color === 'blue' && 'bg-blue-50 border-blue-100',
        )}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-500">Γρήγορη δημιουργία - μόνο τα απαραίτητα</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Presets */}
          {type !== 'session' && type !== 'staff' && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Γρήγορη Επιλογή
              </p>
              <div className="flex flex-wrap gap-2">
                {(PRESETS[type] || []).slice(0, 6).map((preset: any, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border-2 transition-all',
                      name === preset.name
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {preset.icon && <span className="mr-1">{preset.icon}</span>}
                    {preset.name || preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staff Roles */}
          {type === 'staff' && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Ρόλος
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.staff.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => setRole(preset.role)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border-2 transition-all',
                      role === preset.role
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Session selector for groups */}
          {type === 'group' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Περίοδος *
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Επίλεξε...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {sessions.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Δημιούργησε πρώτα μια περίοδο
                </p>
              )}
            </div>
          )}

          {/* Name field - not for staff */}
          {type !== 'staff' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Όνομα *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'group' ? 'π.χ. Αετοί' :
                  type === 'activity' ? 'π.χ. Κολύμβηση' :
                  type === 'facility' ? 'π.χ. Πισίνα' :
                  'π.χ. Καλοκαίρι 2025'
                }
                autoFocus
                required
              />
            </div>
          )}

          {/* Staff name fields */}
          {type === 'staff' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Όνομα *
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="π.χ. Γιάννης"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Επώνυμο *
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="π.χ. Παπαδόπουλος"
                  required
                />
              </div>
            </div>
          )}

          {/* Session dates */}
          {type === 'session' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Έναρξη *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Λήξη *
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
              </div>
            </div>
          )}

          {/* Color picker - for group, activity, facility */}
          {(type === 'group' || type === 'activity') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Χρώμα
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-transform',
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Duration for activity */}
          {type === 'activity' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Διάρκεια (λεπτά)
              </label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d.toString())}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm border-2 transition-all',
                      duration === d.toString()
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {d}΄
                  </button>
                ))}
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20"
                  min="5"
                  max="480"
                />
              </div>
            </div>
          )}

          {/* Capacity for facility */}
          {type === 'facility' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Χωρητικότητα
              </label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="π.χ. 30"
                min="1"
              />
            </div>
          )}

          {/* Indoor/Outdoor toggle */}
          {type === 'facility' && (
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  isIndoor ? 'bg-cyan-500' : 'bg-gray-300'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    isIndoor ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </div>
                <span className="text-sm text-gray-700">
                  {isIndoor ? '🏠 Εσωτερικός χώρος' : '🌳 Εξωτερικός χώρος'}
                </span>
              </label>
            </div>
          )}

          {/* Advanced toggle */}
          {(type === 'group' || type === 'activity') && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
            >
              <svg
                className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-90')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showAdvanced ? 'Κρύψε επιπλέον πεδία' : 'Περισσότερες επιλογές'}
            </button>
          )}

          {/* Advanced fields */}
          {showAdvanced && type === 'group' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ελάχ. Ηλικία
                  </label>
                  <Input
                    type="number"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    placeholder="π.χ. 8"
                    min="1"
                    max="99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Μέγ. Ηλικία
                  </label>
                  <Input
                    type="number"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    placeholder="π.χ. 12"
                    min="1"
                    max="99"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Χωρητικότητα
                </label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="π.χ. 20"
                  min="1"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ακύρωση
          </button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (type === 'group' && !selectedSession)}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Δημιουργία...
              </span>
            ) : (
              `Δημιουργία ${config.title.replace('Νέα ', '').replace('Νέο ', '').replace('Νέος ', '')}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
