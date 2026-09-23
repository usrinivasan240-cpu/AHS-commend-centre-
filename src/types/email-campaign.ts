export type CampaignStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type EmailStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "BOUNCED"
  | "REPLIED"
  | "SUPPRESSED"
  | "CANCELLED"
  | "INVALID";

export type SuppressionReason =
  | "User Unsubscribe"
  | "Manual Suppression"
  | "Hard Bounce"
  | "Invalid Address"
  | "Compliance"
  | "Other";

export interface EmailCampaign {
  id: string;
  name: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  status: CampaignStatus;
  total_recipients: number;
  valid_recipients: number;
  suppressed_recipients: number;
  duplicate_recipients: number;
  invalid_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  bounced_count: number;
  reply_count: number;
  pending_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  test_mode?: boolean;
}

export interface EmailCampaignRecipient {
  id: string;
  campaign_id: string;
  lead_id?: string;
  lead_name: string;
  first_name?: string;
  last_name?: string;
  company: string;
  category?: string;
  email: string;
  subject: string;
  email_content: string;
  // optional enrichment
  country?: string;
  industry?: string;
  phone?: string;
  website?: string;
  source?: string;
  generated_date?: string;
  status: EmailStatus;
  provider_message_id?: string;
  error_code?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  replied_at?: string;
  bounced_at?: string;
  created_at: string;
  updated_at: string;
  row_index?: number;
  validation_errors?: string[];
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: SuppressionReason;
  source: string;
  created_by?: string;
  created_at: string;
}

export interface EmailCampaignEvent {
  id: string;
  campaign_id: string;
  recipient_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}

export interface ValidationSummary {
  totalRows: number;
  valid: number;
  invalidEmails: number;
  missingEmails: number;
  duplicateEmails: number;
  missingContent: number;
  missingLeadNames: number;
  missingCompanies: number;
  suppressed: number;
}

export interface ParsedLeadRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    lead_name: string;
    first_name?: string;
    last_name?: string;
    company: string;
    category?: string;
    email: string;
    email_content: string;
    subject?: string;
    country?: string;
    industry?: string;
    phone?: string;
    website?: string;
    source?: string;
    generated_date?: string;
  };
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
  isSuppressed: boolean;
  suppressedReason?: string;
}

export const DEFAULT_SENDER_NAME = "AHS Global Services";
export const DEFAULT_SENDER_EMAIL = "ahsglobalservices@gail.com";
