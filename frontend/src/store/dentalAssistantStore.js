import { create } from 'zustand';
import { useDentistStore } from './dentistStore';
import api from '../shared/utils/api';

export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const DEFAULT_CHAIRSIDE_TASKS = [
  { id: 'ster-1', category: 'Sterilization', text: 'Sanitize and prep treatment chair', completed: false },
  { id: 'ster-2', category: 'Sterilization', text: 'Autoclave dental mirrors and explorers', completed: false },
  { id: 'ster-3', category: 'Sterilization', text: 'Place protective barriers on handles and switches', completed: false },
  { id: 'ster-4', category: 'Sterilization', text: 'Dispose of biohazard waste from previous session', completed: false },
  { id: 'inst-1', category: 'Instrument', text: 'Confirm high-speed handpiece is clean and tracked', completed: false },
  { id: 'inst-2', category: 'Instrument', text: 'Set up high-volume evacuator (suction) tips', completed: false },
  { id: 'inst-3', category: 'Instrument', text: 'Lay out composite restorative materials and curing light', completed: false },
  { id: 'inst-4', category: 'Instrument', text: 'Prepare articulating paper and polishing burs', completed: false },
  { id: 'stage-1', category: 'Stage', text: 'Review patient medical history & vitals', completed: false },
  { id: 'stage-2', category: 'Stage', text: 'Assist dentist during procedure', completed: false },
  { id: 'stage-3', category: 'Stage', text: 'Review post-op care instructions with patient', completed: false },
];

const INITIAL_QUICK_TEMPLATES = [
  { id: 'cleaning', label: 'Hygiene / Cleaning', text: 'Pre-procedural chlorhexidine rinse administered. Conducted intake and vitals audit. Assisted dentist during scaling and fine paste prophy polishing. Flossed. Pt advised on interproximal cleaning.' },
  { id: 'surgery', label: 'Surgical Assist', text: 'Assisted in local anesthesia administration (Lidocaine block). Maintained high-volume suction and tongue/cheek retraction during extraction. Monitored vital signs. Placed sterile gauze post-op.' },
  { id: 'xray', label: 'Radiograph Obs', text: 'Conducted panoramic and right bitewing scan series. Scans uploaded to patient record. Noted slight bone recession on posterior molar region, flagged for dentist diagnostic review.' },
];

const INITIAL_ASSISTANT_ACTIONS = [
  { key: 'sterilization', label: 'Sterilization completed' },
  { key: 'instruments', label: 'Instruments prepped' },
  { key: 'suction', label: 'Suction maintained' },
  { key: 'briefing', label: 'Patient post-op briefing' },
];

const INITIAL_XRAY_CLASSIFICATIONS = ['Bitewing', 'Panoramic', 'Periapical', 'CBCT'];

export const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http') || fileUrl.startsWith('data:')) return fileUrl;
  return `${API_ORIGIN}${fileUrl}`;
};

export const useDentalAssistantStore = create((set, get) => ({
  todayPatients: [],
  activePatientId: null,
  chairsideSessions: {},
  xrayClassifications: INITIAL_XRAY_CLASSIFICATIONS,
  quickTemplates: INITIAL_QUICK_TEMPLATES,
  assistantActions: INITIAL_ASSISTANT_ACTIONS,

  setActivePatientId: (id) => set({ activePatientId: id }),

  fetchTodayPatients: async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: apptRes } = await api.get('/appointments', { params: { date: todayStr } });
      const appts = apptRes.success ? apptRes.data : [];

      const { data: patRes } = await api.get('/patients');
      const patients = patRes.success ? patRes.data : [];

      const todayPats = appts.map((appt) => {
        const pat = patients.find((p) => p.id === appt.patientId) || {};
        return {
          id: appt.patientId,
          appointmentId: appt.id,
          name: appt.patientName,
          age: pat.age || 30,
          dentistName: appt.dentistName,
          treatmentType: appt.type,
          status: appt.status,
        };
      });

      const uniquePats = [];
      const seen = new Set();
      for (const p of todayPats) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          uniquePats.push(p);
        }
      }

      set({ todayPatients: uniquePats });
    } catch (err) {
      console.error('Failed to fetch assistant today patients:', err);
    }
  },

  updatePatientStatus: (patientId, status) =>
    set((state) => ({
      todayPatients: state.todayPatients.map((p) =>
        p.id === patientId ? { ...p, status } : p
      ),
    })),

  fetchChairsideSession: async (appointmentId) => {
    if (!appointmentId) return null;
    try {
      const { data } = await api.get(`/appointments/${appointmentId}/chairside`);
      if (data.success) {
        set((state) => ({
          chairsideSessions: {
            ...state.chairsideSessions,
            [appointmentId]: data.data,
          },
        }));
        return data.data;
      }
    } catch (err) {
      console.error('Failed to fetch chairside session:', err);
    }
    return null;
  },

  saveChairsideSession: async (appointmentId, payload) => {
    if (!appointmentId) return { success: false };
    try {
      const { data } = await api.put(`/appointments/${appointmentId}/chairside`, payload);
      if (data.success) {
        set((state) => ({
          chairsideSessions: {
            ...state.chairsideSessions,
            [appointmentId]: data.data,
          },
        }));
        return { success: true, data: data.data };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save chairside session';
      return { success: false, error: message };
    }
    return { success: false, error: 'Failed to save chairside session' };
  },

  toggleTaskStatus: async (appointmentId, taskId) => {
    const session = get().chairsideSessions[appointmentId];
    if (!session) return { success: false };

    const updatedTasks = (session.tasks || DEFAULT_CHAIRSIDE_TASKS).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    set((state) => ({
      chairsideSessions: {
        ...state.chairsideSessions,
        [appointmentId]: { ...session, tasks: updatedTasks },
      },
    }));

    return get().saveChairsideSession(appointmentId, {
      tasks: updatedTasks,
      activeStage: session.activeStage,
      timerSeconds: session.timerSeconds,
      timerRunning: session.timerRunning,
    });
  },

  uploadXray: async (patientId, xrayInfo, file) => {
    if (!file) {
      return { success: false, error: 'File is required' };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', xrayInfo.type || 'General');
      formData.append('notes', xrayInfo.notes || '');

      const { data } = await api.post(`/patients/${patientId}/xrays`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        await useDentistStore.getState().fetchPatientDetails(patientId);
        return { success: true, data: data.data };
      }
      return { success: false, error: 'Upload failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload X-ray';
      return { success: false, error: message };
    }
  },

  saveAssistantNote: async (patientId, noteData) => {
    const formattedNote = `[Assistant Prep Note]
Procedure: ${noteData.procedureType || 'General Treatment'}
Observations: ${noteData.observations || ''}
Actions Taken: ${(noteData.actions || []).join(', ')}`;

    try {
      const { data } = await api.post(`/patients/${patientId}/notes`, { content: formattedNote });
      if (data.success) {
        await useDentistStore.getState().fetchPatientDetails(patientId);
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to save assistant note to backend:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to save note' };
    }
  },

  addXrayClassification: (name) =>
    set((state) => ({
      xrayClassifications: [...state.xrayClassifications, name],
    })),

  addQuickTemplate: (tmpl) =>
    set((state) => ({
      quickTemplates: [...state.quickTemplates, tmpl],
    })),

  addAssistantAction: (act) =>
    set((state) => ({
      assistantActions: [...state.assistantActions, act],
    })),
}));
