'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { OrganizationSwitcher } from './organization-switcher';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: '',
    items: [
      { href: '/dashboard', label: 'Αρχική', icon: '📊' },
      { href: '/dashboard/quick-setup', label: 'Γρήγορη Ρύθμιση', icon: '⚡' },
      { href: '/dashboard/guide', label: 'Οδηγός', icon: '📖' },
    ],
  },
  {
    title: 'Διαχείριση',
    items: [
      { href: '/dashboard/sessions', label: 'Περίοδοι', icon: '📅' },
      { href: '/dashboard/groups', label: 'Ομάδες', icon: '👥' },
      { href: '/dashboard/activities', label: 'Δραστηριότητες', icon: '🎯' },
      { href: '/dashboard/facilities', label: 'Χώροι', icon: '🏠' },
      { href: '/dashboard/staff', label: 'Προσωπικό', icon: '👤' },
    ],
  },
  {
    title: 'Πρόγραμμα',
    items: [
      { href: '/dashboard/schedule', label: 'Ημερολόγιο', icon: '📋' },
      { href: '/dashboard/templates', label: 'Πρότυπα Ημέρας', icon: '📄' },
      { href: '/dashboard/constraints', label: 'Κανόνες', icon: '⚙️' },
    ],
  },
  {
    title: 'Ρυθμίσεις',
    items: [
      { href: '/dashboard/settings', label: 'Ρυθμίσεις', icon: '⚙️' },
      { href: '/dashboard/profile', label: 'Προφίλ', icon: '👤' },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo & Collapse Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-primary-600">
            🏕️ CampWise
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
          title={collapsed ? 'Επέκταση' : 'Σύμπτυξη'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Organization Switcher */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-100">
          <OrganizationSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {section.title && !collapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1 px-2">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'Χρήστης'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-gray-400 hover:text-gray-600"
              title="Αποσύνδεση"
            >
              🚪
            </Button>
          </div>
        ) : (
          <button
            onClick={signOut}
            className="w-full p-2 rounded-md hover:bg-gray-100 text-gray-500"
            title="Αποσύνδεση"
          >
            🚪
          </button>
        )}
      </div>
    </aside>
  );
}
