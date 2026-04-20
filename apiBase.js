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

/**
 * Public files under /storage/ (images, PDFs, videos) are always served from the
 * canonical app host. Using this avoids broken previews when the SPA is opened on
 * www vs apex or another subdomain. Set VITE_STORAGE_BASE_URL to override.
 */
export function getStorageBase() {
  const fromEnv = import.meta.env.VITE_STORAGE_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return getApiBase();
  return 'https://coinora.in';
}

export const API_BASE = getApiBase();
export const STORAGE_BASE = getStorageBase();
