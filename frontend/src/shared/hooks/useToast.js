import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type, title) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, title }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));

export function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return {
    toasts,
    dismiss,
    toast: (message, type = 'success', title) => addToast(message, type, title),
    success: (message, title) => addToast(message, 'success', title),
    error: (message, title) => addToast(message, 'error', title),
    warning: (message, title) => addToast(message, 'warning', title),
    info: (message, title) => addToast(message, 'info', title)
  };
}
