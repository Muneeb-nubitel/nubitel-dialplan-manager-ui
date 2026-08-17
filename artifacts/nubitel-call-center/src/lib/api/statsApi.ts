import { isMockEnabled, wait } from '../api-client';
import { mockAgents, mockEvents, mockQueues } from '../mock-data';
import type { Overview } from '../types';
export const statsApi = { overview: async (domain: string): Promise<Overview> => { if (isMockEnabled()) { await wait(); return { agents: mockAgents.filter((a) => a.domain_name === domain), queues: mockQueues.filter((q) => q.domain_name === domain), events: mockEvents, updatedAt: new Date().toISOString() }; } throw { status: 501, message: 'Overview endpoint is not configured.' }; } };