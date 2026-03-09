import axios from "axios";

const api = axios.create({
  // In dev, use Vite proxy (same-origin) to avoid CORS/preflight issues.
  // In prod, point at your deployed API via VITE_API_BASE_URL.
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth";
    }
    // Re-throw so individual service calls can still catch errors
    return Promise.reject(error);
  },
);

export default api;
