// Client for the read-only CDR viewer API of the dialplan manager
// (docs/cdr-viewer-api.md in nubitel-dialplan-manager). One fixed login returns a
// bearer token; the token lives in sessionStorage so closing the tab signs out.

export type CdrItem = {
  uuid: string;
  leg: string | null;
  direction: string | null;
  domain_name: string | null;
  caller_id_name: string | null;
  caller_id_number: string | null;
  caller_destination: string | null;
  destination_number: string | null;
  start_stamp: string | null;
  answer_stamp: string | null;
  end_stamp: string | null;
  duration: number | null;
  billsec: number | null;
  hangup_cause: string | null;
  missed_call: boolean | null;
  has_recording: boolean;
  record_path: string | null;
  record_name: string | null;
  cc_queue: string | null;
  cc_side: string | null;
  cc_agent: string | null;
  extension_uuid: string | null;
};

export type CdrList = { total: number; limit: number; offset: number; from: string; to: string; items: CdrItem[] };

export type CdrRecording = { available: boolean; interaction_id: string; path: string | null; name: string | null };

export type CdrDetail = {
  record: Record<string, unknown> & { xml_cdr_uuid: string };
  recording: CdrRecording;
  legs: CdrItem[];
};

export type CdrFilters = {
  from?: string;
  to?: string;
  number?: string;
  direction?: string;
  answered?: string; // "true" | "false" | ""
  missed?: string;
  has_recording?: string;
  hangup_cause?: string;
  queue?: string;
  agent?: string;
  domain?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export class CdrApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TOKEN_KEY = 'nubitel-cdr-token';
const apiBase = () =>
  (localStorage.getItem('nubitel-cdr-api') || import.meta.env.VITE_CDR_VIEWER_API_URL || 'http://localhost:5010').replace(/\/$/, '');

export const cdrToken = {
  get: (): string | null => {
    try {
      const raw = sessionStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: string };
      if (Date.parse(expiresAt) <= Date.now()) {
        sessionStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },
  set: (token: string, expiresAt: string) => sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt })),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, init);
  } catch {
    throw new CdrApiError(0, `Cannot reach the CDR API at ${apiBase()}. Is it running?`);
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401 && cdrToken.get()) cdrToken.clear(); // expired or revoked: ask for the login again
  if (!response.ok) throw new CdrApiError(response.status, body?.error || `Request failed (${response.status})`);
  return body as T;
}

const authed = (): RequestInit => ({ headers: { Authorization: `Bearer ${cdrToken.get() ?? ''}` } });

export const cdrViewerApi = {
  async login(username: string, password: string) {
    const out = await call<{ token: string; expires_at: string }>('/api/v1/cdr/viewer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    cdrToken.set(out.token, out.expires_at);
  },
  logout: () => cdrToken.clear(),
  list(filters: CdrFilters) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '' && value !== null) query.set(key, String(value));
    }
    return call<CdrList>(`/api/v1/cdr/records?${query}`, authed());
  },
  get: (uuid: string) => call<CdrDetail>(`/api/v1/cdr/records/${encodeURIComponent(uuid)}`, authed()),
};
