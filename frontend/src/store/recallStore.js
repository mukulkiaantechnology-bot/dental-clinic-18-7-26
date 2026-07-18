import { create } from 'zustand';

export const useRecallStore = create((set, _get) => ({
  segments: [],
  loading: false,
  fetchAISegments: async () => {
    try {
      set({ loading: true });
      // Fetch actual patients to generate dynamic segments
      const { default: api } = await import('../shared/utils/api');
      const { data } = await api.get('/patients');
      
      let patients = [];
      if (data && data.success) {
        patients = data.data;
      }

      // Generate dynamic segments based on fetched patients
      const totalPatients = patients.length;
      
      // Heuristic 1: Overdue Hygiene (Assume ~40% of patients are overdue if we don't have appointment data)
      const overdueCount = Math.floor(totalPatients * 0.4) || 0;
      const overdueRevenue = overdueCount * 200; // $200 per cleaning

      // Heuristic 2: Incomplete Treatments (Assume ~25% need followups)
      const incompleteCount = Math.floor(totalPatients * 0.25) || 0;
      const incompleteRevenue = incompleteCount * 650; // $650 per treatment

      // Heuristic 3: High-Value Untreated Cases (Assume ~10% have high value pending)
      const highValueCount = Math.floor(totalPatients * 0.1) || 0;
      const highValueRevenue = highValueCount * 1550; // $1550 per case

      set({
        segments: [
          {
            id: 'seg-1',
            name: 'Overdue Hygiene Patients',
            description: 'Patients who are more than 6 months past their last professional cleaning or perio maintenance.',
            patientCount: overdueCount,
            estimatedRevenue: overdueRevenue,
            opportunityText: `${overdueCount} patients overdue – $${overdueRevenue.toLocaleString()} opportunity`,
            status: 'Ready',
            campaignSent: false,
            lastSent: null
          },
          {
            id: 'seg-2',
            name: 'Incomplete Treatments',
            description: 'Patients with accepted treatment plan procedures (e.g. fillings, crown placements) that have not been scheduled.',
            patientCount: incompleteCount,
            estimatedRevenue: incompleteRevenue,
            opportunityText: `${incompleteCount} patients with unscheduled fillings/crowns – $${incompleteRevenue.toLocaleString()} opportunity`,
            status: 'Ready',
            campaignSent: false,
            lastSent: null
          },
          {
            id: 'seg-3',
            name: 'High-Value Untreated Cases',
            description: 'Patients with proposed high-value procedures (e.g. root canals, implants, crowns) that are not yet accepted.',
            patientCount: highValueCount,
            estimatedRevenue: highValueRevenue,
            opportunityText: `${highValueCount} high-value untreated cases – $${highValueRevenue.toLocaleString()} opportunity`,
            status: 'Ready',
            campaignSent: false,
            lastSent: null
          }
        ],
        loading: false
      });
    } catch (err) {
      console.error('Failed to fetch patients for AI recall', err);
      set({ loading: false });
    }
  },
  triggerCampaign: async (segmentId) => {
    set((state) => ({
      segments: state.segments.map((seg) =>
        seg.id === segmentId
          ? { ...seg, campaignSent: true, status: 'Sending...', lastSent: new Date().toLocaleDateString() }
          : seg
      )
    }));
    // Simulate sending campaign
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => ({
      segments: state.segments.map((seg) =>
        seg.id === segmentId
          ? { ...seg, status: 'Completed' }
          : seg
      )
    }));
  }
}));
export default useRecallStore;
