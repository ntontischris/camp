'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface QuickCreateOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  shortcut?: string;
  color: string;
}

interface QuickCreateFABProps {
  onOpenModal?: (type: 'group' | 'activity' | 'staff' | 'facility' | 'session') => void;
}

export function QuickCreateFAB({ onOpenModal }: QuickCreateFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const options: QuickCreateOption[] = [
    {
      id: 'group',
      icon: '👥',
      label: 'Ομάδα',
      description: 'Νέα ομάδα κατασκηνωτών',
      shortcut: 'G',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => onOpenModal?.('group'),
    },
    {
      id: 'activity',
      icon: '🎯',
      label: 'Δραστηριότητα',
      description: 'Νέα δραστηριότητα',
      shortcut: 'A',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => onOpenModal?.('activity'),
    },
    {
      id: 'staff',
      icon: '👤',
      label: 'Προσωπικό',
      description: 'Νέο μέλος προσωπικού',
      shortcut: 'S',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => onOpenModal?.('staff'),
    },
    {
      id: 'facility',
      icon: '🏟️',
      label: 'Εγκατάσταση',
      description: 'Νέα εγκατάσταση',
      shortcut: 'F',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      onClick: () => onOpenModal?.('facility'),
    },
    {
      id: 'session',
      icon: '📅',
      label: 'Περίοδος',
      description: 'Νέα περίοδος κατασκήνωσης',
      shortcut: 'P',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => onOpenModal?.('session'),
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Open menu with +
      if (event.key === '+' || (event.key === 'n' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        setIsOpen(true);
        return;
      }

      // Close with Escape
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      // Quick shortcuts when menu is open
      if (isOpen) {
        const option = options.find(
          (o) => o.shortcut?.toLowerCase() === event.key.toLowerCase()
        );
        if (option) {
          event.preventDefault();
          handleOptionClick(option);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: QuickCreateOption) => {
    setIsOpen(false);
    if (option.onClick) {
      option.onClick();
    } else if (option.href) {
      router.push(option.href);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-50 lg:bottom-8 lg:right-8"
    >
      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Options Menu */}
      <div
        className={cn(
          'absolute bottom-16 right-0 mb-2 transition-all duration-200 transform origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        )}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 min-w-[280px]">
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Γρήγορη Δημιουργία
            </p>
          </div>

          <div className="space-y-1">
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                  'transition-all duration-150 hover:scale-[1.02]',
                  'hover:bg-gray-50 active:scale-[0.98]',
                  isOpen && 'animate-in slide-in-from-right-2',
                )}
                style={{
                  animationDelay: isOpen ? `${index * 50}ms` : '0ms',
                  animationFillMode: 'backwards',
                }}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white shadow-lg',
                    option.color
                  )}
                >
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {option.description}
                  </p>
                </div>
                {option.shortcut && (
                  <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded">
                    {option.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>

          {/* Quick tip */}
          <div className="mt-2 pt-2 border-t border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">+</kbd>
              <span>ή</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+N</kbd>
              <span>για άνοιγμα</span>
            </p>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
          'transition-all duration-200 transform',
          'focus:outline-none focus:ring-4 focus:ring-primary-300',
          isOpen
            ? 'bg-gray-800 hover:bg-gray-700 rotate-45'
            : 'bg-primary-600 hover:bg-primary-700 hover:scale-110',
          isAnimating && 'animate-pulse'
        )}
        aria-label={isOpen ? 'Κλείσιμο μενού' : 'Γρήγορη δημιουργία'}
        title="Γρήγορη Δημιουργία (+)"
      >
        <svg
          className={cn(
            'w-7 h-7 text-white transition-transform duration-200',
            isOpen && 'rotate-0'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Ripple hint on first load */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-75',
          'pointer-events-none',
          isOpen && 'hidden'
        )}
        style={{ animationDuration: '2s', animationIterationCount: '3' }}
      />
    </div>
  );
}
