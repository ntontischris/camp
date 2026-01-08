'use client';

import { useOrganizations } from '@/hooks/use-organizations';
import { useOrganizationStore } from '@/stores/organization-store';

export function OrganizationSwitcher() {
  const { currentOrganization, userOrganizations, isLoading } = useOrganizations();
  const { setCurrentOrganization } = useOrganizationStore();

  if (isLoading || userOrganizations.length === 0) {
    return null;
  }

  const handleChange = (organizationId: string) => {
    const selectedOrg = userOrganizations.find((om) => om.organization_id === organizationId);
    if (selectedOrg) {
      setCurrentOrganization(selectedOrg.organization);
    }
  };

  if (userOrganizations.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium shadow-sm">
        <span className="text-gray-700">{currentOrganization?.name}</span>
      </div>
    );
  }

  return (
    <select
      value={currentOrganization?.id || ''}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {userOrganizations.map((om) => (
        <option key={om.organization_id} value={om.organization_id}>
          {om.organization.name}
        </option>
      ))}
    </select>
  );
}
