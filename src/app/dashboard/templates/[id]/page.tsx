'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateSlot = Database['public']['Tables']['day_template_slots']['Row'];
type SlotType = Database['public']['Enums']['slot_type'];

const SLOT_TYPES: { value: SlotType; label: string; color: string }[] = [
  { value: 'activity', label: 'Δραστηριότητα', color: 'bg-blue-500' },
  { value: 'meal', label: 'Γεύμα', color: 'bg-orange-500' },
  { value: 'break', label: 'Διάλειμμα', color: 'bg-green-500' },
  { value: 'rest', label: 'Ξεκούραση', color: 'bg-purple-500' },
  { value: 'free', label: 'Ελεύθερος Χρόνος', color: 'bg-gray-500' },
  { value: 'assembly', label: 'Συγκέντρωση', color: 'bg-yellow-500' },
  { value: 'transition', label: 'Μετάβαση', color: 'bg-pink-500' },
];

const SLOT_TYPE_COLORS: Record<string, string> = {
  activity: 'bg-blue-100 border-blue-300 text-blue-800',
  meal: 'bg-orange-100 border-orange-300 text-orange-800',
  break: 'bg-green-100 border-green-300 text-green-800',
  rest: 'bg-purple-100 border-purple-300 text-purple-800',
  free: 'bg-gray-100 border-gray-300 text-gray-800',
  assembly: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  transition: 'bg-pink-100 border-pink-300 text-pink-800',
};

interface NewSlot {
  name: string;
  start_time: string;
  end_time: string;
  slot_type: SlotType;
  is_schedulable: boolean;
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();

  const [template, setTemplate] = useState<DayTemplate | null>(null);
  const [slots, setSlots] = useState<DayTemplateSlot[]>([]);
  const [editing, setEditing] = useState(false);

  // Template fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // New slot form
  const [showNewSlotForm, setShowNewSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState<NewSlot>({
    name: '',
    start_time: '09:00',
    end_time: '10:00',
    slot_type: 'activity',
    is_schedulable: true,
  });
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadTemplate();
    }
  }, [id, currentOrganization?.id]);

  const loadTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('day_templates')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      if (data.organization_id !== currentOrganization?.id) {
        throw new Error('Δεν έχεις πρόσβαση σε αυτό το πρότυπο');
      }

      setTemplate(data);
      setName(data.name);
      setDescription(data.description || '');
      setIsDefault(data.is_default);
      setIsActive(data.is_active);

      // Load slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('day_template_slots')
        .select('*')
        .eq('day_template_id', id)
        .order('sort_order', { ascending: true });

      if (slotsError) throw slotsError;

      setSlots(slotsData || []);
    } catch (error: any) {
      console.error('Error loading template:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!template || !name.trim()) {
      setError('Το όνομα είναι υποχρεωτικό.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // If setting as default, unset other defaults first
      if (isDefault && !template.is_default && currentOrganization?.id) {
        await supabase
          .from('day_templates')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true);
      }

      const { error } = await supabase
        .from('day_templates')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_default: isDefault,
          is_active: isActive,
          total_activity_slots: slots.filter(s => s.slot_type === 'activity' && s.is_schedulable).length,
        })
        .eq('id', id);

      if (error) throw error;

      setTemplate({
        ...template,
        name: name.trim(),
        description: description.trim() || null,
        is_default: isDefault,
        is_active: isActive,
      });
      setEditing(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.start_time || !newSlot.end_time) {
      setError('Οι ώρες είναι υποχρεωτικές.');
      return;
    }

    if (newSlot.start_time >= newSlot.end_time) {
      setError('Η ώρα έναρξης πρέπει να είναι πριν την ώρα λήξης.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const maxOrder = slots.length > 0 ? Math.max(...slots.map(s => s.sort_order)) : -1;

      const { data, error } = await supabase
        .from('day_template_slots')
        .insert({
          day_template_id: id,
          name: newSlot.name.trim() || null,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          slot_type: newSlot.slot_type,
          is_schedulable: newSlot.is_schedulable,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setSlots([...slots, data]);
      setNewSlot({
        name: '',
        start_time: newSlot.end_time,
        end_time: addMinutes(newSlot.end_time, 60),
        slot_type: 'activity',
        is_schedulable: true,
      });
      setShowNewSlotForm(false);

      // Update activity slots count
      await updateActivityCount();
    } catch (error: any) {
      console.error('Error adding slot:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlot = async (slotId: string, updates: Partial<DayTemplateSlot>) => {
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('day_template_slots')
        .update(updates)
        .eq('id', slotId);

      if (error) throw error;

      setSlots(slots.map(s => s.id === slotId ? { ...s, ...updates } : s));
      setEditingSlotId(null);

      // Update activity slots count if slot_type or is_schedulable changed
      if ('slot_type' in updates || 'is_schedulable' in updates) {
        await updateActivityCount();
      }
    } catch (error: any) {
      console.error('Error updating slot:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Διαγραφή αυτής της χρονοθυρίδας;')) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('day_template_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      setSlots(slots.filter(s => s.id !== slotId));
      await updateActivityCount();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Διαγραφή αυτού του προτύπου; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('day_templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      router.push('/dashboard/templates');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      setError(error.message);
      setSaving(false);
    }
  };

  const updateActivityCount = async () => {
    const count = slots.filter(s => s.slot_type === 'activity' && s.is_schedulable).length;
    await supabase
      .from('day_templates')
      .update({ total_activity_slots: count })
      .eq('id', id);
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const getDurationMinutes = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const moveSlot = async (slotId: string, direction: 'up' | 'down') => {
    const idx = slots.findIndex(s => s.id === slotId);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === slots.length - 1)
    ) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newSlots = [...slots];
    [newSlots[idx], newSlots[newIdx]] = [newSlots[newIdx], newSlots[idx]];

    // Update sort_order
    const updates = newSlots.map((s, i) => ({ id: s.id, sort_order: i }));

    try {
      for (const u of updates) {
        await supabase
          .from('day_template_slots')
          .update({ sort_order: u.sort_order })
          .eq('id', u.id);
      }
      setSlots(newSlots.map((s, i) => ({ ...s, sort_order: i })));
    } catch (error: any) {
      console.error('Error reordering slots:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Το πρότυπο δεν βρέθηκε.
        </div>
      </div>
    );
  }

  const sortedSlots = [...slots].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/templates" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στα Πρότυπα
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Template Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{template.name}</CardTitle>
              {template.description && (
                <CardDescription className="mt-1">{template.description}</CardDescription>
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
          {editing ? (
            <div className="space-y-4">
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
                  disabled={saving}
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={saving}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Προεπιλογή</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={saving}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Ενεργό</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveTemplate} disabled={saving}>
                  {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Ακύρωση
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                Επεξεργασία
              </Button>
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Χρονοδιάγραμμα</CardTitle>
          <CardDescription>
            Οπτική αναπαράσταση της ημέρας
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν χρονοθυρίδες. Πρόσθεσε την πρώτη παρακάτω.
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSlots.map((slot, idx) => {
                const duration = getDurationMinutes(slot.start_time, slot.end_time);
                const height = Math.max(40, Math.min(120, duration * 0.8));

                return (
                  <div
                    key={slot.id}
                    className={`relative flex items-center rounded-lg border-2 px-4 transition-all ${
                      SLOT_TYPE_COLORS[slot.slot_type] || 'bg-gray-100 border-gray-300'
                    } ${editingSlotId === slot.id ? 'ring-2 ring-primary-500' : ''}`}
                    style={{ minHeight: `${height}px` }}
                  >
                    {/* Time */}
                    <div className="w-24 flex-shrink-0 font-mono text-sm">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-4">
                      <div className="font-medium">
                        {slot.name || SLOT_TYPES.find(t => t.value === slot.slot_type)?.label}
                      </div>
                      <div className="text-sm opacity-75">
                        {duration} λεπτά
                        {slot.slot_type === 'activity' && slot.is_schedulable && (
                          <span className="ml-2 text-xs">(προγραμματιζόμενη)</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSlot(slot.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                        title="Μετακίνηση πάνω"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveSlot(slot.id, 'down')}
                        disabled={idx === sortedSlots.length - 1}
                        className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                        title="Μετακίνηση κάτω"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingSlotId(editingSlotId === slot.id ? null : slot.id)}
                        className="p-1 hover:bg-white/50 rounded"
                        title="Επεξεργασία"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1 hover:bg-white/50 rounded text-red-600"
                        title="Διαγραφή"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Slot Form */}
      {editingSlotId && (
        <Card className="mb-6 border-primary-200">
          <CardHeader>
            <CardTitle className="text-lg">Επεξεργασία Χρονοθυρίδας</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const slot = slots.find(s => s.id === editingSlotId);
              if (!slot) return null;

              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Όνομα</label>
                    <Input
                      value={slot.name || ''}
                      onChange={(e) => handleUpdateSlot(slot.id, { name: e.target.value || null })}
                      placeholder="Προαιρετικό όνομα"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Τύπος</label>
                    <select
                      value={slot.slot_type}
                      onChange={(e) => handleUpdateSlot(slot.id, { slot_type: e.target.value as SlotType })}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {SLOT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ώρα Έναρξης</label>
                    <Input
                      type="time"
                      value={slot.start_time.slice(0, 5)}
                      onChange={(e) => handleUpdateSlot(slot.id, { start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ώρα Λήξης</label>
                    <Input
                      type="time"
                      value={slot.end_time.slice(0, 5)}
                      onChange={(e) => handleUpdateSlot(slot.id, { end_time: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.is_schedulable}
                        onChange={(e) => handleUpdateSlot(slot.id, { is_schedulable: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Προγραμματιζόμενη (δραστηριότητες μπορούν να οριστούν)
                      </span>
                    </label>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Add Slot */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Χρονοθυρίδες</CardTitle>
              <CardDescription>
                {slots.length} χρονοθυρίδες · {slots.filter(s => s.slot_type === 'activity' && s.is_schedulable).length} δραστηριότητες
              </CardDescription>
            </div>
            <Button onClick={() => setShowNewSlotForm(!showNewSlotForm)}>
              {showNewSlotForm ? 'Ακύρωση' : 'Προσθήκη Slot'}
            </Button>
          </div>
        </CardHeader>
        {showNewSlotForm && (
          <CardContent className="border-t">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Όνομα</label>
                <Input
                  value={newSlot.name}
                  onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                  placeholder="π.χ. Πρωινό, Δραστηριότητα 1"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Τύπος</label>
                <select
                  value={newSlot.slot_type}
                  onChange={(e) => setNewSlot({ ...newSlot, slot_type: e.target.value as SlotType })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {SLOT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ώρα Έναρξης</label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ώρα Λήξης</label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSlot.is_schedulable}
                    onChange={(e) => setNewSlot({ ...newSlot, is_schedulable: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Προγραμματιζόμενη</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSlot} disabled={saving}>
                  {saving ? 'Προσθήκη...' : 'Προσθήκη'}
                </Button>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">Γρήγορη Προσθήκη:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Πρωινό', type: 'meal' as SlotType, duration: 30 },
                  { name: 'Μεσημεριανό', type: 'meal' as SlotType, duration: 45 },
                  { name: 'Βραδινό', type: 'meal' as SlotType, duration: 45 },
                  { name: 'Δραστηριότητα', type: 'activity' as SlotType, duration: 60 },
                  { name: 'Διάλειμμα', type: 'break' as SlotType, duration: 15 },
                  { name: 'Ξεκούραση', type: 'rest' as SlotType, duration: 60 },
                  { name: 'Ελεύθερος χρόνος', type: 'free' as SlotType, duration: 30 },
                ].map((quick) => (
                  <button
                    key={quick.name}
                    type="button"
                    onClick={() => {
                      const lastSlot = sortedSlots[sortedSlots.length - 1];
                      const startTime = lastSlot ? lastSlot.end_time.slice(0, 5) : '08:00';
                      setNewSlot({
                        name: quick.name,
                        slot_type: quick.type,
                        start_time: startTime,
                        end_time: addMinutes(startTime, quick.duration),
                        is_schedulable: quick.type === 'activity',
                      });
                    }}
                    className={`rounded-full px-3 py-1 text-sm font-medium border ${
                      SLOT_TYPE_COLORS[quick.type]
                    }`}
                  >
                    + {quick.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
