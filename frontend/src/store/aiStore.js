import { create } from 'zustand';
import api from '../shared/utils/api';

export const useAIStore = create((set) => ({
  // Diagnosis state
  isGeneratingDiagnosis: false,
  diagnosisData: null,
  diagnosisError: null,

  // Treatment Plan state
  isGeneratingTreatment: false,
  treatmentData: null,
  treatmentError: null,

  // Notes Summary state
  isGeneratingSummary: false,
  summaryData: null,
  summaryError: null,

  // Risk Score state
  isScoringRisk: false,
  riskData: null,
  riskError: null,

  // Alerts Analysis state
  isAnalyzingAlerts: false,
  alertsData: null,
  alertsError: null,

  generateDiagnosis: async ({ symptoms, history, age, previousTreatments, notes, patientId, patientName }) => {
    try {
      set({ isGeneratingDiagnosis: true, diagnosisError: null });
      const { data } = await api.post('/ai/diagnosis', {
        symptoms,
        history,
        age: Number(age) || 30,
        previousTreatments,
        notes,
        patientId,
        patientName
      });
      if (data.success) {
        set({ diagnosisData: data.data, diagnosisError: null });
        return { success: true, data: data.data };
      }
      throw new Error(data.message || 'Failed to generate diagnosis');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Diagnosis generation failed';
      set({ diagnosisError: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isGeneratingDiagnosis: false });
    }
  },

  generateTreatmentPlan: async ({ diagnosis, history, notes }) => {
    try {
      set({ isGeneratingTreatment: true, treatmentError: null });
      const { data } = await api.post('/ai/treatment-plan', { diagnosis, history, notes });
      if (data.success) {
        set({ treatmentData: data.data, treatmentError: null });
        return { success: true, data: data.data };
      }
      throw new Error(data.message || 'Failed to generate treatment plan');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Treatment plan generation failed';
      set({ treatmentError: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isGeneratingTreatment: false });
    }
  },

  summarizeNotes: async ({ notes }) => {
    try {
      set({ isGeneratingSummary: true, summaryError: null });
      const { data } = await api.post('/ai/summarize', { notes });
      if (data.success) {
        set({ summaryData: data.data, summaryError: null });
        return { success: true, data: data.data };
      }
      throw new Error(data.message || 'Failed to summarize notes');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Summary generation failed';
      set({ summaryError: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isGeneratingSummary: false });
    }
  },

  calculateRiskScore: async ({ symptoms, history, age }) => {
    try {
      set({ isScoringRisk: true, riskError: null });
      const { data } = await api.post('/ai/risk-score', { symptoms, history, age: Number(age) || 30 });
      if (data.success) {
        set({ riskData: data.data, riskError: null });
        return { success: true, data: data.data };
      }
      throw new Error(data.message || 'Failed to calculate risk score');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Risk scoring failed';
      set({ riskError: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isScoringRisk: false });
    }
  },

  analyzeAlerts: async ({ symptoms, history, patientId, patientName }) => {
    try {
      set({ isAnalyzingAlerts: true, alertsError: null });
      const { data } = await api.post('/ai/alerts/analyze', { symptoms, history, patientId, patientName });
      if (data.success) {
        set({ alertsData: data.data, alertsError: null });
        return { success: true, data: data.data };
      }
      throw new Error(data.message || 'Failed to analyze alerts');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Alerts analysis failed';
      set({ alertsError: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isAnalyzingAlerts: false });
    }
  }
}));

export default useAIStore;
