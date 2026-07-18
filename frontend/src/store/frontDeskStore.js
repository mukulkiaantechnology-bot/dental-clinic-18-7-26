import { create } from 'zustand';
import api from '../shared/utils/api';

export const useFrontDeskStore = create((set, _get) => ({
  waitlist: [],
  insuranceChecks: [],
  walkins: [],
  loading: false,

  fetchWaitlist: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/waitlist');
      set({ waitlist: data.data || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch waitlist:', err);
      set({ loading: false });
    }
  },

  addToWaitlist: async (item) => {
    try {
      const { data } = await api.post('/waitlist', item);
      set((state) => ({ waitlist: [...state.waitlist, data.data] }));
    } catch (err) {
      console.error('Failed to add to waitlist:', err);
    }
  },

  removeFromWaitlist: async (id) => {
    try {
      await api.delete(`/waitlist/${id}`);
      set((state) => ({
        waitlist: state.waitlist.filter((w) => w.id !== id)
      }));
    } catch (err) {
      console.error('Failed to remove from waitlist:', err);
    }
  },

  updateWaitlistPriority: async (id, priority) => {
    try {
      const { data } = await api.patch(`/waitlist/${id}`, { priority });
      set((state) => ({
        waitlist: state.waitlist.map((w) => (w.id === id ? data.data : w))
      }));
    } catch (err) {
      console.error('Failed to update waitlist priority:', err);
    }
  },

  fetchInsuranceChecks: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/insurance-checks');
      set({ insuranceChecks: data.data || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch insurance checks:', err);
      set({ loading: false });
    }
  },

  addInsuranceCheck: async (check) => {
    try {
      const { data } = await api.post('/insurance-checks', check);
      set((state) => ({ insuranceChecks: [data.data, ...state.insuranceChecks] }));
    } catch (err) {
      console.error('Failed to add insurance check:', err);
    }
  },

  evaluateEligibility: async (id, status, coverageDetails) => {
    try {
      const { data } = await api.put(`/insurance-checks/${id}`, { status, coverageDetails });
      set((state) => ({
        insuranceChecks: state.insuranceChecks.map((ins) =>
          ins.id === id ? data.data : ins
        )
      }));
    } catch (err) {
      console.error('Failed to evaluate eligibility:', err);
    }
  },

  addWalkIn: (walkin) =>
    set((state) => {
      const newId = `wi-${state.walkins.length + 1}`;
      const newWalkIn = {
        id: newId,
        arrivedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Waiting',
        ...walkin
      };
      return { walkins: [newWalkIn, ...state.walkins] };
    }),

  updateWalkInStatus: (id, status) =>
    set((state) => ({
      walkins: state.walkins.map((wi) => (wi.id === id ? { ...wi, status } : wi))
    }))
}));
