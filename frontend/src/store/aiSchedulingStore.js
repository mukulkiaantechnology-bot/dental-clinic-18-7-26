import { create } from 'zustand';

/**
 * AI Scheduling Store
 *
 * NOTE: AI scheduling predictions (no-show risk, patient slot suggestions)
 * require an OPENAI_API_KEY configured on the backend server.
 *
 * When the key is absent, all AI scheduling features are disabled and
 * display "AI service not configured" to the user.
 *
 * Future backend integration points:
 *   POST /ai/predict-noshow   { appointmentId, patientId, history }
 *   POST /ai/suggest-patient  { slot, date, clinicId }
 */
export const useAISchedulingStore = create((_set) => ({
  noShowPredictions: {},
  suggestions: {},
  loading: false,

  // Returns null — caller must show "AI service not configured" message
  predictNoShow: (_appointmentId) => {
    return null;
  },

  // Returns null — caller must show "AI service not configured" message
  suggestPatients: (_slot) => {
    return null;
  }
}));

export default useAISchedulingStore;
