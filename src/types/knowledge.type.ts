export interface KnowledgeDocument {
  documentId: string;
  title: string;
  category: string | null;
  locale: string;
  visibility: "public" | "admin";
  audience: string[];
  status: string;
  activeVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeVersion {
  versionId: string;
  version: string;
  status: string;
  contentHash: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  rawMarkdown?: string | null;
}

export interface WorkerHealthResult {
  status: "HEALTHY" | "OFFLINE";
  activeWorkers: number;
  workers: Array<{
    workerId: string;
    hostname: string;
    pid: number;
    lastHeartbeat: string;
    startedAt: string;
  }>;
  message: string;
}

export interface TestAskResult {
  answer: string;
  status: string;
  citations: Array<{
    documentId: string;
    version: string;
    title: string;
    heading: string;
    chunkId: string;
    snippet?: string;
  }>;
  requestId: string;
}


export interface KnowledgeJob {
  jobId: string;
  versionId: string;
  documentId: string;
  jobType: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  attempts: number;
  maxAttempts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocument {
  versions: KnowledgeVersion[];
  activeVersion: KnowledgeVersion | null;
  latestJob: KnowledgeJob | null;
}

export interface KnowledgeList {
  items: KnowledgeDocument[];
  total: number;
  offset: number;
  limit: number;
}

export interface KnowledgeUploadResult {
  documentId: string;
  versionId: string;
  version: string;
  status: string;
  isNewVersion: boolean;
  title: string;
  visibility: string;
}

export interface KnowledgeSearchResult {
  query: string;
  scope: "public" | "admin";
  count: number;
  results: Array<{
    documentId: string;
    title: string;
    headingPath: string;
    content: string;
    similarity: number;
    chunkIndex: number;
    visibility: string;
  }>;
}
