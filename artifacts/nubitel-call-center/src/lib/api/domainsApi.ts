import { campaignsRequest } from '../api-client';
import type { Domain } from '../domains';

export const domainsApi = {
  list: async () => (await campaignsRequest<{ domains: Domain[] }>('/api/domains')).domains,
};
