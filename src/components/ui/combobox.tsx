'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';

interface ComboboxItem {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  group?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = 'Επίλεξε...',
  searchPlaceholder = 'Αναζήτηση...',
  emptyText = 'Δεν βρέθηκαν αποτελέσματα',
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.value === value);

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  // Group items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, ComboboxItem[]> = {};
    filteredItems.forEach((item) => {
      const group = item.group || '';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = (itemValue: string) => {
    onValueChange?.(itemValue);
    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm transition-colors',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          open && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        <span className={cn('truncate', !selectedItem && 'text-gray-400')}>
          {selectedItem ? (
            <span className="flex items-center gap-2">
              {selectedItem.icon && <span>{selectedItem.icon}</span>}
              {selectedItem.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span className="ml-2 text-gray-400">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
          />

          {/* Dropdown Panel */}
          <div
            className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Items List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1"
            >
              {filteredItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {emptyText}
                </div>
              ) : (
                Object.entries(groupedItems).map(([group, groupItems]) => (
                  <div key={group}>
                    {group && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {group}
                      </div>
                    )}
                    {groupItems.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleSelect(item.value)}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                          item.value === value
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        {item.icon && (
                          <span className="flex-shrink-0 text-base">{item.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.value === value && (
                          <span className="text-primary-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Clear Selection */}
            {value && (
              <div className="p-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  ✕ Καθαρισμός επιλογής
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
