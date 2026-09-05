export type ContractTemplateStatus = "ACTIVE" | "ARCHIVED";

export type TemplateVersionStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "TERMINATED"
  | "CANCELLED";

export type ContractDocumentType = "DOCX" | "PDF";

export type DocumentGenerationStatus =
  | "GENERATING"
  | "READY"
  | "FAILED"
  | "STALE";

export interface TemplateFieldDefinition {
  key: string;
  label: string;
  group: string;
  dataType: string;
  description: string;
  example: string;
  required: boolean;
}

export interface ContractTemplateResponse {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  rentalMode?: string | null;
  status: ContractTemplateStatus;
  latestPublishedVersionId?: string | null;
  versionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplateVersionResponse {
  id: string;
  templateId: string;
  versionNumber: number;
  storageObjectId: string;
  originalFileName?: string | null;
  status: TemplateVersionStatus;
  placeholders: string[];
  validationWarnings: string[];
  publishedAt?: string | null;
  publishedBy?: string | null;
  createdAt: string;
}

export interface CreateContractTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  rentalMode?: string;
  storageObjectId: string;
  originalFileName?: string;
}

export interface UpdateContractTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  rentalMode?: string;
}

export interface CreateTemplateVersionRequest {
  storageObjectId: string;
  originalFileName?: string;
}

export interface ContractResponse {
  id: string;
  contractNumber: string;
  rentalRequestId: string;
  listingId: string;
  landlordId: string;
  tenantId: string;
  templateId: string;
  templateVersionId: string;
  currentRevisionId: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRevisionResponse {
  id: string;
  contractId: string;
  revisionNumber: number;
  templateVersionId: string;
  landlord: Record<string, any>;
  tenant: Record<string, any>;
  property: Record<string, any>;
  lease: Record<string, any>;
  financial: Record<string, any>;
  charges: Array<Record<string, any>>;
  equipments: Array<Record<string, any>>;
  meters: Record<string, any>;
  specialTerms?: string | null;
  revisionNote?: string | null;
  createdAt: string;
}

export interface ContractDocumentResponse {
  id: string;
  contractId: string;
  revisionId: string;
  templateVersionId: string;
  documentType: ContractDocumentType;
  purpose: string;
  storageObjectId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  status: DocumentGenerationStatus;
  errorMessage?: string | null;
  generatedAt?: string | null;
  viewUrl?: string | null;
  downloadUrl?: string | null;
}
