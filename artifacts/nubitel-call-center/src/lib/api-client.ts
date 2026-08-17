export type ApiError = { status: number; message: string; fieldErrors?: Record<string, string> };
const envBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const apiBaseUrl = () => localStorage.getItem('nubitel-api-base') || envBase;
export const isMockEnabled = () => localStorage.getItem('nubitel-mock') !== 'false' && import.meta.env.VITE_USE_MOCK_API !== 'false';
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw { status: response.status, message: body?.message || body?.error || `Request failed (${response.status})`, fieldErrors: body?.fieldErrors } satisfies ApiError;
    return body as T;
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error) throw error;
    throw { status: 0, message: 'Network unavailable. Check the API base URL and connection.' } satisfies ApiError;
  }
}
export const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));