import { create } from 'zustand';
import api from '../shared/utils/api';

export const useAINotesStore = create((set) => ({
  isGenerating: false,

  /**
   * Generate a clinical SOAP note via the backend AI service.
   * Requires OPENAI_API_KEY to be configured on the server.
   * Returns the generated note string on success, or null on failure.
   */
  generateNote: async (contextData) => {
    set({ isGenerating: true });
    try {
      const { data } = await api.post('/ai/summarize', {
        notes: contextData?.existingNotes || '',
        treatmentType: contextData?.treatmentType || '',
        patientName: contextData?.patientName || '',
        symptoms: contextData?.symptoms || '',
        history: contextData?.history || ''
      });

      if (data.success && data.data) {
        set({ isGenerating: false });
        return data.data.summary || data.data;
      }

      set({ isGenerating: false });
      return null;
    } catch (err) {
      set({ isGenerating: false });
      // Surface AI-not-configured state to caller cleanly
      if (err.response?.status === 503 || err.response?.data?.message?.includes('not configured')) {
        return '__AI_NOT_CONFIGURED__';
      }
      console.error('[AI Notes] Failed to generate note:', err.message);
      return null;
    }
  }
}));

export default useAINotesStore;
