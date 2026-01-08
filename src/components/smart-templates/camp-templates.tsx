'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'activities' | 'facilities' | 'groups' | 'full';
  items: any[];
  color: string;
}

const ACTIVITY_TEMPLATES: Template[] = [
  {
    id: 'sports',
    name: 'Αθλητικές Δραστηριότητες',
    description: 'Ποδόσφαιρο, Μπάσκετ, Βόλεϊ, Κολύμβηση και άλλα αθλήματα',
    icon: '⚽',
    type: 'activities',
    color: 'bg-green-500',
    items: [
      { name: 'Ποδόσφαιρο', color: '#22C55E', duration_minutes: 60 },
      { name: 'Μπάσκετ', color: '#F97316', duration_minutes: 45 },
      { name: 'Βόλεϊ', color: '#3B82F6', duration_minutes: 45 },
      { name: 'Κολύμβηση', color: '#06B6D4', duration_minutes: 45 },
      { name: 'Στίβος', color: '#EAB308', duration_minutes: 60 },
      { name: 'Τένις', color: '#84CC16', duration_minutes: 45 },
    ],
  },
  {
    id: 'creative',
    name: 'Δημιουργικές Δραστηριότητες',
    description: 'Χειροτεχνία, Ζωγραφική, Θέατρο, Μουσική',
    icon: '🎨',
    type: 'activities',
    color: 'bg-purple-500',
    items: [
      { name: 'Χειροτεχνία', color: '#A855F7', duration_minutes: 60 },
      { name: 'Ζωγραφική', color: '#EC4899', duration_minutes: 45 },
      { name: 'Θέατρο', color: '#8B5CF6', duration_minutes: 60 },
      { name: 'Μουσική', color: '#D946EF', duration_minutes: 45 },
      { name: 'Χορός', color: '#F472B6', duration_minutes: 45 },
      { name: 'Κεραμική', color: '#C084FC', duration_minutes: 60 },
    ],
  },
  {
    id: 'adventure',
    name: 'Δραστηριότητες Περιπέτειας',
    description: 'Πεζοπορία, Αναρρίχηση, Κανό, Προσανατολισμός',
    icon: '🏕️',
    type: 'activities',
    color: 'bg-amber-500',
    items: [
      { name: 'Πεζοπορία', color: '#D97706', duration_minutes: 120 },
      { name: 'Αναρρίχηση', color: '#78716C', duration_minutes: 60 },
      { name: 'Κανό/Καγιάκ', color: '#0EA5E9', duration_minutes: 60 },
      { name: 'Προσανατολισμός', color: '#65A30D', duration_minutes: 90 },
      { name: 'Τοξοβολία', color: '#B45309', duration_minutes: 45 },
      { name: 'Ιππασία', color: '#92400E', duration_minutes: 60 },
    ],
  },
  {
    id: 'education',
    name: 'Εκπαιδευτικές Δραστηριότητες',
    description: 'Περιβάλλον, Επιστήμη, Ξένες Γλώσσες',
    icon: '📚',
    type: 'activities',
    color: 'bg-blue-500',
    items: [
      { name: 'Περιβαλλοντικά', color: '#16A34A', duration_minutes: 45 },
      { name: 'Πειράματα Επιστήμης', color: '#7C3AED', duration_minutes: 60 },
      { name: 'Αγγλικά Παίζοντας', color: '#DC2626', duration_minutes: 45 },
      { name: 'Αστρονομία', color: '#1E3A8A', duration_minutes: 60 },
      { name: 'Φυτά & Κήπος', color: '#15803D', duration_minutes: 45 },
      { name: 'Ανακύκλωση', color: '#059669', duration_minutes: 30 },
    ],
  },
];

const FACILITY_TEMPLATES: Template[] = [
  {
    id: 'standard',
    name: 'Βασικές Εγκαταστάσεις',
    description: 'Οι απαραίτητες εγκαταστάσεις για κάθε κατασκήνωση',
    icon: '🏟️',
    type: 'facilities',
    color: 'bg-cyan-500',
    items: [
      { name: 'Πισίνα', capacity: 30, is_indoor: false },
      { name: 'Γήπεδο Ποδοσφαίρου', capacity: 40, is_indoor: false },
      { name: 'Γήπεδο Μπάσκετ', capacity: 20, is_indoor: false },
      { name: 'Αίθουσα Χειροτεχνίας', capacity: 25, is_indoor: true },
      { name: 'Αμφιθέατρο', capacity: 100, is_indoor: false },
      { name: 'Τραπεζαρία', capacity: 150, is_indoor: true },
      { name: 'Αίθουσα Πολλαπλών Χρήσεων', capacity: 50, is_indoor: true },
    ],
  },
  {
    id: 'premium',
    name: 'Πλήρεις Εγκαταστάσεις',
    description: 'Εκτεταμένη λίστα με όλες τις δυνατές εγκαταστάσεις',
    icon: '🏰',
    type: 'facilities',
    color: 'bg-indigo-500',
    items: [
      { name: 'Πισίνα', capacity: 30, is_indoor: false },
      { name: 'Γήπεδο Ποδοσφαίρου', capacity: 40, is_indoor: false },
      { name: 'Γήπεδο Μπάσκετ', capacity: 20, is_indoor: false },
      { name: 'Γήπεδο Βόλεϊ', capacity: 16, is_indoor: false },
      { name: 'Γήπεδο Τένις', capacity: 4, is_indoor: false },
      { name: 'Αίθουσα Χειροτεχνίας', capacity: 25, is_indoor: true },
      { name: 'Αίθουσα Μουσικής', capacity: 20, is_indoor: true },
      { name: 'Θεατρική Σκηνή', capacity: 15, is_indoor: false },
      { name: 'Αμφιθέατρο', capacity: 100, is_indoor: false },
      { name: 'Τραπεζαρία', capacity: 150, is_indoor: true },
      { name: 'Γυμναστήριο', capacity: 30, is_indoor: true },
      { name: 'Αναρριχητικός Τοίχος', capacity: 10, is_indoor: false },
      { name: 'Στίβος', capacity: 50, is_indoor: false },
      { name: 'Αποβάθρα/Λίμνη', capacity: 20, is_indoor: false },
    ],
  },
];

const GROUP_TEMPLATES: Template[] = [
  {
    id: 'age-based',
    name: 'Ομάδες κατά Ηλικία',
    description: '4 ομάδες βάσει ηλικιακής κατηγορίας',
    icon: '👥',
    type: 'groups',
    color: 'bg-purple-500',
    items: [
      { name: 'Αστεράκια', color: '#F59E0B', age_min: 6, age_max: 8, capacity: 15 },
      { name: 'Δελφινάκια', color: '#06B6D4', age_min: 9, age_max: 10, capacity: 18 },
      { name: 'Αετοί', color: '#8B5CF6', age_min: 11, age_max: 12, capacity: 20 },
      { name: 'Λιοντάρια', color: '#EF4444', age_min: 13, age_max: 15, capacity: 20 },
    ],
  },
  {
    id: 'animals',
    name: 'Ομάδες με Ζώα',
    description: '6 ομάδες με ονόματα ζώων',
    icon: '🦁',
    type: 'groups',
    color: 'bg-orange-500',
    items: [
      { name: 'Λιοντάρια', color: '#F97316', capacity: 20 },
      { name: 'Τίγρεις', color: '#EAB308', capacity: 20 },
      { name: 'Αετοί', color: '#3B82F6', capacity: 20 },
      { name: 'Δελφίνια', color: '#06B6D4', capacity: 20 },
      { name: 'Πάνθηρες', color: '#8B5CF6', capacity: 20 },
      { name: 'Αρκούδες', color: '#78716C', capacity: 20 },
    ],
  },
  {
    id: 'colors',
    name: 'Ομάδες με Χρώματα',
    description: '4 ομάδες με ονόματα χρωμάτων',
    icon: '🌈',
    type: 'groups',
    color: 'bg-pink-500',
    items: [
      { name: 'Κόκκινοι', color: '#EF4444', capacity: 20 },
      { name: 'Μπλε', color: '#3B82F6', capacity: 20 },
      { name: 'Πράσινοι', color: '#22C55E', capacity: 20 },
      { name: 'Κίτρινοι', color: '#EAB308', capacity: 20 },
    ],
  },
];

interface CampTemplatesProps {
  sessionId?: string;
  onSuccess?: () => void;
}

export function CampTemplates({ sessionId, onSuccess }: CampTemplatesProps) {
  const { currentOrganization } = useOrganizations();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'activities' | 'facilities' | 'groups'>('activities');

  const supabase = createClient();

  const templates = {
    activities: ACTIVITY_TEMPLATES,
    facilities: FACILITY_TEMPLATES,
    groups: GROUP_TEMPLATES,
  };

  const handleApplyTemplate = async (template: Template) => {
    if (!currentOrganization) return;

    setLoading(template.id);
    setError(null);
    setSuccess(null);

    try {
      if (template.type === 'activities') {
        const activities = template.items.map((item) => ({
          organization_id: currentOrganization.id,
          ...item,
          is_active: true,
        }));
        const { error } = await supabase.from('activities').insert(activities);
        if (error) throw error;
      } else if (template.type === 'facilities') {
        const facilities = template.items.map((item) => ({
          organization_id: currentOrganization.id,
          ...item,
          is_active: true,
        }));
        const { error } = await supabase.from('facilities').insert(facilities);
        if (error) throw error;
      } else if (template.type === 'groups') {
        if (!sessionId) {
          throw new Error('Επίλεξε πρώτα μια περίοδο για να προσθέσεις ομάδες');
        }
        const groups = template.items.map((item) => ({
          session_id: sessionId,
          ...item,
          is_active: true,
        }));
        const { error } = await supabase.from('groups').insert(groups);
        if (error) throw error;
      }

      setSuccess(template.id);
      onSuccess?.();

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const categories = [
    { id: 'activities', label: 'Δραστηριότητες', icon: '🎯', count: ACTIVITY_TEMPLATES.length },
    { id: 'facilities', label: 'Εγκαταστάσεις', icon: '🏟️', count: FACILITY_TEMPLATES.length },
    { id: 'groups', label: 'Ομάδες', icon: '👥', count: GROUP_TEMPLATES.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              selectedCategory === cat.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className="px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Groups warning if no session */}
      {selectedCategory === 'groups' && !sessionId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Για να προσθέσεις ομάδες, πρέπει πρώτα να επιλέξεις ή να δημιουργήσεις μια περίοδο.
        </div>
      )}

      {/* Template Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {templates[selectedCategory].map((template) => (
          <div
            key={template.id}
            className={cn(
              'relative p-5 rounded-xl border-2 transition-all',
              success === template.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white',
                  template.color
                )}
              >
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </div>

            {/* Items preview */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {template.items.slice(0, 5).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {item.name}
                </span>
              ))}
              {template.items.length > 5 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                  +{template.items.length - 5}
                </span>
              )}
            </div>

            {/* Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {template.items.length} στοιχεία
              </span>
              <Button
                size="sm"
                onClick={() => handleApplyTemplate(template)}
                disabled={
                  loading === template.id ||
                  success === template.id ||
                  (template.type === 'groups' && !sessionId)
                }
              >
                {loading === template.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Προσθήκη...
                  </span>
                ) : success === template.id ? (
                  <span className="flex items-center gap-1 text-green-600">
                    ✓ Προστέθηκαν!
                  </span>
                ) : (
                  'Προσθήκη Όλων'
                )}
              </Button>
            </div>

            {/* Success overlay */}
            {success === template.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-50/80 rounded-xl">
                <div className="text-center">
                  <span className="text-4xl">✅</span>
                  <p className="text-green-700 font-medium mt-2">
                    {template.items.length} στοιχεία προστέθηκαν!
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Συμβουλή:</strong> Μπορείς να εφαρμόσεις πολλά πρότυπα για να
              δημιουργήσεις γρήγορα μια πλήρη βιβλιοθήκη. Τα στοιχεία που θα προστεθούν
              μπορείς να τα επεξεργαστείς αργότερα.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
