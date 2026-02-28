// Base entity interface - all entities extend this
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// --- Contact ---

export type LifecycleStage =
  | "subscriber"
  | "lead"
  | "marketing_qualified"
  | "sales_qualified"
  | "opportunity"
  | "customer"
  | "evangelist";

export interface Contact extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string | null;
  companyName: string | null;
  lifecycleStage: LifecycleStage;
  owner: string;
  lastActivityDate: string | null;
  jobTitle: string;
  city: string;
  state: string;
  tags: string[];
}

// --- Company ---

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1001-5000"
  | "5001-10000"
  | "10000+";

export type Industry =
  | "technology"
  | "healthcare"
  | "finance"
  | "manufacturing"
  | "retail"
  | "education"
  | "consulting"
  | "real_estate"
  | "media"
  | "nonprofit"
  | "other";

export interface Company extends BaseEntity {
  name: string;
  domain: string;
  industry: Industry;
  size: CompanySize;
  annualRevenue: number | null;
  city: string;
  state: string;
  country: string;
  owner: string;
  description: string;
  phone: string;
  linkedinUrl: string;
}

// --- Deal ---

export type DealStage =
  | "appointment_scheduled"
  | "qualified_to_buy"
  | "presentation_scheduled"
  | "decision_maker_bought_in"
  | "contract_sent"
  | "closed_won"
  | "closed_lost";

export interface Deal extends BaseEntity {
  name: string;
  amount: number;
  stage: DealStage;
  closeDate: string; // ISO 8601
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  owner: string;
  priority: "low" | "medium" | "high";
  probability: number; // 0-100
  description: string;
}

// --- Ticket ---

export type TicketStatus =
  | "new"
  | "waiting_on_contact"
  | "waiting_on_us"
  | "in_progress"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory =
  | "bug"
  | "feature_request"
  | "billing"
  | "general_inquiry"
  | "technical_support"
  | "onboarding";

export interface Ticket extends BaseEntity {
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  contactId: string | null;
  contactName: string | null;
  companyId: string | null;
  companyName: string | null;
  owner: string;
  description: string;
  resolvedAt: string | null;
}

// --- Activity ---

export type ActivityType = "email" | "call" | "note" | "meeting" | "task";

export interface Activity extends BaseEntity {
  type: ActivityType;
  entityType: "contact" | "company" | "deal" | "ticket";
  entityId: string;
  title: string;
  body: string;
  performedBy: string;
  performedAt: string; // ISO 8601
  metadata: Record<string, string | number | boolean>;
}

// --- Owner (static, not a stored entity) ---

export interface Owner {
  id: string;
  name: string;
  email: string;
}

// --- Entity type union ---

export type EntityType = "contact" | "company" | "deal" | "ticket";
