import { create } from 'zustand';
import api from '../shared/utils/api';

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  invoices: [],
  plans: [],
  usage: {
    users: 0,
    patients: 0
  },
  loading: false,
  error: null,

  fetchSubscriptionDetails: async () => {
    try {
      set({ loading: true });
      const [billingRes, plansRes] = await Promise.all([
        api.get('/billing/subscription'),
        api.get('/plans')
      ]);

      if (billingRes.data.success) {
        set({
          subscription: billingRes.data.data.subscription,
          invoices: billingRes.data.data.invoices,
          usage: billingRes.data.data.usage,
          plans: plansRes.data.success ? plansRes.data.data : [],
          error: null
        });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch subscription details' });
    } finally {
      set({ loading: false });
    }
  },

  upgradePlan: async (planId) => {
    try {
      set({ loading: true });
      const { data } = await api.post('/billing/create-checkout-session', { planId });
      if (data.success && data.data.url) {
        // Redirect user to Stripe Checkout portal or simulated mock redirect
        window.location.href = data.data.url;
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create checkout session' });
    } finally {
      set({ loading: false });
    }
  },

  // Developer mock webhook trigger for local sandbox testing
  triggerMockWebhook: async (clinicId, planId, amount) => {
    try {
      set({ loading: true });
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_mock_' + Math.random().toString(36).substring(7),
            subscription: 'sub_mock_' + Math.random().toString(36).substring(7),
            amount_total: Number(amount) * 100,
            metadata: { clinicId, planId }
          }
        }
      };
      
      const { data } = await api.post('/billing/webhook', mockEvent);
      if (data.received) {
        // Refresh state
        await get().fetchSubscriptionDetails();
      }
    } catch (err) {
      console.error('[Mock Webhook Fail]', err);
    } finally {
      set({ loading: false });
    }
  }
}));
