import { create } from 'zustand';
import { useDentistStore } from './dentistStore';
import { useBillingStore } from './billingStore';
import api from '../shared/utils/api';

export const useLabStore = create((set, get) => ({
  labCases: [],
  crownCases: [],
  implantCases: [],
  activeCaseId: null,
  loading: false,

  setActiveCaseId: (id) => set({ activeCaseId: id }),

  fetchLabCases: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/lab-cases');
      if (data.success) {
        const fetchedCases = data.data;
        const crownCases = [];
        const implantCases = [];
        const mappedCases = fetchedCases.map(c => {
          if (c.crownDetails) crownCases.push(c.crownDetails);
          if (c.implantDetails) implantCases.push(c.implantDetails);
          return {
            ...c,
            expectedDelivery: c.expectedDelivery ? c.expectedDelivery.split('T')[0] : 'N/A'
          };
        });
        set({ labCases: mappedCases, crownCases, implantCases });
      }
    } catch (err) {
      console.error('Failed to fetch lab cases', err);
    } finally {
      set({ loading: false });
    }
  },

  createLabCase: async (caseData) => {
    try {
      const { data } = await api.post('/lab-cases', caseData);
      if (data.success) {
        const newCase = {
          ...data.data,
          expectedDelivery: data.data.expectedDelivery ? data.data.expectedDelivery.split('T')[0] : 'N/A'
        };
        set((state) => ({
          labCases: [newCase, ...state.labCases],
          crownCases: newCase.crownDetails ? [...state.crownCases, newCase.crownDetails] : state.crownCases,
          implantCases: newCase.implantDetails ? [...state.implantCases, newCase.implantDetails] : state.implantCases,
          activeCaseId: newCase.id
        }));

        // Notify dentist
        const currentNotes = useDentistStore.getState().notes[newCase.patientId] || '';
        const formattedAppend = `\n\n[Lab Case Created - ${new Date().toLocaleDateString()}]\n- Case ID: ${newCase.id}\n- Type: ${newCase.type}\n- Lab: ${newCase.labName}\n- Cost: $${newCase.cost}\n- Expected: ${newCase.expectedDelivery}`;
        useDentistStore.getState().saveClinicalNote(newCase.patientId, currentNotes + formattedAppend);
        
        return newCase.id;
      }
    } catch (err) {
      console.error('Failed to create lab case', err);
    }
    return null;
  },

  updateCaseStatus: async (caseId, status) => {
    try {
      const { data } = await api.put(`/lab-cases/${caseId}/status`, { status });
      if (data.success) {
        set((state) => {
          const updatedCases = state.labCases.map(c => {
            if (c.id === caseId) {
              const nextCase = { ...c, status };
              
              // Notify dentist
              const currentNotes = useDentistStore.getState().notes[nextCase.patientId] || '';
              const formattedAppend = `\n\n[Lab Status Update - ${new Date().toLocaleDateString()}]\n- Case: ${nextCase.type} (${nextCase.id})\n- New Status: ${status}\n- Lab: ${nextCase.labName}`;
              useDentistStore.getState().saveClinicalNote(nextCase.patientId, currentNotes + formattedAppend);

              // Billing
              if (status === 'Delivered') {
                useBillingStore.getState().createInvoice({
                  patientId: nextCase.patientId,
                  patientName: nextCase.patientName,
                  clinicId: 'clinic-1',
                  date: new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  amount: Number(nextCase.cost) || 0,
                  tax: (Number(nextCase.cost) || 0) * 0.05,
                  discount: 0,
                  status: 'Unpaid',
                  items: [
                    { description: `Lab Fees - ${nextCase.type} Fabrication (${nextCase.labName})`, cost: Number(nextCase.cost) || 0 }
                  ]
                });
              }

              return nextCase;
            }
            return c;
          });
          return { labCases: updatedCases };
        });
      }
    } catch (err) {
      console.error('Failed to update case status', err);
    }
  },

  assignToLab: async (caseId, labName, expectedDelivery) => {
    try {
      const { data } = await api.put(`/lab-cases/${caseId}/assign`, { labName, expectedDelivery });
      if (data.success) {
        set((state) => {
          const updated = state.labCases.map(c => {
            if (c.id === caseId) {
              const next = { ...c, labName, expectedDelivery, status: 'Sent' };
              const currentNotes = useDentistStore.getState().notes[next.patientId] || '';
              const formattedAppend = `\n\n[Lab Dispatch - ${new Date().toLocaleDateString()}]\n- Case ID: ${next.id}\n- Dispatched to: ${labName}\n- Est. Delivery: ${expectedDelivery}`;
              useDentistStore.getState().saveClinicalNote(next.patientId, currentNotes + formattedAppend);
              return next;
            }
            return c;
          });
          return { labCases: updated };
        });
      }
    } catch (err) {
      console.error('Failed to assign lab', err);
    }
  },

  updateCrownTracking: async (caseId, crownInfo) => {
    try {
      const { data } = await api.put(`/lab-cases/${caseId}/crown-tracking`, crownInfo);
      if (data.success) {
        set((state) => {
          const exists = state.crownCases.some((c) => c.caseId === caseId);
          const nextCrowns = exists
            ? state.crownCases.map((c) => (c.caseId === caseId ? { ...c, ...crownInfo } : c))
            : [...state.crownCases, { caseId, ...crownInfo }];
          return { crownCases: nextCrowns };
        });
      }
    } catch (err) {
      console.error('Failed to update crown tracking', err);
    }
  },

  updateImplantStage: async (caseId, implantInfo) => {
    try {
      const { data } = await api.put(`/lab-cases/${caseId}/implant-stage`, implantInfo);
      if (data.success) {
        set((state) => {
          const exists = state.implantCases.some((i) => i.caseId === caseId);
          const nextImplants = exists
            ? state.implantCases.map((i) => (i.caseId === caseId ? { ...i, ...implantInfo } : i))
            : [...state.implantCases, { caseId, ...implantInfo }];

          // If implant stage updates to 'Ready' or 'Delivered', keep in sync with case status
          const relatedCase = state.labCases.find((c) => c.id === caseId);
          if (relatedCase && implantInfo.stage) {
            let matchingStatus = relatedCase.status;
            if (implantInfo.stage === 'Ready') matchingStatus = 'Ready';
            if (implantInfo.stage === 'Delivered') matchingStatus = 'Delivered';
            
            if (matchingStatus !== relatedCase.status) {
              setTimeout(() => {
                get().updateCaseStatus(caseId, matchingStatus);
              }, 0);
            }
          }
          return { implantCases: nextImplants };
        });
      }
    } catch (err) {
      console.error('Failed to update implant stage', err);
    }
  },

  markDelivered: async (caseId) => {
    await get().updateCaseStatus(caseId, 'Delivered');
    const isImplant = get().implantCases.some((i) => i.caseId === caseId);
    if (isImplant) {
      await get().updateImplantStage(caseId, { stage: 'Delivered' });
    }
  }
}));
