'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Άνοιγμα αναζήτησης', category: 'Πλοήγηση' },
  { keys: ['G', 'H'], description: 'Μετάβαση στην Αρχική', category: 'Πλοήγηση' },
  { keys: ['G', 'S'], description: 'Μετάβαση στο Πρόγραμμα', category: 'Πλοήγηση' },
  { keys: ['?'], description: 'Εμφάνιση συντομεύσεων', category: 'Πλοήγηση' },

  // Creation
  { keys: ['+'], description: 'Γρήγορη δημιουργία', category: 'Δημιουργία' },
  { keys: ['⌘', 'N'], description: 'Νέο στοιχείο (εναλλακτικό)', category: 'Δημιουργία' },
  { keys: ['G'], description: 'Νέα ομάδα (στο μενού +)', category: 'Δημιουργία' },
  { keys: ['A'], description: 'Νέα δραστηριότητα (στο μενού +)', category: 'Δημιουργία' },
  { keys: ['S'], description: 'Νέο προσωπικό (στο μενού +)', category: 'Δημιουργία' },
  { keys: ['F'], description: 'Νέα εγκατάσταση (στο μενού +)', category: 'Δημιουργία' },
  { keys: ['P'], description: 'Νέα περίοδος (στο μενού +)', category: 'Δημιουργία' },

  // Actions
  { keys: ['Esc'], description: 'Κλείσιμο modal/μενού', category: 'Γενικά' },
  { keys: ['↑', '↓'], description: 'Πλοήγηση σε λίστα', category: 'Γενικά' },
  { keys: ['Enter'], description: 'Επιλογή/Επιβεβαίωση', category: 'Γενικά' },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // "?" key to open shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  // Group shortcuts by category
  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-100"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⌨️</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Συντομεύσεις Πληκτρολογίου</h2>
                <p className="text-sm text-gray-500">Χρησιμοποίησε το πληκτρολόγιο για ταχύτερη πλοήγηση</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center">
                              <kbd className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-200">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Πάτα <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">?</kbd> για να δεις τις συντομεύσεις οποιαδήποτε στιγμή
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
