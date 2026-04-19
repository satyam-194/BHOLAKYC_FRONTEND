/**
 * API origin: production uses the same host as the SPA (apex or www).
 * Dev targets the local backend. Set VITE_API_BASE_URL to override (e.g. CI).
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5001';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://coinora.in';
}

export const API_BASE = getApiBase();
