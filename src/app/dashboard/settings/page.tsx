'use client';

import { useState } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { GeneralSettings } from './general-settings';
import { TeamSettings } from './team-settings';

type Tab = 'general' | 'team' | 'subscription';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { currentOrganization, isLoading } = useOrganizations();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ρυθμίσεις</h1>
        <p className="mt-2 text-gray-600">
          Διαχείριση ρυθμίσεων οργανισμού και ομάδας
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Γενικά
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`${
              activeTab === 'team'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Ομάδα
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`${
              activeTab === 'subscription'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Συνδρομή
          </button>
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'team' && <TeamSettings />}
        {activeTab === 'subscription' && (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">Η διαχείριση συνδρομής θα είναι διαθέσιμη σύντομα.</p>
          </div>
        )}
      </div>
    </div>
  );
}
