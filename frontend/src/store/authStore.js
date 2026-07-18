import { create } from 'zustand';
import api from '../shared/utils/api';

// ─── PERSISTED USER ───────────────────────────────────────────────────────────
const getInitialState = () => {
  try {
    const saved = localStorage.getItem('hms_auth_user');
    const token = localStorage.getItem('hms_access_token');
    if (saved && token) {
      return { user: JSON.parse(saved), isAuthenticated: true, loading: false, error: null };
    }
  } catch {
    // Ignore parse errors
  }
  return { user: null, isAuthenticated: false, loading: false, error: null };
};

export const useAuthStore = create((set, _get) => ({
  ...getInitialState(),

  /**
   * LOGIN — calls POST /auth/login
   * Returns { success, role, clinicId } for navigation
   */
  loginWithCredentials: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });

      const { accessToken, user } = data.data;

      // Persist
      localStorage.setItem('hms_access_token', accessToken);
      localStorage.setItem('hms_auth_user', JSON.stringify(user));

      if (user.role === 'super_admin') {
        localStorage.setItem('hms_selected_clinic_id', 'all');
        import('./clinicStore').then(({ useClinicStore }) => {
          useClinicStore.setState({ selectedClinicId: 'all' });
        }).catch(() => {});
      } else {
        localStorage.setItem('hms_selected_clinic_id', user.clinicId || '');
        import('./clinicStore').then(({ useClinicStore }) => {
          useClinicStore.setState({ selectedClinicId: user.clinicId || '' });
        }).catch(() => {});
      }

      set({ user, isAuthenticated: true, loading: false, error: null });

      return { success: true, role: user.role, clinicId: user.clinicId };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * LOGOUT — clears local state FIRST (synchronous), then revokes token in background.
   * Token is captured BEFORE clearing localStorage so the background API
   * call can still send a valid Authorization header to the server.
   */
  logout: () => {
    // 1. Capture token BEFORE removing it
    const token = localStorage.getItem('hms_access_token');

    // 2. Instantly clear local state (synchronous) — UI redirects immediately
    localStorage.removeItem('hms_access_token');
    localStorage.removeItem('hms_auth_user');
    localStorage.removeItem('hms_selected_clinic_id');
    import('./clinicStore').then(({ useClinicStore }) => {
      useClinicStore.setState({ selectedClinicId: '' });
    }).catch(() => {});
    set({ user: null, isAuthenticated: false, loading: false, error: null });

    // 3. Best-effort server-side refresh token revocation (background)
    //    Manually attach captured token — localStorage is already cleared
    if (token) {
      import('../shared/utils/api').then(({ default: api }) => {
        api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {
          // Ignore errors — local state is already cleared, logout is complete
        });
      });
    }
  },

  /**
   * REFRESH ME — re-fetch user profile from backend (call on app init)
   */
  fetchMe: async () => {
    const token = localStorage.getItem('hms_access_token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      const user = data.data;
      localStorage.setItem('hms_auth_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      // Token invalid — clear state
      localStorage.removeItem('hms_access_token');
      localStorage.removeItem('hms_auth_user');
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
