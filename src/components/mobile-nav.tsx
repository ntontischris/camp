'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { OrganizationSwitcher } from './organization-switcher';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const quickNav: NavItem[] = [
  { href: '/dashboard', label: 'Αρχική', icon: '📊' },
  { href: '/dashboard/schedule', label: 'Πρόγραμμα', icon: '📋' },
  { href: '/dashboard/activities', label: 'Δραστ.', icon: '🎯' },
  { href: '/dashboard/groups', label: 'Ομάδες', icon: '👥' },
];

const allNav: NavItem[] = [
  { href: '/dashboard', label: 'Αρχική', icon: '📊' },
  { href: '/dashboard/sessions', label: 'Περίοδοι', icon: '📅' },
  { href: '/dashboard/groups', label: 'Ομάδες', icon: '👥' },
  { href: '/dashboard/activities', label: 'Δραστηριότητες', icon: '🎯' },
  { href: '/dashboard/facilities', label: 'Χώροι', icon: '🏠' },
  { href: '/dashboard/staff', label: 'Προσωπικό', icon: '👤' },
  { href: '/dashboard/schedule', label: 'Ημερολόγιο', icon: '📋' },
  { href: '/dashboard/templates', label: 'Πρότυπα', icon: '📄' },
  { href: '/dashboard/constraints', label: 'Κανόνες', icon: '⚙️' },
  { href: '/dashboard/settings', label: 'Ρυθμίσεις', icon: '⚙️' },
  { href: '/dashboard/profile', label: 'Προφίλ', icon: '👤' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/dashboard" className="text-lg font-bold text-primary-600">
            🏕️ CampWise
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Μενού"
          >
            {isOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'lg:hidden fixed top-14 right-0 bottom-0 z-40 w-72 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Organization Switcher */}
        <div className="p-4 border-b border-gray-100">
          <OrganizationSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-1">
            {allNav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'Χρήστης'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
          >
            🚪 Αποσύνδεση
          </Button>
        </div>
      </div>

      {/* Bottom Tab Bar (Quick Access) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {quickNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors',
                  active ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className={cn('font-medium', active && 'text-primary-600')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-xs text-gray-500"
          >
            <span className="text-xl mb-0.5">☰</span>
            <span className="font-medium">Μενού</span>
          </button>
        </div>
      </nav>
    </>
  );
}
