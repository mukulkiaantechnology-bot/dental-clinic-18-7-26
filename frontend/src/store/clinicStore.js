import { create } from 'zustand';
import api from '../shared/utils/api';

export const useClinicStore = create((set, get) => ({
  clinics: [],
  loading: false,
  selectedClinicId: (() => {
    const saved = localStorage.getItem('hms_selected_clinic_id');
    if (saved) return saved;
    try {
      const authUser = localStorage.getItem('hms_auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        if (user && user.role !== 'super_admin' && user.clinicId) {
          return user.clinicId;
        }
      }
    } catch { /* ignore localStorage parse errors */ }
    return '';
  })(),
  setSelectedClinicId: (id) => {
    localStorage.setItem('hms_selected_clinic_id', id);
    set({ selectedClinicId: id });
  },
  fetchClinics: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/auth/public-clinics');
      const clinics = data.data || [];
      set({ clinics, loading: false });
      
      const { useAuthStore } = await import('./authStore');
      const user = useAuthStore.getState().user;
      
      if (user && user.role === 'super_admin') {
        if (!get().selectedClinicId || get().selectedClinicId === '') {
          get().setSelectedClinicId('all');
        }
      } else {
        if (clinics.length > 0 && (!get().selectedClinicId || get().selectedClinicId === 'all')) {
          get().setSelectedClinicId(clinics[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
      set({ loading: false });
    }
  },
  getClinicName: (id) => {
    if (id === 'all') return 'All Clinics (Global)';
    const clinic = get().clinics.find((c) => c.id === id);
    return clinic ? clinic.name : 'Unknown Clinic';
  }
}));
