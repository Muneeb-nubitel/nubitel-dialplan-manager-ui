import { isMockEnabled, request, wait } from '../api-client';
import { mockTiers } from '../mock-data';
import type { Tier } from '../types';

type TierApiRecord = {
  state: string;
  level: number;
  agents: Record<string, {
    position: number;
    status: string;
    last_active: string;
    agentuuid: string;
    call_status: string;
  }>;
};

type TiersApiResponse = { tiers: TierApiRecord[] };

export const tiersApi = {
  list: async (domain: string, extension: string): Promise<Tier[]> => {
    if (isMockEnabled()) {
      await wait();
      return mockTiers;
    }

    const response = await request<TiersApiResponse>(`/call-center/api/v1/tiers/all?domain_name=${encodeURIComponent(domain)}&extension=${encodeURIComponent(extension)}`);
    return response.tiers
      .map((tier) => {
        const entries = Object.entries(tier.agents).sort(([, a], [, b]) => a.position - b.position);
        return {
          id: `${extension}-${tier.level}`,
          level: tier.level,
          name: `Tier ${tier.level}`,
          state: tier.state.toLowerCase(),
          agents: entries.map(([uuid]) => uuid),
          agentDetails: Object.fromEntries(entries.map(([uuid, agent]) => [uuid, {
            uuid,
            position: agent.position,
            status: agent.status,
            call_status: agent.call_status,
            last_active: agent.last_active,
          }])),
        };
      })
      .sort((a, b) => a.level - b.level);
  },
  updateMembership: async (body: unknown) => { if (isMockEnabled()) { await wait(520); return body; } return request('/call-center/api/v1/tiers/update-agent-tier', { method: 'POST', body: JSON.stringify(body) }); },
};
