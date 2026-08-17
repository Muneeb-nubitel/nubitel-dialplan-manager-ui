import { campaignsRequest, isMockEnabled, wait } from '../api-client';
import type { AgentSelectionScore } from '../types';

export const selectionApi = {
  list: async (domain: string, extension: string): Promise<AgentSelectionScore[]> => {
    if (isMockEnabled()) {
      await wait();
      return [];
    }
    return campaignsRequest<AgentSelectionScore[]>(`/api/campaign-selection-scores?domain_name=${encodeURIComponent(domain)}&extension=${encodeURIComponent(extension)}`);
  },
};
