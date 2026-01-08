import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/lib/types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'] & {
  organization: Organization;
};

interface OrganizationState {
  currentOrganization: Organization | null;
  userOrganizations: OrganizationMember[];
  isLoading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  setUserOrganizations: (orgs: OrganizationMember[]) => void;
  setLoading: (loading: boolean) => void;
  clearOrganizations: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      userOrganizations: [],
      isLoading: true,

      setCurrentOrganization: (org) => set({ currentOrganization: org }),

      setUserOrganizations: (orgs) => {
        set({ userOrganizations: orgs });
        // Auto-select first org if no current org is set
        if (orgs.length > 0) {
          set((state) => ({
            currentOrganization: state.currentOrganization || orgs[0].organization,
          }));
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clearOrganizations: () =>
        set({
          currentOrganization: null,
          userOrganizations: [],
          isLoading: false,
        }),
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);
