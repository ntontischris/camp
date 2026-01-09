'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  href?: string;
  action?: () => void;
  shortcut?: string;
  category: string;
}

const NAVIGATION_ITEMS: CommandItem[] = [
  { id: 'dashboard', title: 'Αρχική', icon: '📊', href: '/dashboard', category: 'Πλοήγηση', shortcut: 'G H' },
  { id: 'schedule', title: 'Πρόγραμμα', icon: '📋', href: '/dashboard/schedule', category: 'Πλοήγηση', shortcut: 'G S' },
  { id: 'sessions', title: 'Περίοδοι', icon: '📅', href: '/dashboard/sessions', category: 'Πλοήγηση' },
  { id: 'groups', title: 'Ομάδες', icon: '👥', href: '/dashboard/groups', category: 'Πλοήγηση' },
  { id: 'activities', title: 'Δραστηριότητες', icon: '🎯', href: '/dashboard/activities', category: 'Πλοήγηση' },
  { id: 'facilities', title: 'Εγκαταστάσεις', icon: '🏟️', href: '/dashboard/facilities', category: 'Πλοήγηση' },
  { id: 'staff', title: 'Προσωπικό', icon: '👤', href: '/dashboard/staff', category: 'Πλοήγηση' },
  { id: 'constraints', title: 'Κανόνες', icon: '⚙️', href: '/dashboard/constraints', category: 'Πλοήγηση' },
  { id: 'templates', title: 'Πρότυπα Ημέρας', icon: '📄', href: '/dashboard/templates', category: 'Πλοήγηση' },
  { id: 'settings', title: 'Ρυθμίσεις', icon: '⚙️', href: '/dashboard/settings', category: 'Πλοήγηση' },
  { id: 'quick-setup', title: 'Γρήγορη Ρύθμιση', icon: '⚡', href: '/dashboard/quick-setup', category: 'Πλοήγηση' },
  { id: 'guide', title: 'Οδηγός', icon: '📖', href: '/dashboard/guide', category: 'Πλοήγηση' },
];

const CREATE_ITEMS: CommandItem[] = [
  { id: 'new-session', title: 'Νέα Περίοδος', subtitle: 'Δημιουργία περιόδου κατασκήνωσης', icon: '📅', href: '/dashboard/sessions/new', category: 'Δημιουργία' },
  { id: 'new-group', title: 'Νέα Ομάδα', subtitle: 'Δημιουργία ομάδας κατασκηνωτών', icon: '👥', href: '/dashboard/groups/new', category: 'Δημιουργία' },
  { id: 'new-activity', title: 'Νέα Δραστηριότητα', subtitle: 'Προσθήκη στη βιβλιοθήκη δραστηριοτήτων', icon: '🎯', href: '/dashboard/activities/new', category: 'Δημιουργία' },
  { id: 'new-facility', title: 'Νέα Εγκατάσταση', subtitle: 'Προσθήκη χώρου', icon: '🏟️', href: '/dashboard/facilities/new', category: 'Δημιουργία' },
  { id: 'new-staff', title: 'Νέο Μέλος Προσωπικού', subtitle: 'Προσθήκη προσωπικού', icon: '👤', href: '/dashboard/staff/new', category: 'Δημιουργία' },
  { id: 'new-constraint', title: 'Νέος Κανόνας', subtitle: 'Προσθήκη περιορισμού', icon: '⚙️', href: '/dashboard/constraints/new', category: 'Δημιουργία' },
  { id: 'new-template', title: 'Νέο Πρότυπο', subtitle: 'Δημιουργία πρότυπου ημέρας', icon: '📄', href: '/dashboard/templates/new', category: 'Δημιουργία' },
];

interface CommandPaletteProps {
  onOpenQuickCreate?: (type: 'group' | 'activity' | 'staff' | 'facility' | 'session') => void;
}

export function CommandPalette({ onOpenQuickCreate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    setSearch('');
    command();
  }, []);

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      runCommand(item.action);
    } else if (item.href) {
      runCommand(() => router.push(item.href!));
    }
  };

  // Create quick create actions
  const quickCreateItems: CommandItem[] = onOpenQuickCreate ? [
    { id: 'quick-group', title: 'Γρήγορη Ομάδα', subtitle: 'Δημιουργία με modal', icon: '👥', action: () => onOpenQuickCreate('group'), category: 'Γρήγορη Δημιουργία' },
    { id: 'quick-activity', title: 'Γρήγορη Δραστηριότητα', subtitle: 'Δημιουργία με modal', icon: '🎯', action: () => onOpenQuickCreate('activity'), category: 'Γρήγορη Δημιουργία' },
    { id: 'quick-staff', title: 'Γρήγορο Προσωπικό', subtitle: 'Δημιουργία με modal', icon: '👤', action: () => onOpenQuickCreate('staff'), category: 'Γρήγορη Δημιουργία' },
    { id: 'quick-facility', title: 'Γρήγορη Εγκατάσταση', subtitle: 'Δημιουργία με modal', icon: '🏟️', action: () => onOpenQuickCreate('facility'), category: 'Γρήγορη Δημιουργία' },
    { id: 'quick-session', title: 'Γρήγορη Περίοδος', subtitle: 'Δημιουργία με modal', icon: '📅', action: () => onOpenQuickCreate('session'), category: 'Γρήγορη Δημιουργία' },
  ] : [];

  const allItems = [...quickCreateItems, ...CREATE_ITEMS, ...NAVIGATION_ITEMS];

  // Filter items based on search
  const filteredItems = search
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-100"
        onClick={() => setOpen(false)}
      />

      {/* Command Dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl animate-in zoom-in-95 slide-in-from-top-2 duration-200">
        <Command
          className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4">
            <span className="text-gray-400 mr-2">🔍</span>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Αναζήτηση ή πληκτρολόγησε εντολή..."
              className="flex-1 h-14 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-gray-500">
              Δεν βρέθηκαν αποτελέσματα
            </Command.Empty>

            {Object.entries(groupedItems).map(([category, items]) => (
              <Command.Group key={category} heading={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                      'transition-colors',
                      'aria-selected:bg-primary-50 aria-selected:text-primary-900',
                      'hover:bg-gray-50'
                    )}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                      )}
                    </div>
                    {item.shortcut && (
                      <div className="flex items-center gap-1">
                        {item.shortcut.split(' ').map((key, i) => (
                          <kbd
                            key={i}
                            className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
                πλοήγηση
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
                επιλογή
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">K</kbd>
              για άνοιγμα
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

// Export a provider component that can be used in layout
export function CommandPaletteProvider({
  children,
  onOpenQuickCreate,
}: {
  children: React.ReactNode;
  onOpenQuickCreate?: (type: 'group' | 'activity' | 'staff' | 'facility' | 'session') => void;
}) {
  return (
    <>
      {children}
      <CommandPalette onOpenQuickCreate={onOpenQuickCreate} />
    </>
  );
}
