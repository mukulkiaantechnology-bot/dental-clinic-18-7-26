import { create } from 'zustand';
import api from '../shared/utils/api';
import { parseInvoiceItems } from '../shared/utils/billingUtils';

export const useBillingStore = create((set, get) => ({
  invoices: [],
  payments: [],
  claims: [],
  statements: [],
  loading: false,
  error: null,

  // ── FETCH ACTION ─────────────────────────────────────────────────────────
  fetchBillingData: async () => {
    set({ loading: true });
    try {
      const { data: invRes } = await api.get('/billing/invoices');
      const { data: payRes } = await api.get('/billing/payments');
      const { data: clmRes } = await api.get('/billing/claims');
      const { data: stmtRes } = await api.get('/billing/statements');

      set({
        invoices: invRes.success ? invRes.data.map(inv => ({
          ...inv,
          items: parseInvoiceItems(inv.items)
        })) : [],
        payments: payRes.success ? payRes.data : [],
        claims: clmRes.success ? clmRes.data : [],
        statements: stmtRes.success ? stmtRes.data : [],
        error: null
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch billing details' });
    } finally {
      set({ loading: false });
    }
  },

  // ── INVOICE ACTIONS ──────────────────────────────────────────────────────
  createInvoice: async (invoice) => {
    try {
      await api.post('/billing/invoices', invoice);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  },

  updateInvoice: async (id, updates) => {
    try {
      await api.put(`/billing/invoices/${id}`, updates);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  },

  deleteInvoice: async (id) => {
    try {
      await api.delete(`/billing/invoices/${id}`);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  },

  // Legacy alias used by ClinicOwnerPages
  addInvoice: async (invoice) => {
    await get().createInvoice(invoice);
  },

  payInvoice: async (id, amount) => {
    try {
      const invoice = get().invoices.find((inv) => inv.id === id);
      if (invoice) {
        await api.post('/billing/payments', {
          invoiceId: id,
          patientName: invoice.patientName,
          amount,
          method: 'Card',
          note: 'Direct invoice payout'
        });
        await get().fetchBillingData();
      }
    } catch (err) {
      console.error('Failed to pay invoice:', err);
    }
  },

  // ── PAYMENT ACTIONS ──────────────────────────────────────────────────────
  recordPayment: async (payment) => {
    try {
      await api.post('/billing/payments', payment);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  },

  deletePayment: async (id) => {
    try {
      await api.delete(`/billing/payments/${id}`);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to delete payment:', err);
    }
  },

  // ── CLAIM ACTIONS ────────────────────────────────────────────────────────
  createClaim: async (claim) => {
    try {
      await api.post('/billing/claims', claim);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to create claim:', err);
    }
  },

  updateClaimStatus: async (id, status, approvedAmount) => {
    try {
      await api.put(`/billing/claims/${id}`, { status, approvedAmount });
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to update claim status:', err);
    }
  },

  deleteClaim: async (id) => {
    try {
      await api.delete(`/billing/claims/${id}`);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to delete claim:', err);
    }
  },

  // ── STATEMENT ACTIONS ────────────────────────────────────────────────────
  generateStatement: async (patientId, patientName, periodStart, periodEnd) => {
    try {
      const invoices = get().invoices.filter(
        (inv) => inv.patientId === patientId || inv.patientName === patientName
      );
      const totalBilled = invoices.reduce((s, inv) => s + inv.amount, 0);
      const totalPaid = invoices.reduce((s, inv) => s + inv.patientPaid + inv.insurancePaid, 0);

      await api.post('/billing/statements', {
        patientId,
        patientName,
        periodStart,
        periodEnd,
        totalBilled,
        totalPaid,
        balance: totalBilled - totalPaid
      });
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to generate statement:', err);
    }
  },

  deleteStatement: async (id) => {
    try {
      await api.delete(`/billing/statements/${id}`);
      await get().fetchBillingData();
    } catch (err) {
      console.error('Failed to delete statement:', err);
    }
  },

  // ── COMPUTED HELPERS ─────────────────────────────────────────────────────
  getTodayRevenue: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().payments
      .filter((p) => p.date && p.date.startsWith(today))
      .reduce((s, p) => s + p.amount, 0);
  },

  getMonthRevenue: (month, year) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return get().payments
      .filter((p) => p.date && p.date.startsWith(prefix))
      .reduce((s, p) => s + p.amount, 0);
  }
}));
