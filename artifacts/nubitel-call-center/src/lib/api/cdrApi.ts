import { campaignsRequest, isMockEnabled, request, wait } from '../api-client';
import type { CdrListResponse } from '../types';

export const cdrApi = {
  list: async (params: { domain: string; search: string; status: string; days: number; page: number }) => {
    if (isMockEnabled()) {
      await wait();
      return { records: [], page: 1, limit: 25, total: 0, totalPages: 1 } satisfies CdrListResponse;
    }
    const query = new URLSearchParams({ domain_name: params.domain, search: params.search, status: params.status, days: String(params.days), page: String(params.page), limit: '25' });
    return campaignsRequest<CdrListResponse>(`/api/cdr?${query}`);
  },
  add: async (record: unknown) => { if (isMockEnabled()) { await wait(400); return record; } return request('/api/v1/cdr/add/call-record', { method: 'POST', body: JSON.stringify(record) }); },
};
