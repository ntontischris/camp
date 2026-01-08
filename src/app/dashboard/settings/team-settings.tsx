'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type OrganizationMember = Database['public']['Tables']['organization_members']['Row'] & {
  user: {
    email: string;
    full_name: string | null;
  };
};

export function TeamSettings() {
  const { currentOrganization } = useOrganizations();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadMembers();
    }
  }, [currentOrganization?.id]);

  const loadMembers = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      // Load members without relation
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      // Load users for these members
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Map users to members
      const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
      const membersWithUsers: OrganizationMember[] = (membersData || []).map(member => ({
        ...member,
        user: userMap.get(member.user_id) || { email: '', full_name: null }
      }));

      setMembers(membersWithUsers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    setInviteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, just show a success message
      // In production, you'd send an actual email invitation
      setSuccess(`Πρόσκληση στάλθηκε στο ${inviteEmail}`);
      setInviteEmail('');

      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Είσαι σίγουρος ότι θέλεις να αφαιρέσεις αυτό το μέλος;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      await loadMembers();
    } catch (error: any) {
      setError(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      case 'instructor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Ιδιοκτήτης',
      admin: 'Διαχειριστής',
      manager: 'Υπεύθυνος',
      instructor: 'Κατασκηνωτής',
      viewer: 'Θεατής',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-gray-600">Φόρτωση μελών...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Πρόσκληση Μέλους</CardTitle>
          <CardDescription>
            Προσκάλεσε νέα μέλη στον οργανισμό σου
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={inviteLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Αποστολή...' : 'Πρόσκληση'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Μέλη Ομάδας ({members.length})</CardTitle>
          <CardDescription>
            Διαχείριση μελών και ρόλων
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {member.user.full_name || member.user.email}
                  </div>
                  {member.user.full_name && (
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>

                  {member.role !== 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Αφαίρεση
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Δεν υπάρχουν μέλη ακόμα.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
