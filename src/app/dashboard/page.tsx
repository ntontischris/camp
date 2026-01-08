'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useOrganizations } from '@/hooks/use-organizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalGroups: number;
  totalActivities: number;
  totalStaff: number;
  totalFacilities: number;
  upcomingSession: Session | null;
  recentSlots: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { currentOrganization, userOrganizations, isLoading: orgsLoading } = useOrganizations();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Χρήστη';

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!orgsLoading && userOrganizations.length === 0) {
      router.push('/onboarding');
    }
  }, [authLoading, isAuthenticated, orgsLoading, userOrganizations, router]);

  useEffect(() => {
    if (currentOrganization) {
      loadStats();
    }
  }, [currentOrganization?.id]);

  const loadStats = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const orgId = currentOrganization.id;

      // Parallel queries
      const [sessionsRes, groupsRes, activitiesRes, staffRes, facilitiesRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('organization_id', orgId).is('deleted_at', null),
        supabase.from('groups').select('id, session_id').is('deleted_at', null),
        supabase.from('activities').select('id').eq('organization_id', orgId).is('deleted_at', null).eq('is_active', true),
        supabase.from('staff').select('id').eq('organization_id', orgId).is('deleted_at', null).eq('is_active', true),
        supabase.from('facilities').select('id').eq('organization_id', orgId).is('deleted_at', null).eq('is_active', true)
      ]);

      const sessions = sessionsRes.data || [];
      const sessionIds = sessions.map(s => s.id);

      // Filter groups by sessions in this org
      const groups = (groupsRes.data || []).filter(g => sessionIds.includes(g.session_id));

      // Get schedule slots count for last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const slotsRes = await supabase
        .from('schedule_slots')
        .select('id')
        .in('session_id', sessionIds)
        .gte('created_at', weekAgo.toISOString());

      // Find upcoming session
      const today = new Date().toISOString().split('T')[0];
      const upcomingSession = sessions
        .filter(s => s.start_date >= today && (s.status === 'planning' || s.status === 'active'))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null;

      setStats({
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active' || s.status === 'planning').length,
        totalGroups: groups.length,
        totalActivities: activitiesRes.data?.length || 0,
        totalStaff: staffRes.data?.length || 0,
        totalFacilities: facilitiesRes.data?.length || 0,
        upcomingSession,
        recentSlots: slotsRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || orgsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Καλωσόρισες, {displayName}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          {currentOrganization ? (
            <>Οργανισμός: <span className="font-medium">{currentOrganization.name}</span></>
          ) : (
            'Επίλεξε έναν οργανισμό για να ξεκινήσεις.'
          )}
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Περίοδοι"
            value={stats.totalSessions}
            subtitle={`${stats.activeSessions} ενεργές`}
            icon="📅"
            color="blue"
            href="/dashboard/sessions"
          />
          <StatCard
            title="Ομάδες"
            value={stats.totalGroups}
            subtitle="Συνολικά"
            icon="👥"
            color="purple"
            href="/dashboard/groups"
          />
          <StatCard
            title="Δραστηριότητες"
            value={stats.totalActivities}
            subtitle="Ενεργές"
            icon="🎯"
            color="orange"
            href="/dashboard/activities"
          />
          <StatCard
            title="Προσωπικό"
            value={stats.totalStaff}
            subtitle="Μέλη"
            icon="👤"
            color="green"
            href="/dashboard/staff"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Upcoming Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📌 Επόμενη Περίοδος</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingSession ? (
              <div>
                <h3 className="font-medium text-gray-900">{stats.upcomingSession.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateGR(stats.upcomingSession.start_date)} - {formatDateGR(stats.upcomingSession.end_date)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/dashboard/schedule">
                    <Button size="sm">Πρόγραμμα</Button>
                  </Link>
                  <Link href={`/dashboard/sessions/${stats.upcomingSession.id}`}>
                    <Button size="sm" variant="outline">Λεπτομέρειες</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">Δεν υπάρχει προγραμματισμένη περίοδος</p>
                <Link href="/dashboard/sessions/new">
                  <Button>Νέα Περίοδος</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚡ Γρήγορες Ενέργειες</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                href="/dashboard/schedule"
                icon="📋"
                label="Πρόγραμμα"
              />
              <QuickActionButton
                href="/dashboard/activities/new"
                icon="➕"
                label="Νέα Δραστηριότητα"
              />
              <QuickActionButton
                href="/dashboard/constraints"
                icon="⚙️"
                label="Περιορισμοί"
              />
              <QuickActionButton
                href="/dashboard/templates"
                icon="📄"
                label="Πρότυπα"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">🚀 Δυνατότητες CampWise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureItem
              icon="✨"
              title="Αυτόματη Δημιουργία"
              description="Δημιούργησε πρόγραμμα με ένα κλικ"
              status="active"
            />
            <FeatureItem
              icon="🔒"
              title="Περιορισμοί"
              description="10 τύποι περιορισμών"
              status="active"
            />
            <FeatureItem
              icon="🖨️"
              title="Εξαγωγή PDF"
              description="Εκτύπωση προγραμμάτων"
              status="active"
            />
            <FeatureItem
              icon="🌤️"
              title="Καιρός"
              description="Αντικαταστάσεις κακοκαιρίας"
              status="active"
            />
            <FeatureItem
              icon="⚠️"
              title="Conflict Detection"
              description="Εντοπισμός συγκρούσεων"
              status="active"
            />
            <FeatureItem
              icon="👥"
              title="Staff Assignment"
              description="Ανάθεση προσωπικού"
              status="active"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats && stats.recentSlots > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Πρόσφατη Δραστηριότητα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              <span className="text-2xl font-bold text-primary-600">{stats.recentSlots}</span>
              {' '}νέα slots δημιουργήθηκαν την τελευταία εβδομάδα
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  href
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
  href: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActionButton({
  href,
  icon,
  label
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link href={href}>
      <button className="w-full p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
        <span className="text-xl mr-2">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </button>
    </Link>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  status
}: {
  icon: string;
  title: string;
  description: string;
  status: 'active' | 'soon';
}) {
  return (
    <div className={`p-3 rounded-lg ${status === 'active' ? 'bg-green-50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="font-medium text-gray-900">{title}</span>
        {status === 'active' && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓</span>
        )}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function formatDateGR(date: string): string {
  return new Date(date).toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
