import { campaignsRequest, isMockEnabled, request, wait } from '../api-client';
import type { CdrListResponse, CdrSummary } from '../types';

export type CdrFilterParams = { domain: string; search: string; status: string; dateFrom: string; dateTo: string };

function buildFilterQuery(params: CdrFilterParams) {
  return new URLSearchParams({
    domain_name: params.domain,
    search: params.search,
    status: params.status,
    ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
    ...(params.dateTo ? { dateTo: params.dateTo } : {}),
  });
}

export const cdrApi = {
  list: async (params: CdrFilterParams & { page: number }) => {
    if (isMockEnabled()) {
      await wait();
      return { records: [], page: 1, limit: 25, total: 0, totalPages: 1 } satisfies CdrListResponse;
    }
    const query = buildFilterQuery(params);
    query.set('page', String(params.page));
    query.set('limit', '25');
    return campaignsRequest<CdrListResponse>(`/api/cdr?${query}`);
  },
  summary: async (params: CdrFilterParams) => {
    if (isMockEnabled()) {
      await wait();
      return { total: 0, withAgent: 0, byStatus: [], byReason: [] } satisfies CdrSummary;
    }
    const query = buildFilterQuery(params);
    return campaignsRequest<CdrSummary>(`/api/cdr/summary?${query}`);
  },
  add: async (record: unknown) => { if (isMockEnabled()) { await wait(400); return record; } return request('/api/v1/cdr/add/call-record', { method: 'POST', body: JSON.stringify(record) }); },
};
