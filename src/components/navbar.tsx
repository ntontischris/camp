'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrganizationSwitcher } from './organization-switcher';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

export function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary-600">
              CampWise
            </Link>
            <OrganizationSwitcher />
            <div className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/sessions" className="text-gray-700 hover:text-gray-900">
                Περίοδοι
              </Link>
              <Link href="/dashboard/groups" className="text-gray-700 hover:text-gray-900">
                Ομάδες
              </Link>
              <Link href="/dashboard/activities" className="text-gray-700 hover:text-gray-900">
                Δραστηριότητες
              </Link>
              <Link href="/dashboard/facilities" className="text-gray-700 hover:text-gray-900">
                Εγκαταστάσεις
              </Link>
              <Link href="/dashboard/staff" className="text-gray-700 hover:text-gray-900">
                Προσωπικό
              </Link>
              <Link href="/dashboard/templates" className="text-gray-700 hover:text-gray-900">
                Πρότυπα
              </Link>
              <Link href="/dashboard/schedule" className="text-gray-700 hover:text-gray-900 font-medium text-primary-600">
                Πρόγραμμα
              </Link>
              <Link href="/dashboard/constraints" className="text-gray-700 hover:text-gray-900">
                Περιορισμοί
              </Link>
              <Link href="/dashboard/settings" className="text-gray-700 hover:text-gray-900">
                Ρυθμίσεις
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/profile"
              className="text-sm text-gray-700 hover:text-primary-600"
            >
              {user?.user_metadata?.full_name || user?.email}
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Αποσύνδεση
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
