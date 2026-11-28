import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import { parseDashboardResponse } from "@/lib/dashboard-report";

export type MetricObject = Record<string, unknown>;
export interface Source {
  available: boolean;
  source: string;
  limit: string | null;
}
export interface Overview {
  generatedAt: string;
  businessDate: string;
  attention: MetricObject | null;
  users: MetricObject | null;
  rentals: MetricObject | null;
  membership: MetricObject | null;
  system: { level: string; reasons: string[] } | null;
  sources: Record<string, Source>;
  degraded: string[];
}
export interface Health {
  generatedAt: string;
  level: string;
  reasons: string[];
  services:
    | {
        name: string;
        status: string;
        instances: number;
        lastRenewalAgeSec: number | null;
        registeredAt: string | null;
      }[]
    | null;
  outbox: MetricObject[] | null;
  jobs: MetricObject | null;
  signing: MetricObject | null;
  blockchain: MetricObject | null;
  payments: MetricObject | null;
  kyc: MetricObject | null;
  complaints: MetricObject | null;
  responseSla: MetricObject | null;
  dataQuality: MetricObject | null;
  gateway: MetricObject | null;
  sources: Record<string, Source>;
  degraded: string[];
}
export interface Statistics {
  range: { from: string; to: string; granularity: string; timezone: string };
  generatedAt: string;
  businessAsOf: string;
  kpi: MetricObject;
  series: MetricObject;
  breakdown: MetricObject;
  funnel: MetricObject;
  sources: Record<string, Source>;
  degraded: string[];
}
export interface Network {
  chainId: number;
  name: string;
  registryAddress: string | null;
  enabled: boolean;
  explorerBaseUrl: string | null;
}
export interface BlockchainSummary {
  asOf: string;
  network: Network;
  counts: Record<string, number>;
  stuck: number;
  oldestOpenAgeSeconds: number | null;
  retrying: number;
  byErrorCode: Record<string, number>;
  openIncidents: number;
  senderLeaseHeldUntil: string | null;
  integrity: { counts: Record<string, number>; note: string };
  ethUnsettled: number;
  ethTotal: number;
  ethPaid: number;
  workerLastRunAgeSeconds: number | null;
  sourceCapabilities: Record<string, string>;
}
export interface Proof {
  documentId: string;
  contractNumber: string;
  documentKind: number | null;
  status: string;
  transactionHash: string | null;
  blockNumber: number | null;
  createdAt: string;
  confirmedAt: string | null;
  errorCode: string | null;
}
export interface ProofDetail extends Proof {
  documentHash: string | null;
  onChainDocumentId: string | null;
  chainId: number;
  registryAddress: string | null;
  blockHash: string | null;
  registeredAt: string | null;
  caseId: string | null;
  attempts: number;
  submittedAt: string | null;
}
export interface EthPayment {
  orderId: string;
  tier: string;
  kind: string;
  amountVnd: number | string;
  amountWei: string;
  transactionHash: string | null;
  confirmedAt: string | null;
  status: string;
  orderCreatedAt: string;
  ageSeconds: number;
  chainId: number;
  chainSource: string;
}
export interface Verification {
  documentId: string;
  status: string;
  registered: boolean | null;
  matches: boolean | null;
  conflict: boolean | null;
  onChainHash: string | null;
  registeredAt: string | null;
}
export interface Integrity {
  documentId: string;
  status: string;
  documentHash: string | null;
  onChainDocumentHash: string | null;
  checkedAt: string | null;
  message: string | null;
}
export interface KycItem {
  userId: string;
  status: string;
  provider: string;
  createdAt: string | null;
  expiresAt: string | null;
  rejectionCategory: string | null;
}
export interface KycPage {
  items: KycItem[];
  total: number;
  page: number;
  size: number;
}
export interface KycCount {
  status: string;
  provider: string;
  rejectionCategory: string | null;
  count: number;
}
export interface DeliveryChannel {
  enabled: boolean;
  source: string;
  pending: number | null;
  processing: number | null;
  failed24h: number | null;
  skipped24h: number | null;
  sent24h: number | null;
  accepted24h: number | null;
  retryDue: number | null;
  oldestPendingAgeSec: number | null;
}
export interface DeliveryHealth {
  asOf: string;
  email: DeliveryChannel;
  push: DeliveryChannel;
}

export async function getDashboardData<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const { data } = await axiosClient.get<ApiResponse<T>>(path, {
    signal,
    transformResponse: [parseDashboardResponse],
  });
  return data.result;
}
export async function getDashboardPage<T>(
  path: string,
  signal?: AbortSignal,
): Promise<PageResponse<T>> {
  const { data } = await axiosClient.get<PageResponse<T>>(path, {
    signal,
    transformResponse: [parseDashboardResponse],
  });
  return data;
}
export async function checkProof(
  documentId: string,
  action: "verify" | "integrity",
) {
  const { data } = await axiosClient.post<
    ApiResponse<Verification | Integrity>
  >(
    `/api/v1/admin/blockchain/proofs/${encodeURIComponent(documentId)}/${action}`,
  );
  return data.result;
}
