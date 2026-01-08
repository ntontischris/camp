'use client';

import { useState, useCallback } from 'react';
import { QuickCreateFAB } from './quick-create-fab';
import { QuickCreateModal } from './quick-create-modal';

type CreateType = 'group' | 'activity' | 'staff' | 'facility' | 'session';

interface QuickCreateProviderProps {
  defaultSessionId?: string;
  onCreateSuccess?: (type: CreateType, data: any) => void;
}

export function QuickCreateProvider({
  defaultSessionId,
  onCreateSuccess,
}: QuickCreateProviderProps) {
  const [modalType, setModalType] = useState<CreateType | null>(null);

  const handleOpenModal = useCallback((type: CreateType) => {
    setModalType(type);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
  }, []);

  const handleSuccess = useCallback(
    (type: CreateType, data: any) => {
      onCreateSuccess?.(type, data);
      // Trigger page refresh for data updates
      window.dispatchEvent(new CustomEvent('quick-create-success', { detail: { type, data } }));
    },
    [onCreateSuccess]
  );

  return (
    <>
      <QuickCreateFAB onOpenModal={handleOpenModal} />
      <QuickCreateModal
        type={modalType}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        defaultSessionId={defaultSessionId}
      />
    </>
  );
}

export { QuickCreateFAB } from './quick-create-fab';
export { QuickCreateModal } from './quick-create-modal';
