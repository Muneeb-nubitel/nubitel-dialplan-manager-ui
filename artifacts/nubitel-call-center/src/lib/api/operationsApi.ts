import { campaignsRequest } from '../api-client';
import type { OperationsSummary } from '../types';

export const operationsApi = {
  summary: (domain: string) => campaignsRequest<OperationsSummary>(`/api/operations/summary?domain_name=${encodeURIComponent(domain)}`),
};
