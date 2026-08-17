export type ApiError = { status: number; message: string; fieldErrors?: Record<string, string> };
const envBase = import.meta.env.VITE_API_BASE_URL || 'https://cxdev-dialplan-api.nubitel.io';
const campaignsEnvBase = import.meta.env.VITE_CAMPAIGNS_API_BASE_URL || 'http://localhost:5050';
export const apiBaseUrl = () => localStorage.getItem('nubitel-api-base') || envBase;
export const isMockEnabled = () => localStorage.getItem('nubitel-mock') !== 'false' && import.meta.env.VITE_USE_MOCK_API !== 'false';
async function requestFrom<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: 'omit', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw { status: response.status, message: body?.message || body?.error || `Request failed (${response.status})`, fieldErrors: body?.fieldErrors } satisfies ApiError;
    return body as T;
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error) throw error;
    throw { status: 0, message: 'Network unavailable. Check the API base URL and connection.' } satisfies ApiError;
  }
}
export const request = <T>(path: string, init?: RequestInit) => requestFrom<T>(apiBaseUrl(), path, init);
export const campaignsRequest = <T>(path: string, init?: RequestInit) => requestFrom<T>(campaignsEnvBase, path, init);
export const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));
