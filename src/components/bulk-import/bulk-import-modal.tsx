'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImportType = 'activities' | 'facilities' | 'staff' | 'groups';

interface BulkImportModalProps {
  type: ImportType;
  sessionId?: string;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

const TYPE_CONFIG: Record<ImportType, {
  title: string;
  icon: string;
  placeholder: string;
  examples: string[];
  fields: string[];
}> = {
  activities: {
    title: 'Δραστηριότητες',
    icon: '🎯',
    placeholder: 'Κολύμβηση\nΠοδόσφαιρο\nΧειροτεχνία\nΜουσική',
    examples: ['Κολύμβηση', 'Ποδόσφαιρο', 'Χειροτεχνία', 'Μουσική', 'Θέατρο'],
    fields: ['Όνομα'],
  },
  facilities: {
    title: 'Εγκαταστάσεις',
    icon: '🏟️',
    placeholder: 'Πισίνα\nΓήπεδο Ποδοσφαίρου\nΑίθουσα Χειροτεχνίας',
    examples: ['Πισίνα', 'Γήπεδο', 'Αίθουσα', 'Αμφιθέατρο'],
    fields: ['Όνομα'],
  },
  staff: {
    title: 'Προσωπικό',
    icon: '👤',
    placeholder: 'Γιάννης Παπαδόπουλος\nΜαρία Αντωνίου\nΝίκος Γεωργίου',
    examples: ['Γιάννης Παπαδόπουλος', 'Μαρία Αντωνίου'],
    fields: ['Όνομα Επώνυμο'],
  },
  groups: {
    title: 'Ομάδες',
    icon: '👥',
    placeholder: 'Αετοί\nΛιοντάρια\nΔελφίνια\nΑστέρια',
    examples: ['Αετοί', 'Λιοντάρια', 'Δελφίνια', 'Αστέρια'],
    fields: ['Όνομα'],
  },
};

export function BulkImportModal({
  type,
  sessionId,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const { currentOrganization } = useOrganizations();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);

  const config = TYPE_CONFIG[type];
  const supabase = createClient();

  // Parse text into items
  const parseText = useCallback((input: string) => {
    const lines = input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setPreview(lines);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    parseText(e.target.value);
  };

  const handleImport = async () => {
    if (!currentOrganization || preview.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let insertData: any[] = [];

      switch (type) {
        case 'activities':
          insertData = preview.map((name, idx) => ({
            organization_id: currentOrganization.id,
            name,
            color: COLORS[idx % COLORS.length],
            duration_minutes: 45,
            is_active: true,
          }));
          break;

        case 'facilities':
          insertData = preview.map((name) => ({
            organization_id: currentOrganization.id,
            name,
            is_active: true,
          }));
          break;

        case 'staff':
          insertData = preview.map((fullName) => {
            const parts = fullName.split(' ');
            const firstName = parts[0] || fullName;
            const lastName = parts.slice(1).join(' ') || '';
            return {
              organization_id: currentOrganization.id,
              first_name: firstName,
              last_name: lastName,
              role: 'instructor',
              is_active: true,
            };
          });
          break;

        case 'groups':
          if (!sessionId) {
            throw new Error('Επίλεξε πρώτα μια περίοδο');
          }
          insertData = preview.map((name, idx) => ({
            session_id: sessionId,
            name,
            color: COLORS[idx % COLORS.length],
            is_active: true,
          }));
          break;
      }

      const tableName = type === 'activities' ? 'activities' :
                       type === 'facilities' ? 'facilities' :
                       type === 'staff' ? 'staff' : 'groups';

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(insertData);

      if (insertError) throw insertError;

      onSuccess?.(preview.length);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = () => {
    const examples = config.examples.join('\n');
    setText(examples);
    parseText(examples);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Μαζική Εισαγωγή - {config.title}
              </h2>
              <p className="text-sm text-gray-500">
                Προσθέστε πολλά στοιχεία ταυτόχρονα
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid md:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
          {/* Input area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Εισαγωγή (μια γραμμή ανά στοιχείο)
              </label>
              <button
                onClick={handleQuickAdd}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Προσθήκη παραδειγμάτων
              </button>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={config.placeholder}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Τοποθετήστε κάθε {config.fields[0].toLowerCase()} σε ξεχωριστή γραμμή
            </p>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Προεπισκόπηση
              </label>
              <span className="text-xs text-gray-500">
                {preview.length} στοιχεία
              </span>
            </div>
            <div className="h-64 p-4 bg-gray-50 border border-gray-200 rounded-xl overflow-y-auto">
              {preview.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Τα στοιχεία θα εμφανιστούν εδώ
                </div>
              ) : (
                <div className="space-y-2">
                  {preview.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                    >
                      {(type === 'activities' || type === 'groups') && (
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      )}
                      {type === 'staff' && (
                        <span className="text-gray-400">👤</span>
                      )}
                      {type === 'facilities' && (
                        <span className="text-gray-400">🏟️</span>
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Import options */}
            {preview.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  {type === 'activities' && 'Διάρκεια: 45 λεπτά (μπορείτε να αλλάξετε μετά)'}
                  {type === 'staff' && 'Ρόλος: Εκπαιδευτής (μπορείτε να αλλάξετε μετά)'}
                  {type === 'groups' && 'Χρώματα: Αυτόματη ανάθεση'}
                  {type === 'facilities' && 'Όλα τα πεδία μπορούν να συμπληρωθούν μετά'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ακύρωση
          </button>
          <Button
            onClick={handleImport}
            disabled={loading || preview.length === 0}
            className="min-w-[140px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Εισαγωγή...
              </span>
            ) : (
              `Εισαγωγή ${preview.length} στοιχείων`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
