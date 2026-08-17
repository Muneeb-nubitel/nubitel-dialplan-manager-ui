import { isMockEnabled, request, wait } from '../api-client';
import { mockTiers } from '../mock-data';
import type { Tier } from '../types';
export const tiersApi = {
  list: async (domain: string): Promise<Tier[]> => { if (isMockEnabled()) { await wait(); return mockTiers; } return request<Tier[]>(`/call-center/api/v1/tiers/all?domain_name=${domain}`); },
  updateMembership: async (body: unknown) => { if (isMockEnabled()) { await wait(520); return body; } return request('/call-center/api/v1/tiers/update-agent-tier', { method: 'POST', body: JSON.stringify(body) }); },
};