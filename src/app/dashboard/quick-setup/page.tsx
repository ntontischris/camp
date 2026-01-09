'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampTemplates } from '@/components/smart-templates';
import { BulkImportModal } from '@/components/bulk-import';
import { CompleteSetupWizard } from '@/components/setup-wizard';
import { cn } from '@/lib/utils';

type ImportType = 'activities' | 'facilities' | 'staff' | 'groups';

export default function QuickSetupPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState<ImportType | null>(null);
  const [activeTab, setActiveTab] = useState<'wizard' | 'templates' | 'import'>('wizard');
  const [stats, setStats] = useState({
    activities: 0,
    facilities: 0,
    staff: 0,
    groups: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadSessions();
      loadStats();
    }
  }, [currentOrganization?.id]);

  const loadSessions = async () => {
    if (!currentOrganization) return;

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .is('deleted_at', null)
      .order('start_date', { ascending: false });

    setSessions(data || []);
    if (data && data.length > 0) {
      setSelectedSession(data[0].id);
    }
  };

  const loadStats = async () => {
    if (!currentOrganization) return;

    const [activitiesRes, facilitiesRes, staffRes, groupsRes] = await Promise.all([
      supabase.from('activities').select('id').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('facilities').select('id').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('staff').select('id').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('groups').select('id, session_id, sessions!inner(organization_id)')
        .eq('sessions.organization_id', currentOrganization.id)
        .is('deleted_at', null),
    ]);

    setStats({
      activities: activitiesRes.data?.length || 0,
      facilities: facilitiesRes.data?.length || 0,
      staff: staffRes.data?.length || 0,
      groups: groupsRes.data?.length || 0,
    });
  };

  const tabs = [
    { id: 'wizard', label: 'Οδηγός Ρύθμισης', icon: '🚀', description: 'Ρύθμισε τα πάντα βήμα-βήμα' },
    { id: 'templates', label: 'Πρότυπα', icon: '📦', description: 'Χρησιμοποίησε έτοιμα πρότυπα' },
    { id: 'import', label: 'Μαζική Εισαγωγή', icon: '📋', description: 'Εισήγαγε πολλά στοιχεία' },
  ] as const;

  const importOptions = [
    { type: 'activities' as const, icon: '🎯', label: 'Δραστηριότητες', color: 'bg-orange-500' },
    { type: 'facilities' as const, icon: '🏟️', label: 'Εγκαταστάσεις', color: 'bg-cyan-500' },
    { type: 'staff' as const, icon: '👤', label: 'Προσωπικό', color: 'bg-green-500' },
    { type: 'groups' as const, icon: '👥', label: 'Ομάδες', color: 'bg-purple-500' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚡</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Γρήγορη Ρύθμιση</h1>
            <p className="text-gray-600 mt-1">
              Ρύθμισε το camp σου με τον πιο εύκολο τρόπο
            </p>
          </div>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🎯" label="Δραστηριότητες" value={stats.activities} color="orange" />
        <StatCard icon="🏟️" label="Εγκαταστάσεις" value={stats.facilities} color="cyan" />
        <StatCard icon="👤" label="Προσωπικό" value={stats.staff} color="green" />
        <StatCard icon="👥" label="Ομάδες" value={stats.groups} color="purple" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <span className="text-xl">{tab.icon}</span>
            <div className="text-left hidden sm:block">
              <span className="font-medium block">{tab.label}</span>
              <span className="text-xs text-gray-500">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Wizard Tab */}
        {activeTab === 'wizard' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <span className="text-6xl block mb-4">🚀</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Οδηγός Γρήγορης Ρύθμισης
                </h3>
                <p className="text-gray-600 mb-6">
                  Δημιούργησε περίοδο, ομάδες, δραστηριότητες και εγκαταστάσεις
                  σε λιγότερο από 5 λεπτά με τον διαδραστικό μας οδηγό.
                </p>
                <Button size="lg" onClick={() => setShowWizard(true)}>
                  Έναρξη Οδηγού
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t grid grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-2xl block">📅</span>
                  <p className="text-sm text-gray-600 mt-1">Περίοδος</p>
                </div>
                <div>
                  <span className="text-2xl block">👥</span>
                  <p className="text-sm text-gray-600 mt-1">Ομάδες</p>
                </div>
                <div>
                  <span className="text-2xl block">🎯</span>
                  <p className="text-sm text-gray-600 mt-1">Δραστηριότητες</p>
                </div>
                <div>
                  <span className="text-2xl block">🏟️</span>
                  <p className="text-sm text-gray-600 mt-1">Εγκαταστάσεις</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📦</span> Έτοιμα Πρότυπα
              </CardTitle>
              <CardDescription>
                Επίλεξε από τα έτοιμα πρότυπα για να προσθέσεις γρήγορα δεδομένα
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Session selector for groups */}
              {sessions.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Περίοδος για Ομάδες
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <CampTemplates
                sessionId={selectedSession}
                onSuccess={() => loadStats()}
              />
            </CardContent>
          </Card>
        )}

        {/* Bulk Import Tab */}
        {activeTab === 'import' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📋</span> Μαζική Εισαγωγή
              </CardTitle>
              <CardDescription>
                Εισήγαγε πολλά στοιχεία ταυτόχρονα με copy-paste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {importOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setShowBulkImport(option.type)}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-white',
                        option.color
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">
                          {option.label}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Εισαγωγή πολλαπλών στοιχείων
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Πώς λειτουργεί:</strong> Γράψε ή κάνε copy-paste μια λίστα με ονόματα
                      (ένα ανά γραμμή) και θα δημιουργηθούν αυτόματα όλα τα στοιχεία.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Card */}
      <Card className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Συμβουλή</h4>
              <p className="text-sm text-gray-600">
                Μπορείς να χρησιμοποιήσεις το <strong>κουμπί +</strong> στην κάτω δεξιά γωνία
                για να δημιουργήσεις γρήγορα νέα στοιχεία από οποιαδήποτε σελίδα!
                Πάτα <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">+</kbd> ή{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Ctrl+N</kbd> για
                να ανοίξεις το μενού γρήγορης δημιουργίας.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showWizard && (
        <CompleteSetupWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            loadStats();
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          type={showBulkImport}
          sessionId={selectedSession}
          onClose={() => setShowBulkImport(null)}
          onSuccess={(count) => {
            loadStats();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
            colorClasses[color]
          )}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
