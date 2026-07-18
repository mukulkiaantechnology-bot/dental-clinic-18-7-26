import { create } from 'zustand';
import api from '../shared/utils/api';

export const useAnalyticsStore = create((set) => ({
  insights: [],
  loading: false,
  fetchAIInsights: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/dashboard/insights');
      set({ insights: data.data || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      set({ loading: false });
    }
  }
}));

export default useAnalyticsStore;
