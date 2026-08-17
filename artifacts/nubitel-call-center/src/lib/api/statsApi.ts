import { isMockEnabled, wait } from '../api-client';
import { mockAgents, mockEvents, mockQueues } from '../mock-data';
import type { Overview } from '../types';
import { agentsApi } from './agentsApi';
import { queuesApi } from './queuesApi';

export const statsApi = {
  overview: async (domain: string): Promise<Overview> => {
    if (isMockEnabled()) {
      await wait();
      return {
        agents: mockAgents.filter((agent) => agent.domain_name === domain),
        queues: mockQueues.filter((queue) => queue.domain_name === domain),
        events: mockEvents,
        updatedAt: new Date().toISOString(),
      };
    }

    const [agentsResult, queuesResult] = await Promise.allSettled([agentsApi.list(domain), queuesApi.list(domain)]);
    if (agentsResult.status === 'rejected') throw agentsResult.reason;
    return {
      agents: agentsResult.value,
      queues: queuesResult.status === 'fulfilled' ? queuesResult.value : [],
      events: [],
      updatedAt: new Date().toISOString(),
    };
  },
};
