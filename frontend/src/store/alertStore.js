import { create } from 'zustand';
import api from '../shared/utils/api';

export const useAlertStore = create((set, get) => {
  let pollInterval = null;

  return {
    alerts: [],
    loading: false,
    error: null,

    fetchAlerts: async () => {
      try {
        set({ loading: true });
        const { data } = await api.get('/alerts');
        if (data.success) {
          set({ alerts: data.data, error: null });
        }
      } catch (err) {
        set({ error: err.response?.data?.message || 'Failed to fetch alerts' });
      } finally {
        set({ loading: false });
      }
    },

    markAsRead: async (id) => {
      try {
        const { data } = await api.put(`/alerts/${id}/read`);
        if (data.success) {
          set((state) => ({
            alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a))
          }));
        }
      } catch (err) {
        set({ error: err.response?.data?.message || 'Failed to mark alert as read' });
      }
    },

    markAllAsRead: async () => {
      try {
        const { data } = await api.put('/alerts/read-all');
        if (data.success) {
          set((state) => ({
            alerts: state.alerts.map((a) => ({ ...a, read: true }))
          }));
        }
      } catch (err) {
        set({ error: err.response?.data?.message || 'Failed to mark all alerts as read' });
      }
    },

    subscribeToRoleAlerts: () => {
      // Clear any existing poll interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Initial load
      get().fetchAlerts();

      // Poll every 8 seconds to simulate real-time updates safely
      pollInterval = setInterval(() => {
        get().fetchAlerts();
      }, 8000);

      // Return cleanup function
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    }
  };
});
