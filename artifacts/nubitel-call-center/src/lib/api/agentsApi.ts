import { isMockEnabled, request, wait } from '../api-client';
import { mockAgents } from '../mock-data';
import type { Agent } from '../types';

type AgentDashboardRecord = {
  uuid: string;
  agent_id: number;
  domain: string;
  name: string;
  status: string;
  state: string;
};

type AgentDashboardResponse = { agents: AgentDashboardRecord[] };

const normalizeAgent = (agent: AgentDashboardRecord): Agent => {
  const loggedOut = agent.status.toLowerCase() === 'logged out';
  const state = agent.state.toLowerCase();
  const callStatus = loggedOut
    ? 'offline'
    : state === 'waiting' || state === 'idle'
      ? 'available'
      : state.includes('queue call') || state === 'in a call'
        ? 'talking'
        : state.includes('receiv')
          ? 'receiving'
          : state.includes('wrap')
            ? 'wrap-up'
            : state.replaceAll(' ', '-');
  return {
    uuid: agent.uuid,
    agent_id: String(agent.agent_id),
    name: agent.name,
    domain_name: agent.domain,
    status: loggedOut ? 'offline' : 'active',
    call_status: callStatus,
    type: 'agent',
    position: 0,
    last_active: 'Live',
  };
};

export const agentsApi = {
  list: async (domain: string) => {
    if (isMockEnabled()) {
      await wait();
      return mockAgents.filter((agent) => agent.domain_name === domain);
    }
    const response = await request<AgentDashboardResponse>(`/call-center/api/v1/agents?domain_name=${encodeURIComponent(domain)}`);
    return response.agents.map(normalizeAgent);
  },
  save: async (agent: Partial<Agent>) => { if (isMockEnabled()) { await wait(550); return agent; } return request<Agent>('/call-center/api/v1/agent', { method: 'POST', body: JSON.stringify(agent) }); },
  remove: async (uuid: string, domain: string) => { if (isMockEnabled()) { await wait(450); return { uuid }; } return request(`/call-center/api/v1/agent?uuid=${uuid}&domain_name=${domain}`, { method: 'DELETE' }); },
};
