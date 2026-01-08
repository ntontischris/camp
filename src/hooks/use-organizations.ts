'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizationStore } from '@/stores/organization-store';
import { useAuthStore } from '@/stores/auth-store';

export function useOrganizations() {
  const { user } = useAuthStore();
  const {
    currentOrganization,
    userOrganizations,
    isLoading,
    setUserOrganizations,
    setLoading,
    clearOrganizations,
  } = useOrganizationStore();

  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      clearOrganizations();
      return;
    }

    loadOrganizations();
  }, [user?.id]);

  const loadOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Loading organizations for user:', user.id);

      // Load memberships
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (membersError) {
        console.error('Supabase error details:', {
          message: membersError.message,
          details: membersError.details,
          hint: membersError.hint,
          code: membersError.code
        });
        throw membersError;
      }

      // Load organizations for these memberships
      const orgIds = membersData?.map(m => m.organization_id) || [];
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgsError) throw orgsError;

      // Map organizations to memberships
      const orgMap = new Map(orgsData?.map(o => [o.id, o]) || []);
      const membersWithOrgs = (membersData || [])
        .filter(member => orgMap.has(member.organization_id))
        .map(member => ({
          ...member,
          organization: orgMap.get(member.organization_id)!
        }));

      console.log('Organizations loaded:', membersWithOrgs);
      setUserOrganizations(membersWithOrgs);
    } catch (error: any) {
      console.error('Error loading organizations:', {
        message: error.message,
        error: error
      });
      setUserOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentOrganization,
    userOrganizations,
    isLoading,
    refetch: loadOrganizations,
  };
}
