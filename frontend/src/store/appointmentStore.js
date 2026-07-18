import { create } from 'zustand';
import api from '../shared/utils/api';

export const useAppointmentStore = create((set, _get) => ({
  appointments: [],
  loading: false,
  error: null,

  /**
   * FETCH — GET /appointments?date=YYYY-MM-DD
   * Backend automatically filters by role (dentist/hygienist/etc.)
   */
  fetchAppointments: async (date) => {
    set({ loading: true, error: null });
    try {
      const params = date ? { date } : {};
      const { data } = await api.get('/appointments', { params });
      set({ appointments: data.data, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load appointments';
      set({ loading: false, error: message });
    }
  },

  /**
   * CREATE — POST /appointments
   */
  addAppointment: async (apptData) => {
    try {
      const { data } = await api.post('/appointments', apptData);
      set((state) => ({
        appointments: [data.data, ...state.appointments],
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create appointment';
      return { success: false, error: message };
    }
  },

  /**
   * UPDATE STATUS — PATCH /appointments/:id/status
   * Valid flow: Scheduled → Checked_In → In_Progress → Ready_For_Doctor → Completed
   */
  updateStatus: async (id, status) => {
    try {
      const { data } = await api.patch(`/appointments/${id}/status`, { status });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status';
      return { success: false, error: message };
    }
  },

  /**
   * ADVANCE WORKFLOW STAGE — PUT /appointments/:id/stage
   */
  advanceStage: async (id, stage) => {
    try {
      const { data } = await api.put(`/appointments/${id}/stage`, { stage });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to advance stage';
      return { success: false, error: message };
    }
  },

  /**
   * UPDATE (reschedule) — PUT /appointments/:id
   */
  updateAppointment: async (id, updates) => {
    try {
      const { data } = await api.put(`/appointments/${id}`, updates);
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update appointment';
      return { success: false, error: message };
    }
  },

  /**
   * ASSIGN DOCTOR — PUT /appointments/:id/assign-doctor
   */
  assignDoctor: async (id, doctorId) => {
    try {
      const { data } = await api.put(`/appointments/${id}/assign-doctor`, { doctorId });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to assign doctor';
      return { success: false, error: message };
    }
  },

  /**
   * ASSIGN ASSISTANT — PUT /appointments/:id/assign-assistant
   */
  assignAssistant: async (id, assistantId) => {
    try {
      const { data } = await api.put(`/appointments/${id}/assign-assistant`, { assistantId });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to assign assistant';
      return { success: false, error: message };
    }
  },

  /**
   * ASSIGN HYGIENIST — PUT /appointments/:id/assign-hygienist
   */
  assignHygienist: async (id, hygienistId) => {
    try {
      const { data } = await api.put(`/appointments/${id}/assign-hygienist`, { hygienistId });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? data.data : a
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to assign hygienist';
      return { success: false, error: message };
    }
  },

  /**
   * DELETE — DELETE /appointments/:id
   */
  deleteAppointment: async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
      }));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete appointment';
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));
