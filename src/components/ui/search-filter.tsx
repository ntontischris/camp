'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  filters?: {
    name: string;
    label: string;
    options: FilterOption[];
  }[];
  className?: string;
  debounceMs?: number;
}

export function SearchFilter({
  placeholder = 'Αναζήτηση...',
  onSearch,
  onFilter,
  filters = [],
  className,
  debounceMs = 300,
}: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[filterName] = value;
    } else {
      delete newFilters[filterName];
    }
    setActiveFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setQuery('');
    onSearch('');
    onFilter?.({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || query.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-3 py-2 rounded-lg border transition-colors flex items-center gap-2',
              showFilters || hasActiveFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
            )}
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Φίλτρα</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && filters.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Φίλτρα</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Καθαρισμός όλων
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <div key={filter.name}>
                <label className="block text-xs text-gray-500 mb-1">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Όλα</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon && `${option.icon} `}
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active filters pills */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              🔍 "{query}"
              <button
                onClick={() => setQuery('')}
                className="ml-1 hover:text-gray-900"
              >
                ✕
              </button>
            </span>
          )}
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.name === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:text-primary-900"
                >
                  ✕
                </button>
              </span>
            );
          })}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Καθαρισμός όλων
          </button>
        </div>
      )}
    </div>
  );
}

// Simple search-only variant
export function SimpleSearch({
  placeholder = 'Αναζήτηση...',
  onSearch,
  className,
}: {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
