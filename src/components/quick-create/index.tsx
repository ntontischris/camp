'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { QuickCreateFAB } from './quick-create-fab';
import { QuickCreateModal } from './quick-create-modal';

type CreateType = 'group' | 'activity' | 'staff' | 'facility' | 'session';

interface QuickCreateContextType {
  openModal: (type: CreateType) => void;
}

const QuickCreateContext = createContext<QuickCreateContextType | null>(null);

export function useQuickCreate() {
  const context = useContext(QuickCreateContext);
  if (!context) {
    throw new Error('useQuickCreate must be used within QuickCreateProvider');
  }
  return context;
}

interface QuickCreateProviderProps {
  defaultSessionId?: string;
  onCreateSuccess?: (type: CreateType, data: any) => void;
  children?: React.ReactNode;
}

export function QuickCreateProvider({
  defaultSessionId,
  onCreateSuccess,
  children,
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
    <QuickCreateContext.Provider value={{ openModal: handleOpenModal }}>
      {children}
      <QuickCreateFAB onOpenModal={handleOpenModal} />
      <QuickCreateModal
        type={modalType}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        defaultSessionId={defaultSessionId}
      />
    </QuickCreateContext.Provider>
  );
}

export { QuickCreateFAB } from './quick-create-fab';
export { QuickCreateModal } from './quick-create-modal';
