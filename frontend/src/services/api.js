import axios from 'axios';

// Create Axios client — uses VITE_BASE_URL environment variable for production (Vercel)
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('incubein_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor: Catch auth failures globally ───────────────
// Instead of hard-redirecting on 401/403 (which causes a page flash and
// loses React state), we dispatch a custom 'sessionExpired' window event.
// AuthContext listens for this event and renders the AuthErrorModal overlay
// non-destructively, keeping the dashboard UI intact beneath it.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      console.warn(`[api] ${status} detected — dispatching sessionExpired event.`);

      // ── Dispatch global event to trigger AuthContext modal ───────────
      window.dispatchEvent(new CustomEvent('sessionExpired', {
        detail: { status, url: error.config?.url }
      }));

      // ── Clear the stale JWT token from storage ───────────────────────
      localStorage.removeItem('incubein_token');
    }

    // ── Always reject so individual catch blocks can handle gracefully ─
    return Promise.reject(error);
  }
);

export default api;
