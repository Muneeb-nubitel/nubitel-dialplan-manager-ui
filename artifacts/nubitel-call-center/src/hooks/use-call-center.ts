import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agentsApi';
import { queuesApi } from '@/lib/api/queuesApi';
import { statsApi } from '@/lib/api/statsApi';
import { tiersApi } from '@/lib/api/tiersApi';
import { syncApi } from '@/lib/api/syncApi';
import { cdrApi, type CdrFilterParams } from '@/lib/api/cdrApi';
import { selectionApi } from '@/lib/api/selectionApi';
function getRefreshIntervalMs() {
  const seconds = Number(localStorage.getItem('nubitel-refresh') ?? '30');
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : false;
}
export const useOverview = (domain: string, enabled = true) => useQuery({ queryKey: ['overview', domain], queryFn: () => statsApi.overview(domain), enabled, refetchInterval: enabled ? getRefreshIntervalMs : false });
export const useAgents = (domain: string, enabled = true) => useQuery({ queryKey: ['agents', domain], queryFn: () => agentsApi.list(domain), enabled });
export const useQueues = (domain: string) => useQuery({ queryKey: ['queues', domain], queryFn: () => queuesApi.list(domain), retry: false });
export const useTiers = (domain: string, extension: string) => useQuery({ queryKey: ['tiers', domain, extension], queryFn: () => tiersApi.list(domain, extension), enabled: Boolean(extension), retry: false });
export const useSelectionScores = (domain: string, extension: string) => useQuery({ queryKey: ['selection-scores', domain, extension], queryFn: () => selectionApi.list(domain, extension), enabled: Boolean(extension), retry: false, refetchInterval: 10000 });
export const useSaveAgent = (domain: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: agentsApi.save, onSuccess: () => qc.invalidateQueries({ queryKey: ['agents', domain] }) }); };
export const useDeleteAgent = (domain: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ uuid }: { uuid: string }) => agentsApi.remove(uuid, domain), onSuccess: () => qc.invalidateQueries({ queryKey: ['agents', domain] }) }); };
export const useSaveQueue = (domain: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: queuesApi.save, onSuccess: () => qc.invalidateQueries({ queryKey: ['queues', domain] }) }); };
export const useDeleteQueue = (domain: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ extension }: { extension: string }) => queuesApi.remove(extension, domain), onSuccess: () => qc.invalidateQueries({ queryKey: ['queues', domain] }) }); };
export const useUpdateTier = (domain: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: tiersApi.updateMembership, onSuccess: () => qc.invalidateQueries({ queryKey: ['tiers', domain] }) }); };
export const useSync = () => useMutation({ mutationFn: syncApi.run });
export const useCdr = (params: CdrFilterParams & { page: number }) => useQuery({ queryKey: ['cdr', params], queryFn: () => cdrApi.list(params), retry: false });
export const useCdrSummary = (params: CdrFilterParams) => useQuery({ queryKey: ['cdr-summary', params], queryFn: () => cdrApi.summary(params), retry: false });
