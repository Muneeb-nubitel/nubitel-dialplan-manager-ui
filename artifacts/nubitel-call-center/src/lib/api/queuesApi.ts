import { isMockEnabled, request, wait } from '../api-client';
import { mockQueues } from '../mock-data';
import type { Queue } from '../types';
export const queuesApi = {
  list: async (domain: string) => { if (isMockEnabled()) { await wait(); return mockQueues.filter((q) => q.domain_name === domain); } return request<Queue[]>(`/call-center/api/v1/queues?domain_name=${encodeURIComponent(domain)}`); },
  save: async (queue: Partial<Queue>) => { if (isMockEnabled()) { await wait(550); return queue; } return request<Queue>('/call-center/api/v1/queues', { method: 'POST', body: JSON.stringify(queue) }); },
  remove: async (extension: string, domain: string) => { if (isMockEnabled()) { await wait(450); return { extension }; } return request(`/call-center/api/v1/queues?extension=${extension}&domain_name=${domain}`, { method: 'DELETE' }); },
};