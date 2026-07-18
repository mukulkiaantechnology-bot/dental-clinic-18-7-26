import { create } from 'zustand';
import api from '../shared/utils/api';


export const useSuperAdminStore = create((set, get) => ({
  clinics: [],
  users: [],
  plans: [],
  saasInvoices: [],
  auditLogs: [],
  loading: false,
  error: null,

  // --- HELPER: WRITE AUDIT LOG ---
  logAction: async (action, clinic = 'Global') => {
    try {
      await api.post('/audit-logs', { action, clinic });
      await get().fetchAuditLogs();
    } catch (err) {
      console.error('Failed to log audit action:', err);
    }
  },

  // --- CLINICS CRUD ACTIONS ---
  fetchClinics: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/clinics');
      if (data.success) {
        set({ clinics: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load clinics' });
    } finally {
      set({ loading: false });
    }
  },

  addClinic: async (clinicData) => {
    try {
      set({ loading: true });
      const plan = get().plans.find(p => p.name === clinicData.plan);
      const monthlyFee = plan ? plan.fee : (clinicData.plan === 'Trial' || clinicData.plan === 'Trial Mode' ? 0.0 : 149.00);
      const payload = {
        ...clinicData,
        monthlyFee,
        performanceScore: 85,
        aiModules: clinicData.aiModules || { diagnostic: false, recallSMS: false, workload: false }
      };

      const { data } = await api.post('/clinics', payload);
      if (data.success) {
        await get().logAction(`Registered new clinic location: ${clinicData.name}`, clinicData.name);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to register clinic' });
    } finally {
      set({ loading: false });
    }
  },

  updateClinic: async (id, updatedData) => {
    try {
      set({ loading: true });
      const targetClinic = get().clinics.find(c => c.id === id);
      const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';

      const { data } = await api.put(`/clinics/${id}`, updatedData);
      if (data.success) {
        await get().logAction(`Updated details for clinic location: ${clinicName}`, clinicName);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update clinic' });
    } finally {
      set({ loading: false });
    }
  },

  deleteClinic: async (id) => {
    try {
      set({ loading: true });
      const targetClinic = get().clinics.find(c => c.id === id);
      const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';

      const { data } = await api.delete(`/clinics/${id}`);
      if (data.success) {
        await get().logAction(`Removed clinic record: ${clinicName}`, clinicName);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete clinic' });
    } finally {
      set({ loading: false });
    }
  },

  toggleAiModule: async (clinicId, moduleName) => {
    try {
      set({ loading: true });
      const targetClinic = get().clinics.find(c => c.id === clinicId);
      const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';

      const { data } = await api.patch(`/clinics/${clinicId}/ai-modules`, { moduleName });
      if (data.success) {
        const actionText = `Toggled AI ${moduleName} module for ${clinicName}`;
        await get().logAction(actionText, clinicName);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to toggle AI module' });
    } finally {
      set({ loading: false });
    }
  },

  updateSubscription: async (clinicId, plan, status) => {
    try {
      set({ loading: true });
      const targetPlan = get().plans.find(p => p.name === plan);
      const monthlyFee = status === 'Suspended' ? 0.0 : (targetPlan ? targetPlan.fee : (plan === 'Trial' || plan === 'Trial Mode' ? 0.0 : 0.0));
      
      const targetClinic = get().clinics.find(c => c.id === clinicId);
      const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';

      const { data } = await api.patch(`/clinics/${clinicId}/subscription`, { plan, status, monthlyFee });
      if (data.success) {
        const actionText = `Updated ${clinicName} subscription to plan: ${plan} (${status})`;
        await get().logAction(actionText, clinicName);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update subscription' });
    } finally {
      set({ loading: false });
    }
  },

  updateClinicStatus: async (clinicId, status) => {
    try {
      set({ loading: true });
      const targetClinic = get().clinics.find(c => c.id === clinicId);
      const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';

      const { data } = await api.patch(`/clinics/${clinicId}/status`, { status });
      if (data.success) {
        const actionText = `Changed ${clinicName} operational status to: ${status}`;
        await get().logAction(actionText, clinicName);
        await get().fetchClinics();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update clinic status' });
    } finally {
      set({ loading: false });
    }
  },

  // --- USERS CRUD ACTIONS ---
  fetchUsers: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/users');
      if (data.success) {
        set({ users: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load users' });
    } finally {
      set({ loading: false });
    }
  },

  addUser: async (userData) => {
    try {
      set({ loading: true });
      const { data } = await api.post('/users', userData);
      if (data.success) {
        const targetClinic = get().clinics.find(c => c.id === userData.clinicId);
        const clinicName = targetClinic ? targetClinic.name : 'Global';
        await get().logAction(`Registered new platform user: ${userData.name} as ${userData.role} for ${clinicName}`, clinicName);
        await get().fetchUsers();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to add user' });
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id, updatedData) => {
    try {
      set({ loading: true });
      const targetUser = get().users.find(u => u.id === id);
      const userName = targetUser ? targetUser.name : 'Unknown User';

      const { data } = await api.put(`/users/${id}`, updatedData);
      if (data.success) {
        const targetClinic = get().clinics.find(c => c.id === updatedData.clinicId || targetUser.clinicId);
        const clinicName = targetClinic ? targetClinic.name : 'Global';
        await get().logAction(`Modified permissions/details for user: ${userName}`, clinicName);
        await get().fetchUsers();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update user' });
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (id) => {
    try {
      set({ loading: true });
      const targetUser = get().users.find(u => u.id === id);
      const userName = targetUser ? targetUser.name : 'Unknown User';
      const clinicId = targetUser ? targetUser.clinicId : null;

      const { data } = await api.delete(`/users/${id}`);
      if (data.success) {
        const targetClinic = get().clinics.find(c => c.id === clinicId);
        const clinicName = targetClinic ? targetClinic.name : 'Global';
        await get().logAction(`Revoked credential keys for user: ${userName}`, clinicName);
        await get().fetchUsers();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete user' });
    } finally {
      set({ loading: false });
    }
  },

  approveUser: async (id) => {
    try {
      set({ loading: true });
      const targetUser = get().users.find(u => u.id === id);
      const userName = targetUser ? targetUser.name : 'Unknown User';
      const clinicId = targetUser ? targetUser.clinicId : null;

      const { data } = await api.patch(`/users/${id}/approve`);
      if (data.success) {
        const targetClinic = get().clinics.find(c => c.id === clinicId);
        const clinicName = targetClinic ? targetClinic.name : 'Global';
        await get().logAction(`Approved account for Clinic Owner: ${userName} (${clinicName})`, clinicName);
        await get().fetchUsers();
        await get().fetchClinics(); // Approval updates clinic status to Active
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to approve user' });
    } finally {
      set({ loading: false });
    }
  },

  // --- SAAS BILLING INVOICES CRUD ---
  fetchSaasInvoices: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/saas-invoices');
      if (data.success) {
        set({ saasInvoices: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load SaaS invoices' });
    } finally {
      set({ loading: false });
    }
  },

  addSaasInvoice: async (invoiceData) => {
    try {
      set({ loading: true });
      const { data } = await api.post('/saas-invoices', invoiceData);
      if (data.success) {
        const targetClinic = get().clinics.find(c => c.id === invoiceData.clinicId);
        const clinicName = targetClinic ? targetClinic.name : 'Unknown Clinic';
        await get().logAction(`Generated SaaS invoice #${data.data.id} for ${clinicName} ($${invoiceData.amount})`, clinicName);
        await get().fetchSaasInvoices();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to generate SaaS invoice' });
    } finally {
      set({ loading: false });
    }
  },

  updateSaasInvoice: async (id, updatedData) => {
    try {
      set({ loading: true });
      const { data } = await api.put(`/saas-invoices/${id}`, updatedData);
      if (data.success) {
        const targetInvoice = get().saasInvoices.find(inv => inv.id === id);
        const clinicName = targetInvoice ? targetInvoice.clinicName : 'Unknown Clinic';
        await get().logAction(`Modified status/details of SaaS invoice #${id} for ${clinicName}`, clinicName);
        await get().fetchSaasInvoices();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update SaaS invoice' });
    } finally {
      set({ loading: false });
    }
  },

  deleteSaasInvoice: async (id) => {
    try {
      set({ loading: true });
      const targetInvoice = get().saasInvoices.find(inv => inv.id === id);
      const clinicName = targetInvoice ? targetInvoice.clinicName : 'Unknown Clinic';

      const { data } = await api.delete(`/saas-invoices/${id}`);
      if (data.success) {
        await get().logAction(`Deleted SaaS invoice #${id} for ${clinicName}`, clinicName);
        await get().fetchSaasInvoices();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete SaaS invoice' });
    } finally {
      set({ loading: false });
    }
  },

  // --- PLANS ACTIONS ---
  fetchPlans: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/plans');
      if (data.success) {
        set({ plans: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load plans' });
    } finally {
      set({ loading: false });
    }
  },

  addPlan: async (planData) => {
    try {
      set({ loading: true });
      const { data } = await api.post('/plans', planData);
      if (data.success) {
        await get().logAction(`Created new SaaS Pricing Plan: ${planData.name} ($${planData.fee}/mo)`);
        await get().fetchPlans();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to add plan' });
    } finally {
      set({ loading: false });
    }
  },

  updatePlan: async (id, updatedData) => {
    try {
      set({ loading: true });
      const { data } = await api.put(`/plans/${id}`, updatedData);
      if (data.success) {
        await get().logAction(`Updated SaaS Pricing Plan configuration: ${updatedData.name}`);
        await get().fetchPlans();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update plan' });
    } finally {
      set({ loading: false });
    }
  },

  deletePlan: async (id) => {
    try {
      set({ loading: true });
      const targetPlan = get().plans.find(p => p.id === id);
      const planName = targetPlan ? targetPlan.name : 'Unknown Plan';
      
      const { data } = await api.delete(`/plans/${id}`);
      if (data.success) {
        await get().logAction(`Deleted SaaS Pricing Plan: ${planName}`);
        await get().fetchPlans();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete plan' });
    } finally {
      set({ loading: false });
    }
  },

  // --- AUDIT LOGS FETCH ---
  fetchAuditLogs: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/audit-logs');
      if (data.success) {
        set({ auditLogs: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load audit logs' });
    } finally {
      set({ loading: false });
    }
  }
}));
