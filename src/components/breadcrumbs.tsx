'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  dashboard: 'Αρχική',
  guide: 'Οδηγός Ρύθμισης',
  sessions: 'Περίοδοι',
  groups: 'Ομάδες',
  activities: 'Δραστηριότητες',
  facilities: 'Χώροι',
  staff: 'Προσωπικό',
  schedule: 'Πρόγραμμα',
  templates: 'Πρότυπα',
  constraints: 'Κανόνες',
  settings: 'Ρυθμίσεις',
  profile: 'Προφίλ',
  new: 'Νέο',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on dashboard home
  if (segments.length <= 1) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // Check if it's a UUID (detail page)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    let label = routeLabels[segment] || segment;
    if (isUuid) {
      label = 'Λεπτομέρειες';
    }

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav className={cn('flex items-center text-sm text-gray-500', className)}>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <span className="mx-2 text-gray-300">/</span>}
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-primary-600 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
