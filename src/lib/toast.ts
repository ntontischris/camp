import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

// Greek-friendly toast messages
const defaultMessages: Record<string, Record<string, string>> = {
  create: {
    success: 'Δημιουργήθηκε επιτυχώς',
    error: 'Σφάλμα κατά τη δημιουργία',
    loading: 'Δημιουργία...',
  },
  update: {
    success: 'Ενημερώθηκε επιτυχώς',
    error: 'Σφάλμα κατά την ενημέρωση',
    loading: 'Ενημέρωση...',
  },
  delete: {
    success: 'Διαγράφηκε επιτυχώς',
    error: 'Σφάλμα κατά τη διαγραφή',
    loading: 'Διαγραφή...',
  },
  save: {
    success: 'Αποθηκεύτηκε επιτυχώς',
    error: 'Σφάλμα κατά την αποθήκευση',
    loading: 'Αποθήκευση...',
  },
  load: {
    error: 'Σφάλμα κατά τη φόρτωση',
    loading: 'Φόρτωση...',
  },
};

// Simple toast functions
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration ?? 4000,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    };
    if (options?.action) {
      toastOptions.action = {
        label: options.action.label,
        onClick: options.action.onClick,
      };
    }
    return sonnerToast.success(message, toastOptions);
  },

  error: (message: string, options?: ToastOptions) => {
    const toastOptions: any = {
      description: options?.description,
      duration: options?.duration ?? 6000,
    };
    if (options?.action) {
      toastOptions.action = {
        label: options.action.label,
        onClick: options.action.onClick,
      };
    }
    return sonnerToast.error(message, toastOptions);
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // Promise-based toast for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};

// Entity-specific toast helpers
export const entityToast = {
  activity: {
    created: () => toast.success('Η δραστηριότητα δημιουργήθηκε', { description: 'Μπορείς να την προσθέσεις στο πρόγραμμα' }),
    updated: () => toast.success('Η δραστηριότητα ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Η δραστηριότητα διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} της δραστηριότητας`),
  },

  group: {
    created: () => toast.success('Η ομάδα δημιουργήθηκε', { description: 'Μπορείς να προσθέσεις κατασκηνωτές' }),
    updated: () => toast.success('Η ομάδα ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Η ομάδα διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} της ομάδας`),
  },

  facility: {
    created: () => toast.success('Η εγκατάσταση δημιουργήθηκε'),
    updated: () => toast.success('Η εγκατάσταση ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Η εγκατάσταση διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} της εγκατάστασης`),
  },

  staff: {
    created: () => toast.success('Το μέλος προσωπικού προστέθηκε'),
    updated: () => toast.success('Το μέλος προσωπικού ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Το μέλος προσωπικού διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} του μέλους προσωπικού`),
  },

  session: {
    created: () => toast.success('Η περίοδος δημιουργήθηκε', { description: 'Μπορείς να προσθέσεις ομάδες' }),
    updated: () => toast.success('Η περίοδος ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Η περίοδος διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} της περιόδου`),
  },

  constraint: {
    created: () => toast.success('Ο κανόνας δημιουργήθηκε'),
    updated: () => toast.success('Ο κανόνας ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Ο κανόνας διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} του κανόνα`),
  },

  template: {
    created: () => toast.success('Το πρότυπο δημιουργήθηκε'),
    updated: () => toast.success('Το πρότυπο ενημερώθηκε'),
    deleted: (onUndo?: () => void) => toast.success('Το πρότυπο διαγράφηκε', {
      action: onUndo ? { label: 'Αναίρεση', onClick: onUndo } : undefined,
    }),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} του προτύπου`),
  },

  schedule: {
    generated: () => toast.success('Το πρόγραμμα δημιουργήθηκε!', { description: 'Έλεγξε το αποτέλεσμα' }),
    slotCreated: () => toast.success('Το slot προστέθηκε'),
    slotUpdated: () => toast.success('Το slot ενημερώθηκε'),
    slotDeleted: () => toast.success('Το slot διαγράφηκε'),
    error: (action: string) => toast.error(`Σφάλμα κατά ${action} του προγράμματος`),
  },

  bulk: {
    imported: (count: number, type: string) => toast.success(`Εισήχθησαν ${count} ${type}`, { description: 'Μπορείς να τα επεξεργαστείς' }),
    error: () => toast.error('Σφάλμα κατά τη μαζική εισαγωγή'),
  },
};

// Utility for database error parsing
export function parseDbError(error: any): string {
  const message = error?.message || error?.toString() || 'Άγνωστο σφάλμα';

  // Common Postgres/Supabase error patterns
  if (message.includes('duplicate key')) {
    return 'Υπάρχει ήδη εγγραφή με αυτά τα στοιχεία';
  }
  if (message.includes('foreign key')) {
    return 'Δεν μπορεί να διαγραφεί γιατί χρησιμοποιείται αλλού';
  }
  if (message.includes('not null')) {
    return 'Λείπουν υποχρεωτικά πεδία';
  }
  if (message.includes('check constraint')) {
    return 'Μη έγκυρη τιμή';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Πρόβλημα σύνδεσης. Δοκίμασε ξανά.';
  }

  // If it's a user-friendly message, return as is
  if (message.length < 100 && !message.includes('ERROR')) {
    return message;
  }

  // Default fallback
  return 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
}
