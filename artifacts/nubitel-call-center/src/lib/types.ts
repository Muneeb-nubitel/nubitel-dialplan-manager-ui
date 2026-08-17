export type Agent = {
  uuid: string; agent_id: string; name: string; domain_name: string; status: string;
  call_status: string; type: string; position: number; last_active: string;
  busy_delay_time?: number; call_timeout?: number; wrap_up_time?: number;
};
export type Queue = {
  extension: string; name: string; uuid: string; domain_name: string; strategy: string;
  record: boolean; waiting: number; receiving: number; answered: number; inQueue: number;
  tierCount: number; status: string;
};
export type Tier = { id: string; level: number; name: string; state: string; agents: string[] };
export type Event = { id: string; kind: string; title: string; detail: string; time: string; tone: string };
export type Overview = { agents: Agent[]; queues: Queue[]; events: Event[]; updatedAt: string };
export type SyncResult = { id: string; direction: string; startedAt: string; duration: string; result: string };