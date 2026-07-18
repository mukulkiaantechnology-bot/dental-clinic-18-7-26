import { create } from 'zustand';
import api from '../shared/utils/api';
import { useAuthStore } from './authStore';
import { parseInvoiceItems } from '../shared/utils/billingUtils';

export const useClinicOwnerStore = create((set, get) => ({
  patients: [],
  staff: [],
  appointments: [],
  clinicalNotes: [],
  invoices: [],
  settings: {
    name: 'Loading...',
    location: '',
    phone: '',
    status: '',
    plan: ''
  },
  loading: false,
  error: null,

  // --- SETTINGS (CLINIC PROFILE) ---
  fetchClinicSettings: async () => {
    const user = useAuthStore.getState().user;
    if (!user || !user.clinicId) return;
    try {
      set({ loading: true });
      const { data } = await api.get(`/clinics/${user.clinicId}`);
      if (data.success) {
        set({ settings: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load clinic settings' });
    } finally {
      set({ loading: false });
    }
  },

  updateClinicSettings: async (settingsData) => {
    const user = useAuthStore.getState().user;
    if (!user || !user.clinicId) return;
    try {
      set({ loading: true });
      const { data } = await api.put(`/clinics/${user.clinicId}`, settingsData);
      if (data.success) {
        set({ settings: data.data, error: null });
        get().fetchClinicSettings();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update clinic settings' });
    } finally {
      set({ loading: false });
    }
  },

  // --- PATIENTS CRUD ---
  fetchPatients: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/patients');
      if (data.success) {
        set({ patients: data.data, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load patients' });
    } finally {
      set({ loading: false });
    }
  },

  addPatient: async (patientData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post('/patients', patientData);
      if (data.success) {
        await get().fetchPatients();
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register patient';
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updatePatient: async (id, patientData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.put(`/patients/${id}`, patientData);
      if (data.success) {
        await get().fetchPatients();
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update patient';
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deletePatient: async (id) => {
    try {
      set({ loading: true });
      const { data } = await api.delete(`/patients/${id}`);
      if (data.success) {
        await get().fetchPatients();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete patient' });
    } finally {
      set({ loading: false });
    }
  },

  // --- STAFF CRUD (USERS) ---
  fetchStaff: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/users');
      if (data.success) {
        // Map backend fields to frontend staff format
        const roleMapping = {
          dentist: 'Dentist',
          dental_assistant: 'Assistant',
          hygienist: 'Hygienist',
          front_desk: 'Front Desk',
          billing_staff: 'Billing Staff',
          lab_coordinator: 'Lab Coordinator'
        };
        const mappedStaff = data.data.map(u => ({
          id: u.id,
          name: u.name,
          role: roleMapping[u.role] || u.role,
          speciality: u.speciality || (u.role === 'dentist' ? 'Dentistry' : u.role === 'hygienist' ? 'Hygiene' : ''),
          phone: u.phone || 'N/A',
          email: u.email,
          status: u.status === 'Approved' ? 'Active' : 'Inactive',
          assistantId: u.assistantId || '',
          hygienistId: u.hygienistId || ''
        }));
        set({ staff: mappedStaff, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load staff' });
    } finally {
      set({ loading: false });
    }
  },

  addStaff: async (staffData) => {
    try {
      set({ loading: true, error: null });
      // Map frontend role format back to backend role format
      const roleMapping = {
        Dentist: 'dentist',
        Assistant: 'dental_assistant',
        Hygienist: 'hygienist',
        'Front Desk': 'front_desk',
        'Billing Staff': 'billing_staff',
        'Lab Coordinator': 'lab_coordinator'
      };
      const formattedData = {
        ...staffData,
        role: roleMapping[staffData.role] || staffData.role.toLowerCase()
      };
      const { data } = await api.post('/users', formattedData);
      if (data.success) {
        await get().fetchStaff();
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add staff member';
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateStaff: async (id, staffData) => {
    try {
      set({ loading: true, error: null });
      const roleMapping = {
        Dentist: 'dentist',
        Assistant: 'dental_assistant',
        Hygienist: 'hygienist',
        'Front Desk': 'front_desk',
        'Billing Staff': 'billing_staff',
        'Lab Coordinator': 'lab_coordinator'
      };
      const formattedData = {
        ...staffData,
        role: roleMapping[staffData.role] || staffData.role.toLowerCase()
      };
      const { data } = await api.put(`/users/${id}`, formattedData);
      if (data.success) {
        await get().fetchStaff();
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update staff member';
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteStaff: async (id) => {
    try {
      set({ loading: true });
      const { data } = await api.delete(`/users/${id}`);
      if (data.success) {
        await get().fetchStaff();
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete staff member' });
    } finally {
      set({ loading: false });
    }
  },

  // Temporary fallbacks for unintegrated endpoints to prevent UI crashes, but strictly no mock arrays
  fetchAppointments: async () => {
    try {
      const { data } = await api.get('/appointments');
      if (data.success) {
        set({ appointments: data.data });
      }
    } catch (err) {
      console.error(err);
    }
  },

  fetchInvoices: async () => {
    try {
      const { data } = await api.get('/billing/invoices');
      if (data.success) {
        const parsedInvoices = data.data.map(inv => ({
          ...inv,
          items: parseInvoiceItems(inv.items)
        }));
        set({ invoices: parsedInvoices });
      }
    } catch (err) {
      console.error(err);
    }
  },

  fetchClinicalNotes: async () => {
    try {
      set({ loading: true });
      let currentPatients = get().patients;
      if (currentPatients.length === 0) {
        const { data } = await api.get('/patients');
        if (data.success) {
          currentPatients = data.data;
          set({ patients: currentPatients });
        }
      }

      const notesList = [];
      await Promise.all(
        currentPatients.map(async (pat) => {
          try {
            const { data } = await api.get(`/patients/${pat.id}`);
            if (data.success) {
              const fullPatient = data.data;
              if (!fullPatient.clinicalNotes || fullPatient.clinicalNotes.length === 0) {
                return;
              }

              // Sort notes to find the latest clinical note session
              const sortedNotes = [...fullPatient.clinicalNotes].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );
              const latestNote = sortedNotes[0];

              // Get actual tooth numbers from database treatment plans, fallback to parsing note
              let toothNumber = 'N/A';
              if (fullPatient.treatmentPlans && fullPatient.treatmentPlans.length > 0) {
                toothNumber = [...new Set(fullPatient.treatmentPlans.map(tp => tp.tooth))]
                  .map(t => `#${t}`)
                  .join(', ');
              } else {
                const match = latestNote.content.match(/(?:tooth|Tooth) #\s*(\d+)/i);
                if (match) {
                  toothNumber = `#${match[1]}`;
                }
              }

              // Get completed treatments from database treatment plans, fallback to parsing note
              let treatment = 'Completed Procedure';
              if (fullPatient.treatmentPlans && fullPatient.treatmentPlans.length > 0) {
                treatment = fullPatient.treatmentPlans.map(tp => tp.procedure).join(', ');
              } else {
                const match = latestNote.content.match(/(?:treatment|Treatment):\s*([^\n]+)/i);
                if (match) {
                  treatment = match[1];
                }
              }

              const dentistName = latestNote.authorName || 'Unknown Staff';
              const authorRole = latestNote.authorRole || 'Staff';
              const diagnosis = latestNote.content.split('\n')[0] || 'Healthy / Routine Exam';

              notesList.push({
                id: latestNote.id,
                date: new Date(latestNote.createdAt).toLocaleDateString(),
                patientName: pat.name,
                patientId: pat.id,
                dentistName,
                authorRole,
                toothNumber,
                diagnosis,
                treatment,
                notes: latestNote.content,
                createdAt: latestNote.createdAt
              });
            }
          } catch (err) {
            console.error(`Failed to fetch clinical notes for patient ${pat.id}`, err);
          }
        })
      );

      notesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      set({ clinicalNotes: notesList, error: null });
    } catch {
      set({ error: 'Failed to load clinical notes' });
    } finally {
      set({ loading: false });
    }
  }
}));
