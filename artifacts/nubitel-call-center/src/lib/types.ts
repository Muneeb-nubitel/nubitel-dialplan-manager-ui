export type Agent = {
  uuid: string; agent_id: string; name: string; domain_name: string; status: string;
  call_status: string; type: string; position: number; last_active: string;
  busy_delay_time?: number; call_timeout?: number; wrap_up_time?: number;
};
export type Queue = {
  extension: string; name: string; uuid: string; campaignId?: string; domain_name: string; strategy: string;
  record: boolean; waiting: number; trying: number; receiving: number; answered: number; inQueue: number;
  tierCount: number; status: string;
};
export type TierAgent = { uuid: string; position: number; status: string; call_status: string; last_active: string };
export type Tier = { id: string; level: number; name: string; state: string; agents: string[]; agentDetails?: Record<string, TierAgent> };
export type AgentSelectionScore = { agentUuid: string; score: number; rank: number; label: string };
export type Event = { id: string; kind: string; title: string; detail: string; time: string; tone: string };
export type Overview = { agents: Agent[]; queues: Queue[]; events: Event[]; updatedAt: string };
export type SyncResult = { id: string; direction: string; startedAt: string; duration: string; result: string };
export type CdrRecord = {
  id: string; queue_session_uuid: string; call_uuid: string; cdr_uuid: string | null;
  customer_number: string | null; queue_extension: string; queue_domain: string;
  queue_name: string | null; campaign_id: string | null; direction: string | null;
  entered_queue_at: string; completed_at: string; final_status: string;
  final_reason: string | null; connected_agent_uuid: string | null;
  connected_agent_id: string | null; total_attempts: number;
  attempts: unknown[]; events: unknown[];
};
export type CdrListResponse = { records: CdrRecord[]; page: number; limit: number; total: number; totalPages: number };
export type CdrSummary = {
  total: number; withAgent: number;
  byStatus: { status: string; count: number }[];
  byReason: { reason: string; count: number }[];
};
