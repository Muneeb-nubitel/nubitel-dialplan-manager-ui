import type { Agent, Event, Queue, Tier } from './types';

export const mockAgents: Agent[] = [
  { uuid: 'a-7f31', agent_id: 'NBL-1042', name: 'Maya Chen', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'receiving', type: 'softphone', position: 1, last_active: 'Just now', wrap_up_time: 45 },
  { uuid: 'a-2b09', agent_id: 'NBL-1088', name: 'Elias Romero', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'talking', type: 'softphone', position: 2, last_active: 'Just now', wrap_up_time: 60 },
  { uuid: 'a-45cc', agent_id: 'NBL-1107', name: 'Priya Shah', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'available', type: 'softphone', position: 3, last_active: '48 sec ago', wrap_up_time: 30 },
  { uuid: 'a-91ee', agent_id: 'NBL-1113', name: 'Jon Bell', domain_name: 'cxdev.nubitel.io', status: 'paused', call_status: 'wrap-up', type: 'softphone', position: 4, last_active: '2 min ago', wrap_up_time: 90 },
  { uuid: 'a-3a61', agent_id: 'NBL-1135', name: 'Sofia Laurent', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'available', type: 'softphone', position: 5, last_active: '3 min ago', wrap_up_time: 45 },
  { uuid: 'a-5cc2', agent_id: 'NBL-1162', name: 'Dante Okafor', domain_name: 'cxdev.nubitel.io', status: 'offline', call_status: 'offline', type: 'softphone', position: 6, last_active: '18 min ago', wrap_up_time: 45 },
  { uuid: 'a-81d4', agent_id: 'NBL-1183', name: 'Hana Suzuki', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'receiving', type: 'softphone', position: 7, last_active: 'Just now', wrap_up_time: 45 },
  { uuid: 'a-62aa', agent_id: 'NBL-1194', name: 'Caleb Woods', domain_name: 'cxdev.nubitel.io', status: 'active', call_status: 'available', type: 'softphone', position: 8, last_active: '1 min ago', wrap_up_time: 30 },
];
export const mockQueues: Queue[] = [
  { extension: '4101', name: 'Renewals — West', uuid: 'q-4101', domain_name: 'cxdev.nubitel.io', strategy: 'longest-idle-agent', record: true, waiting: 4, receiving: 7, answered: 184, inQueue: 12, tierCount: 3, status: 'live' },
  { extension: '4102', name: 'Member Support', uuid: 'q-4102', domain_name: 'cxdev.nubitel.io', strategy: 'round-robin', record: true, waiting: 1, receiving: 4, answered: 126, inQueue: 5, tierCount: 2, status: 'live' },
  { extension: '4103', name: 'Claims Intake', uuid: 'q-4103', domain_name: 'cxdev.nubitel.io', strategy: 'fewest-calls', record: false, waiting: 0, receiving: 2, answered: 91, inQueue: 2, tierCount: 2, status: 'quiet' },
  { extension: '4104', name: 'Priority Care', uuid: 'q-4104', domain_name: 'cxdev.nubitel.io', strategy: 'top-down', record: true, waiting: 2, receiving: 3, answered: 48, inQueue: 7, tierCount: 4, status: 'live' },
];
export const mockEvents: Event[] = [
  { id: 'evt-1', kind: 'sync', title: 'Redis sync completed', detail: '1,264 records reconciled', time: '2 min ago', tone: 'teal' },
  { id: 'evt-2', kind: 'agent', title: 'Agent status changed', detail: 'Jon Bell moved to wrap-up', time: '4 min ago', tone: 'orange' },
  { id: 'evt-3', kind: 'campaign', title: 'Campaign tier updated', detail: 'Priority Care · Tier 2', time: '9 min ago', tone: 'lime' },
  { id: 'evt-4', kind: 'alert', title: 'Queue waiting threshold', detail: 'Renewals — West reached 4 calls', time: '11 min ago', tone: 'red' },
];
export const mockTiers: Tier[] = [
  { id: 'tier-1', level: 1, name: 'Priority agents', state: 'active', agents: ['a-7f31', 'a-2b09'] },
  { id: 'tier-2', level: 2, name: 'Standard rotation', state: 'active', agents: ['a-45cc', 'a-91ee', 'a-3a61'] },
  { id: 'tier-3', level: 3, name: 'Overflow coverage', state: 'standby', agents: ['a-5cc2', 'a-81d4'] },
];
export const callVolumes = [42, 54, 48, 65, 58, 72, 66, 79, 71, 88, 81, 92];
