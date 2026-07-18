import { create } from 'zustand';
import { useDentistStore } from './dentistStore';
import api from '../shared/utils/api';

const createDefaultPerioChart = () => {
  const chart = {};
  for (let i = 1; i <= 32; i++) {
    chart[i] = { pocketDepth: 3, bleeding: false, mobility: 0 };
  }
  return chart;
};

const INITIAL_HYGIENE_TEMPLATES = [
  {
    id: 'adult_prophy',
    name: 'Adult Prophylaxis Protocol',
    text: `Medical History: Reviewed. Vitals: Normal. Patient compliant.\nTreatment:\n- Pre-procedural 0.12% Chlorhexidine rinse.\n- Supra & subgingival scaling using ultrasonic scaler & hand scaling.\n- Stain removal using polishing paste.\n- Interdental flossing completed.\n- 5.0% Sodium Fluoride varnish applied.\nOral Hygiene Instructions: Daily flossing emphasized. Return in 6 months.`
  },
  {
    id: 'perio_maint',
    name: 'Periodontal Maintenance Cleaning',
    text: `Medical History: Reviewed. Vitals: Normal.\nTreatment:\n- Conducted complete 6-point perio charting.\n- Localized root scaling on pocketed posterior teeth.\n- Subgingival irrigation with Chlorhexidine rinse.\n- Selective rubber cup polishing.\n- Flossed.\nOral Hygiene Instructions: Electric toothbrush usage reviewed. Re-evaluate perio status in 3 months.`
  },
  {
    id: 'srp',
    name: 'Scaling & Root Planing (SRP)',
    text: `Medical History: Reviewed. Vitals: Normal.\nTreatment:\n- Localized anesthesia administered (1 carpule 2% Lidocaine w/ 1:100k epi).\n- Scaling and root planing (SRP) completed in lower left quadrant.\n- Removal of heavy subgingival calculus deposits.\n- Post-op instructions given. Warned patient of minor sensitivity.\nOral Hygiene Instructions: Warm salt water rinse, soft brush for 48 hours.`
  }
];

export const useHygienistStore = create((set, get) => ({
  patients: [],
  activePatientId: null,
  perioCharts: {},
  riskProfiles: {},
  recalls: [],
  notes: {},
  hygieneTemplates: INITIAL_HYGIENE_TEMPLATES,
  loading: false,
  error: null,

  setActivePatientId: (id) => set({ activePatientId: id }),

  fetchPatients: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/patients');
      if (data.success) {
        const fetchedPatients = data.data;
        const perioCharts = {};
        const riskProfiles = {};

        const safeParse = (str) => {
          if (!str) return null;
          try {
            let parsed = typeof str === 'string' ? JSON.parse(str) : str;
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            return parsed;
          } catch (_e) {
            return null;
          }
        };

        const recalls = fetchedPatients.map(p => {
          let parsedPerio = null;
          if (p.perioChartData) {
            parsedPerio = safeParse(p.perioChartData);
            perioCharts[p.id] = parsedPerio;
          }
          let parsedRisk = null;
          if (p.riskProfileData) {
            parsedRisk = safeParse(p.riskProfileData);
            riskProfiles[p.id] = parsedRisk;
          }
          let status = 'Due';
          let dueBy = new Date();
          dueBy.setMonth(dueBy.getMonth() + 6);
          const hasAppt = p.appointments && p.appointments.length > 0;
          if (hasAppt) {
             const upcoming = p.appointments.some(a => new Date(a.date) >= new Date());
             if (upcoming) status = 'Scheduled';
          }
          // If not scheduled, check if we sent a reminder (stored in parsedRisk)
          if (status !== 'Scheduled' && parsedRisk && parsedRisk.recallStatus) {
            status = parsedRisk.recallStatus;
          }
          return {
            id: p.id,
            patientId: p.id,
            patientName: p.name,
            phone: p.phone,
            frequency: '6 Months',
            lastVisit: p.updatedAt ? p.updatedAt.split('T')[0] : 'N/A',
            dueBy: dueBy.toISOString().split('T')[0],
            status: status
          };
        });
        set({ patients: fetchedPatients, recalls, perioCharts, riskProfiles, error: null });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load patients' });
    } finally {
      set({ loading: false });
    }
  },

  updateToothPerio: async (patientId, toothNum, metrics) => {
    const state = get();
    const patientChart = state.perioCharts[patientId] || createDefaultPerioChart();
    const updatedChart = {
      ...patientChart,
      [toothNum]: {
        ...patientChart[toothNum],
        ...metrics
      }
    };
    
    set((state) => ({
      perioCharts: {
        ...state.perioCharts,
        [patientId]: updatedChart
      }
    }));

    try {
      await api.put(`/patients/${patientId}/perio-chart`, { perioChartData: updatedChart });
    } catch (err) {
      console.error('Failed to update perio chart:', err);
    }
  },

  updateRiskAssessed: async (patientId, classification, riskFactors, aiAdvice) => {
    const riskProfileData = {
      classification,
      lastAssessed: new Date().toISOString().split('T')[0],
      riskFactors,
      aiAdvice
    };

    set((state) => ({
      riskProfiles: {
        ...state.riskProfiles,
        [patientId]: riskProfileData
      }
    }));

    try {
      await api.put(`/patients/${patientId}/risk-profile`, { riskProfileData: JSON.stringify(riskProfileData) });
    } catch (err) {
      console.error('Failed to update risk profile:', err);
    }
  },

  triggerRecallReminder: async (recallId) => {
    const state = get();
    const existing = state.riskProfiles[recallId] || { classification: 'Low', riskFactors: [], aiAdvice: '' };
    const updated = {
      ...existing,
      recallStatus: 'Reminded',
      recallStatusDate: new Date().toISOString().split('T')[0]
    };

    set((state) => ({
      riskProfiles: {
        ...state.riskProfiles,
        [recallId]: updated
      },
      recalls: state.recalls.map((r) =>
        r.id === recallId ? { ...r, status: 'Reminded' } : r
      )
    }));

    try {
      await api.put(`/patients/${recallId}/risk-profile`, { riskProfileData: JSON.stringify(updated) });
    } catch (err) {
      console.error('Failed to update recall reminder status:', err);
    }
  },

  autoScheduleRecall: async (recallId, date) => {
    const state = get();
    const patient = state.patients.find(p => p.id === recallId);
    if (!patient) return;

    const apptData = {
      patientId: recallId,
      patientName: patient.name,
      dentistName: 'Dr. Alex Henderson, DDS',
      date: date,
      time: '10:00',
      duration: 45,
      type: 'Teeth Cleaning',
      notes: 'Auto-booked preventive recall cleaning.',
      assignedTo: 'hygienist'
    };

    try {
      await api.post('/appointments', apptData);
      // Fetch patients again to update the recalls and appointments list from DB
      await get().fetchPatients();
    } catch (err) {
      console.error('Failed to auto-schedule recall appointment:', err);
    }
  },

  saveClinicalNote: async (patientId, text) => {
    try {
      await api.post(`/patients/${patientId}/notes`, { content: text });
      set((state) => ({
        notes: {
          ...state.notes,
          [patientId]: text
        }
      }));
      await useDentistStore.getState().fetchPatientDetails(patientId);
    } catch (err) {
      console.error('Failed to save hygienist clinical note:', err);
    }
  },

  addHygieneTemplate: (tmpl) =>
    set((state) => ({
      hygieneTemplates: [...state.hygieneTemplates, tmpl]
    }))
}));
