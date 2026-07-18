import { create } from 'zustand';
import api from '../shared/utils/api';

export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http') || fileUrl.startsWith('data:')) return fileUrl;
  return `${API_ORIGIN}${fileUrl}`;
};

const createDefaultOdontogram = () => {
  const chart = {};
  for (let i = 1; i <= 32; i++) {
    chart[i] = 'Healthy';
  }
  return chart;
};

const INITIAL_DRUGS = [
  { value: 'Amoxicillin', label: 'Amoxicillin 500mg (Antibiotic)' },
  { value: 'Lidocaine + Epinephrine', label: 'Lidocaine 2% with 1:100k Epinephrine (Local Anesthetic)' },
  { value: 'Mepivacaine 3% Plain', label: 'Mepivacaine 3% Plain (Carbocaine - Epinephrine Free)' },
  { value: 'Prilocaine 4% Plain', label: 'Prilocaine 4% Plain (Citanest - Epinephrine Free)' },
  { value: 'Ibuprofen', label: 'Ibuprofen 600mg (NSAID)' },
  { value: 'Clindamycin', label: 'Clindamycin 300mg (Penicillin-Allergy Alternative)' },
  { value: 'Azithromycin', label: 'Azithromycin 250mg (Penicillin-Allergy Alternative)' },
  { value: 'Acetaminophen', label: 'Acetaminophen 500mg (Analgesic)' }
];

const INITIAL_CLINICAL_TEMPLATES = [
  { id: 'exam', label: 'Standard Hygiene Exam', text: 'HYGIENE EXAM:\n- Plaque Index: Normal\n- Gingiva: Healthy pink\n- Calculus: Light\n- Recommendation: Prophylaxis and 6 months recall' },
  { id: 'rct', label: 'Endodontic Root Canal', text: 'RCT PROCEDURE:\n- Diagnosis: Irreversible Pulpitis\n- Anesthesia: Lidocaine block\n- Access: Occlusal opening\n- Irrigation: NaOCl debridement' }
];

const INITIAL_PROCEDURE_ITEMS = [
  { value: 'Scaling', label: 'Dental Scaling & Prophylaxis', defaultCost: 150 },
  { value: 'RCT', label: 'Root Canal Therapy (RCT)', defaultCost: 900 },
  { value: 'Crown', label: 'Porcelain/Zirconia Crown', defaultCost: 1200 },
  { value: 'Implant', label: 'Titanium Dental Implant', defaultCost: 2500 },
  { value: 'Extraction', label: 'Simple Extraction', defaultCost: 200 }
];


export const useDentistStore = create((set, get) => ({
  patients: [],
  activePatientId: null,
  odontograms: {},
  treatmentPlans: {},
  xrays: {},
  prescriptions: {},
  notes: {},
  clinicalNotes: {},
  beforeImages: {},
  afterImages: {},
  signatures: {},
  drugs: INITIAL_DRUGS,
  clinicalTemplates: INITIAL_CLINICAL_TEMPLATES,
  procedureItems: INITIAL_PROCEDURE_ITEMS,
  loading: false,
  error: null,

  // Set active patient session context
  setActivePatientId: (id) => set({ activePatientId: id }),

  // Fetch patients list from backend API
  fetchPatients: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/patients');
      if (data.success) {
        set({ patients: data.data, error: null });
      }
      await get().fetchCustomItems();
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load patients' });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch complete patient details including sub-resources
  fetchPatientDetails: async (patientId) => {
    try {
      set({ loading: true });
      const { data } = await api.get(`/patients/${patientId}`);
      if (data.success) {
        const patient = data.data;

        let chart = createDefaultOdontogram();
        if (patient.odontogram && patient.odontogram.chartData) {
          let rawChart = patient.odontogram.chartData;
          while (typeof rawChart === 'string') {
            try {
              rawChart = JSON.parse(rawChart);
            } catch { break; }
          }
          if (rawChart && typeof rawChart === 'object') {
            chart = rawChart;
          }
        }

         set((state) => ({
          odontograms: { ...state.odontograms, [patientId]: chart },
          treatmentPlans: { ...state.treatmentPlans, [patientId]: patient.treatmentPlans || [] },
          xrays: { ...state.xrays, [patientId]: patient.xrayFiles || [] },
          prescriptions: { ...state.prescriptions, [patientId]: patient.prescriptions || [] },
          notes: { ...state.notes, [patientId]: patient.clinicalNotes && patient.clinicalNotes.length > 0 ? patient.clinicalNotes[patient.clinicalNotes.length - 1].content : '' },
          clinicalNotes: { ...state.clinicalNotes, [patientId]: patient.clinicalNotes || [] },
          beforeImages: { ...state.beforeImages, [patientId]: patient.beforeImage || '' },
          afterImages: { ...state.afterImages, [patientId]: patient.afterImage || '' },
          signatures: { ...state.signatures, [patientId]: patient.signature || '' },
          error: null
        }));
        await get().fetchCustomItems();
      }
    } catch (err) {
      console.error('Failed to fetch patient details:', err);
      set({ error: 'Failed to fetch clinical records' });
    } finally {
      set({ loading: false });
    }
  },

  // Charting Actions
  updateToothCondition: async (patientId, toothNum, condition) => {
    let patientChart = get().odontograms[patientId] || createDefaultOdontogram();

    // Ensure patientChart is a clean JS object
    while (typeof patientChart === 'string') {
      try {
        patientChart = JSON.parse(patientChart);
      } catch { patientChart = createDefaultOdontogram(); break; }
    }

    const updatedChart = { ...patientChart, [toothNum]: condition };

    try {
      await api.put(`/patients/${patientId}/odontogram`, { chartData: updatedChart });
      set((state) => ({
        odontograms: { ...state.odontograms, [patientId]: updatedChart }
      }));
    } catch (err) {
      console.error('Failed to update tooth condition:', err);
    }
  },

  // Treatment Plan Actions
  addProcedure: async (patientId, proc) => {
    try {
      const { data } = await api.post(`/patients/${patientId}/treatment-plans`, {
        tooth: proc.tooth,
        procedure: proc.procedure,
        cost: proc.cost,
        status: 'Proposed'
      });
      const newProc = data.data;
      set((state) => {
        const patientProcs = state.treatmentPlans[patientId] || [];
        return {
          treatmentPlans: {
            ...state.treatmentPlans,
            [patientId]: [...patientProcs, newProc]
          }
        };
      });
    } catch (err) {
      console.error('Failed to add procedure:', err);
    }
  },

  updateProcedureStatus: async (patientId, procId, status) => {
    try {
      const { data } = await api.put(`/patients/${patientId}/treatment-plans/${procId}`, { status });
      const updatedProc = data.data;
      set((state) => {
        const patientProcs = state.treatmentPlans[patientId] || [];
        return {
          treatmentPlans: {
            ...state.treatmentPlans,
            [patientId]: patientProcs.map((p) => (p.id === procId ? updatedProc : p))
          }
        };
      });
    } catch (err) {
      console.error('Failed to update procedure status:', err);
    }
  },

  deleteProcedure: async (patientId, procId) => {
    try {
      await api.delete(`/patients/${patientId}/treatment-plans/${procId}`);
      set((state) => {
        const patientProcs = state.treatmentPlans[patientId] || [];
        return {
          treatmentPlans: {
            ...state.treatmentPlans,
            [patientId]: patientProcs.filter((p) => p.id !== procId)
          }
        };
      });
    } catch (err) {
      console.error('Failed to delete procedure:', err);
    }
  },

  // X-Rays Actions
  addXray: async (patientId, xrayFile, fileBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', fileBlob);
      formData.append('type', xrayFile.type || 'General');
      formData.append('notes', xrayFile.notes || 'Manually uploaded radiograph file.');
      const { data } = await api.post(`/patients/${patientId}/xrays`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newXray = data.data;
      set((state) => {
        const patientXrays = state.xrays[patientId] || [];
        return {
          xrays: {
            ...state.xrays,
            [patientId]: [...patientXrays, newXray]
          }
        };
      });
      return { success: true, data: newXray };
    } catch (err) {
      console.error('Failed to add xray:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to upload x-ray' };
    }
  },

  updateXrayAIResult: async (patientId, xrayId, aiReport) => {
    try {
      const { data } = await api.put(`/patients/${patientId}/xrays/${xrayId}`, {
        isScanned: true,
        aiReport,
      });
      const updatedXray = data.data;
      set((state) => {
        const patientXrays = state.xrays[patientId] || [];
        return {
          xrays: {
            ...state.xrays,
            [patientId]: patientXrays.map((x) =>
              x.id === xrayId ? updatedXray : x
            ),
          },
        };
      });
    } catch (err) {
      console.error('Failed to update xray AI result:', err);
    }
  },

  // Prescriptions Actions
  addPrescription: async (patientId, rx) => {
    try {
      const { data } = await api.post(`/patients/${patientId}/prescriptions`, rx);
      const newRx = data.data;
      set((state) => {
        const patientRxs = state.prescriptions[patientId] || [];
        return {
          prescriptions: {
            ...state.prescriptions,
            [patientId]: [...patientRxs, newRx]
          }
        };
      });
    } catch (err) {
      console.error('Failed to add prescription:', err);
    }
  },

  deletePrescription: async (patientId, rxId) => {
    try {
      await api.delete(`/patients/${patientId}/prescriptions/${rxId}`);
      set((state) => {
        const patientRxs = state.prescriptions[patientId] || [];
        return {
          prescriptions: {
            ...state.prescriptions,
            [patientId]: patientRxs.filter((r) => r.id !== rxId)
          }
        };
      });
    } catch (err) {
      console.error('Failed to delete prescription:', err);
    }
  },

  // Notes Actions
  saveClinicalNote: async (patientId, text) => {
    try {
      await api.post(`/patients/${patientId}/notes`, { content: text });
      set((state) => ({
        notes: {
          ...state.notes,
          [patientId]: text
        }
      }));
      await get().fetchPatientDetails(patientId);
    } catch (err) {
      console.error('Failed to save clinical note:', err);
    }
  },

  consentForms: {},

  fetchConsentForms: async (patientId) => {
    try {
      const { data } = await api.get(`/patients/${patientId}/consent-forms`);
      if (data.success) {
        set((state) => ({
          consentForms: { ...state.consentForms, [patientId]: data.data }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch consent forms:', err);
    }
  },

  createConsentForm: async (patientId, { patientName, type, content }) => {
    try {
      const { data } = await api.post(`/patients/${patientId}/consent-forms`, { patientName, type, content });
      if (data.success) {
        await get().fetchConsentForms(patientId);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to create consent form:', err);
    }
    return null;
  },

  updateConsentForm: async (patientId, consentId, { signature, status, signedAt }) => {
    try {
      const { data } = await api.put(`/patients/${patientId}/consent-forms/${consentId}`, { signature, status, signedAt });
      if (data.success) {
        await get().fetchConsentForms(patientId);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to sign consent form:', err);
    }
    return null;
  },

  fetchProcedureTemplates: async () => {
    try {
      const { data } = await api.get('/patients/procedure-templates');
      if (data.success) {
        // Merge with initial templates if needed, or overwrite. Let's merge so we don't break existing mock/initial ones
        const merged = [...INITIAL_CLINICAL_TEMPLATES];
        data.data.forEach(t => {
          if (!merged.some(m => m.id === t.id || m.label === t.title)) {
            merged.push({ id: t.id, label: t.title, text: t.content });
          }
        });
        set({ clinicalTemplates: merged });
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  },

  createProcedureTemplate: async ({ title, content }) => {
    try {
      const { data } = await api.post('/patients/procedure-templates', { title, content });
      if (data.success) {
        await get().fetchProcedureTemplates();
      }
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  },

  deleteProcedureTemplate: async (templateId) => {
    try {
      await api.delete(`/patients/procedure-templates/${templateId}`);
      await get().fetchProcedureTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  },

  fetchCustomItems: async () => {
    try {
      const [procRes, drugRes] = await Promise.all([
        api.get('/patients/custom-procedures'),
        api.get('/patients/custom-drugs')
      ]);

      if (procRes.data.success && drugRes.data.success) {
        const mergedProcedures = [...INITIAL_PROCEDURE_ITEMS];
        procRes.data.data.forEach(p => {
          if (!mergedProcedures.some(item => item.value === p.value)) {
            mergedProcedures.push({
              value: p.value,
              label: p.label,
              defaultCost: p.defaultCost
            });
          }
        });

        const mergedDrugs = [...INITIAL_DRUGS];
        drugRes.data.data.forEach(d => {
          if (!mergedDrugs.some(item => item.value === d.value)) {
            mergedDrugs.push({
              value: d.value,
              label: d.label
            });
          }
        });

        set({
          procedureItems: mergedProcedures,
          drugs: mergedDrugs
        });
      }
    } catch (err) {
      console.error('Failed to fetch custom items:', err);
    }
  },

  uploadBeforeImage: async (patientId, beforeImage) => {
    try {
      await api.put(`/patients/${patientId}`, { beforeImage });
      set((state) => ({
        beforeImages: { ...state.beforeImages, [patientId]: beforeImage }
      }));
    } catch (err) {
      console.error('Failed to upload before image:', err);
      throw err;
    }
  },

  uploadAfterImage: async (patientId, afterImage) => {
    try {
      await api.put(`/patients/${patientId}`, { afterImage });
      set((state) => ({
        afterImages: { ...state.afterImages, [patientId]: afterImage }
      }));
    } catch (err) {
      console.error('Failed to upload after image:', err);
      throw err;
    }
  },
  savePatientSignature: async (patientId, signature) => {
    try {
      await api.put(`/patients/${patientId}`, { signature });
      set((state) => ({
        signatures: { ...state.signatures, [patientId]: signature }
      }));
    } catch (err) {
      console.error('Failed to save patient signature:', err);
      throw err;
    }
  },
  updateXrayAnnotations: (patientId, xrayId, annotationsData) => {
    set((state) => {
      const patientXrays = state.xrays[patientId] || [];
      return {
        xrays: {
          ...state.xrays,
          [patientId]: patientXrays.map((x) =>
            x.id === xrayId ? { ...x, annotationsData } : x
          )
        }
      };
    });
  },

  // Custom Adding Actions
  addDrug: async (drug) => {
    set((state) => {
      if (state.drugs.some(d => d.value === drug.value)) return {};
      return { drugs: [...state.drugs, drug] };
    });
    try {
      await api.post('/patients/custom-drugs', {
        value: drug.value,
        label: drug.label
      });
    } catch (err) {
      console.error('Failed to add custom drug:', err);
    }
  },

  addClinicalTemplate: (tmpl) =>
    set((state) => ({
      clinicalTemplates: [...state.clinicalTemplates, tmpl]
    })),

  addProcedureItem: async (proc) => {
    set((state) => {
      if (state.procedureItems.some(p => p.value === proc.value)) return {};
      return { procedureItems: [...state.procedureItems, proc] };
    });
    try {
      await api.post('/patients/custom-procedures', {
        value: proc.value,
        label: proc.label,
        defaultCost: proc.defaultCost
      });
    } catch (err) {
      console.error('Failed to add custom procedure item:', err);
    }
  }
}));
