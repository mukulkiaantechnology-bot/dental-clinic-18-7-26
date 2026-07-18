import { create } from 'zustand';
import api from '../shared/utils/api';
import { useAppointmentStore } from './appointmentStore';
import { parseInvoiceItems } from '../shared/utils/billingUtils';

export const usePatientStore = create((set, get) => ({
  patientProfile: null,
  appointments: [],
  treatmentPlans: [],
  invoices: [],
  prescriptions: [],
  reports: [],
  labStatus: [],
  activePatientId: null,
  loading: false,
  error: null,

  // Dynamic Query Sync across all HMS Stores
  fetchPatientData: async (patientId) => {
    if (!patientId) return;
    set({ loading: true, error: null });
    try {
      // 1. Fetch Patient details from backend
      const { data: profileRes } = await api.get(`/patients/${patientId}`);
      const matchedProfile = profileRes.success ? profileRes.data : null;

      // 2. Fetch Patient's appointments
      const { data: apptRes } = await api.get('/appointments');
      const patAppts = apptRes.success ? apptRes.data : [];

      // 3. Fetch Patient's invoices
      const { data: invoiceRes } = await api.get('/billing/invoices');
      const patInvoices = invoiceRes.success ? invoiceRes.data.map(inv => ({
        ...inv,
        items: parseInvoiceItems(inv.items)
      })) : [];

      // 4. Fetch Patient's lab cases
      const { data: labRes } = await api.get('/lab-cases');
      const patLabs = labRes.success ? labRes.data : [];

      set({
        activePatientId: patientId,
        patientProfile: matchedProfile,
        appointments: patAppts,
        treatmentPlans: matchedProfile?.treatmentPlans || [],
        invoices: patInvoices,
        prescriptions: matchedProfile?.prescriptions || [],
        reports: matchedProfile?.xrayFiles || [],
        labStatus: patLabs,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load patient profile data' });
    } finally {
      set({ loading: false });
    }
  },

  // Request Reschedule
  requestReschedule: async (apptId, newDate, newTime) => {
    try {
      await useAppointmentStore.getState().updateAppointment(apptId, {
        date: newDate,
        time: newTime,
        status: 'Scheduled'
      });
      // Re-sync patient data
      await get().fetchPatientData(get().activePatientId);
    } catch (err) {
      set({ error: err.message });
    }
  },

  // Pay Invoice
  payInvoice: async (invoiceId, amount) => {
    try {
      await api.put(`/billing/invoices/${invoiceId}`, { amount }); // Mock API call logic update for real flow, but just doing re-fetch below
      // Re-sync patient data
      await get().fetchPatientData(get().activePatientId);
    } catch (err) {
      set({ error: err.message });
    }
  },

  syncTreatmentUpdates: () => {
    get().fetchPatientData(get().activePatientId);
  },

  loadInvoices: () => {
    get().fetchPatientData(get().activePatientId);
  },

  refreshReports: () => {
    get().fetchPatientData(get().activePatientId);
  }
}));
