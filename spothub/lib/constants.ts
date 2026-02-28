import type {
  LifecycleStage,
  Industry,
  CompanySize,
  DealStage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  Owner,
} from "@/types";

// --- Owners (static sales team) ---

export const OWNERS: Owner[] = [
  { id: "owner-1", name: "Sarah Chen", email: "schen@spothub.com" },
  { id: "owner-2", name: "Marcus Johnson", email: "mjohnson@spothub.com" },
  { id: "owner-3", name: "Elena Rodriguez", email: "erodriguez@spothub.com" },
  { id: "owner-4", name: "David Kim", email: "dkim@spothub.com" },
  { id: "owner-5", name: "Rachel Foster", email: "rfoster@spothub.com" },
  { id: "owner-6", name: "James Okafor", email: "jokafor@spothub.com" },
  { id: "owner-7", name: "Priya Patel", email: "ppatel@spothub.com" },
  { id: "owner-8", name: "Alex Thompson", email: "athompson@spothub.com" },
  { id: "owner-9", name: "Lisa Wang", email: "lwang@spothub.com" },
  { id: "owner-10", name: "Tom Murphy", email: "tmurphy@spothub.com" },
];

// --- Lifecycle Stages ---

export const LIFECYCLE_STAGES: { value: LifecycleStage; label: string }[] = [
  { value: "subscriber", label: "Subscriber" },
  { value: "lead", label: "Lead" },
  { value: "marketing_qualified", label: "Marketing Qualified" },
  { value: "sales_qualified", label: "Sales Qualified" },
  { value: "opportunity", label: "Opportunity" },
  { value: "customer", label: "Customer" },
  { value: "evangelist", label: "Evangelist" },
];

// --- Industries ---

export const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "education", label: "Education" },
  { value: "consulting", label: "Consulting" },
  { value: "real_estate", label: "Real Estate" },
  { value: "media", label: "Media" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
];

// --- Company Sizes ---

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1,000" },
  { value: "1001-5000", label: "1,001-5,000" },
  { value: "5001-10000", label: "5,001-10,000" },
  { value: "10000+", label: "10,000+" },
];

// --- Deal Stages ---

export const DEAL_STAGES: { value: DealStage; label: string; probability: number }[] = [
  { value: "appointment_scheduled", label: "Appointment Scheduled", probability: 20 },
  { value: "qualified_to_buy", label: "Qualified to Buy", probability: 40 },
  { value: "presentation_scheduled", label: "Presentation Scheduled", probability: 60 },
  { value: "decision_maker_bought_in", label: "Decision Maker Bought In", probability: 75 },
  { value: "contract_sent", label: "Contract Sent", probability: 90 },
  { value: "closed_won", label: "Closed Won", probability: 100 },
  { value: "closed_lost", label: "Closed Lost", probability: 0 },
];

// --- Ticket Statuses ---

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "waiting_on_contact", label: "Waiting on Contact" },
  { value: "waiting_on_us", label: "Waiting on Us" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

// --- Ticket Priorities ---

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// --- Ticket Categories ---

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "billing", label: "Billing" },
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "technical_support", label: "Technical Support" },
  { value: "onboarding", label: "Onboarding" },
];

// --- Contact Tags Pool ---

export const CONTACT_TAGS = [
  "VIP",
  "Decision Maker",
  "Champion",
  "Influencer",
  "Technical",
  "Executive",
  "Budget Holder",
  "Referral",
  "Partner",
  "Event Attendee",
  "Blog Subscriber",
  "Webinar Attendee",
  "Free Trial",
  "Enterprise",
  "SMB",
  "Churned",
  "At Risk",
  "Upsell Target",
  "New Logo",
  "Renewal Due",
];

// --- Page Size Options ---

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
