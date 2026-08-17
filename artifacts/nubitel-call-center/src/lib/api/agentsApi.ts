import { isMockEnabled, request, wait } from '../api-client';
import { mockAgents } from '../mock-data';
import type { Agent } from '../types';
export const agentsApi = {
  list: async (domain: string) => { if (isMockEnabled()) { await wait(); return mockAgents.filter((a) => a.domain_name === domain); } return request<Agent[]>(`/call-center/api/v1/agents?domain_name=${encodeURIComponent(domain)}`); },
  save: async (agent: Partial<Agent>) => { if (isMockEnabled()) { await wait(550); return agent; } return request<Agent>('/call-center/api/v1/agent', { method: 'POST', body: JSON.stringify(agent) }); },
  remove: async (uuid: string, domain: string) => { if (isMockEnabled()) { await wait(450); return { uuid }; } return request(`/call-center/api/v1/agent?uuid=${uuid}&domain_name=${domain}`, { method: 'DELETE' }); },
};