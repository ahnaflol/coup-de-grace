import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

import type {
  Company,
  Contact,
  Deal,
  Ticket,
  Activity,
  Industry,
  CompanySize,
  LifecycleStage,
  DealStage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ActivityType,
} from "../types";

// ---------------------------------------------------------------------------
// Constants (mirrored from lib/constants.ts to avoid path-alias issues in tsx)
// ---------------------------------------------------------------------------

const OWNERS = [
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

const CONTACT_TAGS = [
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

const INDUSTRIES: Industry[] = [
  "technology",
  "healthcare",
  "finance",
  "manufacturing",
  "retail",
  "education",
  "consulting",
  "real_estate",
  "media",
  "nonprofit",
  "other",
];

const COMPANY_SIZES: CompanySize[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
];

const DEAL_STAGES: { value: DealStage; probability: number }[] = [
  { value: "appointment_scheduled", probability: 20 },
  { value: "qualified_to_buy", probability: 40 },
  { value: "presentation_scheduled", probability: 60 },
  { value: "decision_maker_bought_in", probability: 75 },
  { value: "contract_sent", probability: 90 },
  { value: "closed_won", probability: 100 },
  { value: "closed_lost", probability: 0 },
];

const TICKET_STATUSES: TicketStatus[] = [
  "new",
  "waiting_on_contact",
  "waiting_on_us",
  "in_progress",
  "closed",
];

const TICKET_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

const TICKET_CATEGORIES: TicketCategory[] = [
  "bug",
  "feature_request",
  "billing",
  "general_inquiry",
  "technical_support",
  "onboarding",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

faker.seed(42); // Reproducible output

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomOwner(): string {
  return pick(OWNERS).id;
}

function isoDate(date: Date): string {
  return date.toISOString();
}

function pastDate(monthsBack: number = 6): Date {
  return faker.date.between({
    from: new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
}

function futureDate(monthsAhead: number = 6): Date {
  return faker.date.between({
    from: new Date(),
    to: new Date(Date.now() + monthsAhead * 30 * 24 * 60 * 60 * 1000),
  });
}

function domainFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "") + ".com"
  );
}

const US_STATES = [
  "California",
  "New York",
  "Texas",
  "Florida",
  "Illinois",
  "Washington",
  "Massachusetts",
  "Colorado",
  "Georgia",
  "North Carolina",
  "Virginia",
  "Ohio",
  "Pennsylvania",
  "Oregon",
  "Arizona",
  "Minnesota",
  "Michigan",
  "Tennessee",
  "Maryland",
  "Utah",
];

const DEAL_PRODUCTS = [
  "Platform License",
  "Enterprise Suite",
  "Annual Subscription",
  "Consulting Package",
  "Implementation Services",
  "Data Migration",
  "Custom Integration",
  "Training Program",
  "Support Contract",
  "Premium Add-on",
  "Analytics Module",
  "Security Package",
  "API Access",
  "White Label Solution",
  "Managed Services",
];

const TICKET_SUBJECTS = [
  "Unable to log in to dashboard",
  "Data export failing with timeout error",
  "Billing discrepancy on last invoice",
  "Request for API rate limit increase",
  "Integration with Salesforce not syncing",
  "Password reset email not received",
  "Report generation shows incorrect totals",
  "Feature request: bulk contact import",
  "Mobile app crashing on startup",
  "SSO configuration assistance needed",
  "Webhook delivery failures",
  "Permission settings not saving",
  "Custom field creation issue",
  "Email template rendering broken",
  "Slow page load times on contacts view",
  "Need help setting up automation workflow",
  "Two-factor authentication setup",
  "CSV import mapping incorrectly",
  "Calendar sync not updating",
  "Duplicate records being created",
  "Pipeline view missing deals",
  "Notification preferences not working",
  "API returning 500 errors intermittently",
  "Need to merge duplicate companies",
  "Dashboard widgets not loading",
  "Search function returning stale results",
  "File attachment upload failing",
  "User provisioning via SCIM",
  "Onboarding walkthrough questions",
  "Requesting sandbox environment access",
];

// ---------------------------------------------------------------------------
// 1. Companies (200)
// ---------------------------------------------------------------------------

function generateCompanies(count: number): Company[] {
  const companies: Company[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = faker.company.name();
    while (usedNames.has(name)) {
      name = faker.company.name();
    }
    usedNames.add(name);

    const createdAt = pastDate();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    companies.push({
      id: uuidv4(),
      name,
      domain: domainFromName(name),
      industry: pick(INDUSTRIES),
      size: pick(COMPANY_SIZES),
      annualRevenue:
        Math.random() > 0.15
          ? faker.number.int({ min: 100_000, max: 500_000_000 })
          : null,
      city: faker.location.city(),
      state: pick(US_STATES),
      country: "United States",
      owner: randomOwner(),
      description: faker.company.catchPhrase(),
      phone: faker.phone.number({ style: "national" }),
      linkedinUrl: `https://linkedin.com/company/${domainFromName(name).replace(".com", "")}`,
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    });
  }

  return companies;
}

// ---------------------------------------------------------------------------
// 2. Contacts (500)
// ---------------------------------------------------------------------------

function generateContacts(
  count: number,
  companies: Company[]
): Contact[] {
  const contacts: Contact[] = [];
  const lifecycleWeights: { stage: LifecycleStage; weight: number }[] = [
    { stage: "subscriber", weight: 8 },
    { stage: "lead", weight: 25 },
    { stage: "marketing_qualified", weight: 15 },
    { stage: "sales_qualified", weight: 12 },
    { stage: "opportunity", weight: 10 },
    { stage: "customer", weight: 25 },
    { stage: "evangelist", weight: 5 },
  ];

  const stages = lifecycleWeights.map((s) => s.stage);
  const weights = lifecycleWeights.map((s) => s.weight);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const isUnaffiliated = Math.random() < 0.15;

    let companyId: string | null = null;
    let companyName: string | null = null;
    let email: string;

    if (isUnaffiliated) {
      const personalDomain = pick(["gmail.com", "outlook.com", "yahoo.com", "hotmail.com"]);
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${personalDomain}`;
    } else {
      const company = pick(companies);
      companyId = company.id;
      companyName = company.name;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`;
    }

    const createdAt = pastDate();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    const tags = pickN(CONTACT_TAGS, 0, 3);

    contacts.push({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      phone: faker.phone.number({ style: "national" }),
      companyId,
      companyName,
      lifecycleStage: pickWeighted(stages, weights),
      owner: randomOwner(),
      lastActivityDate:
        Math.random() > 0.1 ? isoDate(pastDate(3)) : null,
      jobTitle: faker.person.jobTitle(),
      city: faker.location.city(),
      state: pick(US_STATES),
      tags,
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    });
  }

  return contacts;
}

// ---------------------------------------------------------------------------
// 3. Deals (300)
// ---------------------------------------------------------------------------

function generateDeals(
  count: number,
  companies: Company[],
  contacts: Contact[]
): Deal[] {
  const deals: Deal[] = [];

  // Build a map of company ID -> contacts for that company
  const companyContactMap = new Map<string, Contact[]>();
  for (const c of contacts) {
    if (c.companyId) {
      const existing = companyContactMap.get(c.companyId) || [];
      existing.push(c);
      companyContactMap.set(c.companyId, existing);
    }
  }

  // Weighted stages - more early-stage deals
  const stageWeights = [25, 20, 15, 12, 8, 12, 8];

  for (let i = 0; i < count; i++) {
    const company = pick(companies);
    const companyContacts = companyContactMap.get(company.id);
    const contact = companyContacts ? pick(companyContacts) : null;

    const stageInfo = pickWeighted(DEAL_STAGES, stageWeights);
    const stage = stageInfo.value;
    const probability = stageInfo.probability;

    const isClosed = stage === "closed_won" || stage === "closed_lost";
    const closeDate = isClosed ? pastDate(4) : futureDate(4);

    const amount = faker.number.int({ min: 5000, max: 500_000 });
    const product = pick(DEAL_PRODUCTS);
    const dealName = `${company.name} - ${product}`;

    const createdAt = pastDate();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    const priority = pickWeighted(
      ["low", "medium", "high"] as const,
      [20, 50, 30]
    );

    deals.push({
      id: uuidv4(),
      name: dealName,
      amount,
      stage,
      closeDate: isoDate(closeDate),
      companyId: company.id,
      companyName: company.name,
      contactId: contact?.id ?? null,
      contactName: contact
        ? `${contact.firstName} ${contact.lastName}`
        : null,
      owner: randomOwner(),
      priority,
      probability,
      description: faker.lorem.sentence(),
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    });
  }

  return deals;
}

// ---------------------------------------------------------------------------
// 4. Tickets (150)
// ---------------------------------------------------------------------------

function generateTickets(
  count: number,
  contacts: Contact[],
  companies: Company[]
): Ticket[] {
  const tickets: Ticket[] = [];

  // Weighted status - more new and in_progress
  const statusWeights = [30, 15, 15, 25, 15];
  const priorityWeights = [25, 40, 25, 10];
  const categoryWeights = [20, 15, 15, 15, 25, 10];

  for (let i = 0; i < count; i++) {
    const contact = pick(contacts);
    let companyId = contact.companyId;
    let companyName = contact.companyName;

    // If contact has no company, try to link to a random one (50% chance)
    if (!companyId && Math.random() > 0.5) {
      const company = pick(companies);
      companyId = company.id;
      companyName = company.name;
    }

    const status = pickWeighted(TICKET_STATUSES, statusWeights);
    const createdAt = pastDate();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    const resolvedAt =
      status === "closed"
        ? isoDate(faker.date.between({ from: createdAt, to: new Date() }))
        : null;

    tickets.push({
      id: uuidv4(),
      subject: pick(TICKET_SUBJECTS),
      status,
      priority: pickWeighted(TICKET_PRIORITIES, priorityWeights),
      category: pickWeighted(TICKET_CATEGORIES, categoryWeights),
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      companyId,
      companyName,
      owner: randomOwner(),
      description: faker.lorem.paragraph(),
      resolvedAt,
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    });
  }

  return tickets;
}

// ---------------------------------------------------------------------------
// 5. Activities (2000+)
// ---------------------------------------------------------------------------

function generateActivities(
  companies: Company[],
  contacts: Contact[],
  deals: Deal[],
  tickets: Ticket[]
): Activity[] {
  const activities: Activity[] = [];

  // Activity type weights - more emails and notes
  const activityTypes: ActivityType[] = [
    "email",
    "call",
    "note",
    "meeting",
    "task",
  ];
  const typeWeights = [30, 20, 25, 15, 10];

  type EntityRef = { entityType: "contact" | "company" | "deal" | "ticket"; entityId: string };

  const allEntities: EntityRef[] = [
    ...contacts.map((c) => ({
      entityType: "contact" as const,
      entityId: c.id,
    })),
    ...companies.map((c) => ({
      entityType: "company" as const,
      entityId: c.id,
    })),
    ...deals.map((d) => ({
      entityType: "deal" as const,
      entityId: d.id,
    })),
    ...tickets.map((t) => ({
      entityType: "ticket" as const,
      entityId: t.id,
    })),
  ];

  for (const entity of allEntities) {
    const activityCount = faker.number.int({ min: 3, max: 8 });

    for (let i = 0; i < activityCount; i++) {
      const actType = pickWeighted(activityTypes, typeWeights);
      const performedAt = pastDate();
      const createdAt = performedAt;
      const updatedAt = performedAt;

      let title: string;
      let body: string;
      let metadata: Record<string, string | number | boolean> = {};

      switch (actType) {
        case "email": {
          const direction = pick(["inbound", "outbound"]);
          const subject = faker.lorem.sentence({ min: 3, max: 8 });
          title = `${direction === "inbound" ? "Received" : "Sent"}: ${subject}`;
          body = faker.lorem.paragraph();
          metadata = {
            direction,
            subject,
            hasAttachment: Math.random() > 0.7,
          };
          break;
        }
        case "call": {
          const outcome = pick([
            "connected",
            "voicemail",
            "no_answer",
            "busy",
          ]);
          const duration = outcome === "connected"
            ? faker.number.int({ min: 60, max: 1800 })
            : 0;
          title = `Call - ${outcome}`;
          body =
            outcome === "connected"
              ? faker.lorem.sentences(2)
              : `Call attempt - ${outcome}`;
          metadata = {
            outcome,
            duration,
            direction: pick(["inbound", "outbound"]),
          };
          break;
        }
        case "note": {
          title = faker.lorem.sentence({ min: 3, max: 6 });
          body = faker.lorem.paragraph();
          metadata = {
            pinned: Math.random() > 0.85,
          };
          break;
        }
        case "meeting": {
          const meetingType = pick([
            "Discovery Call",
            "Demo",
            "Follow-up",
            "Quarterly Review",
            "Onboarding",
            "Technical Review",
            "Contract Negotiation",
          ]);
          const attendeeCount = faker.number.int({ min: 2, max: 5 });
          title = meetingType;
          body = faker.lorem.sentences(2);
          metadata = {
            location: pick([
              "Zoom",
              "Google Meet",
              "Microsoft Teams",
              "In Person",
              "Phone",
            ]),
            attendeeCount,
            duration: pick([30, 45, 60, 90]),
          };
          break;
        }
        case "task": {
          const taskStatus = pick(["pending", "completed", "overdue"]);
          title = faker.lorem.sentence({ min: 3, max: 6 });
          body = faker.lorem.sentence();
          metadata = {
            status: taskStatus,
            dueDate: isoDate(
              taskStatus === "overdue" ? pastDate(1) : futureDate(1)
            ),
          };
          break;
        }
      }

      activities.push({
        id: uuidv4(),
        type: actType,
        entityType: entity.entityType,
        entityId: entity.entityId,
        title,
        body,
        performedBy: randomOwner(),
        performedAt: isoDate(performedAt),
        metadata,
        createdAt: isoDate(createdAt),
        updatedAt: isoDate(updatedAt),
      });
    }
  }

  return activities;
}

// ---------------------------------------------------------------------------
// Write to disk
// ---------------------------------------------------------------------------

function writeData(filename: string, data: unknown[]): void {
  const outDir = path.resolve(__dirname, "../data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ${filename}: ${data.length} records`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Generating seed data...\n");

  const companies = generateCompanies(200);
  const contacts = generateContacts(500, companies);
  const deals = generateDeals(300, companies, contacts);
  const tickets = generateTickets(150, contacts, companies);
  const activities = generateActivities(companies, contacts, deals, tickets);

  console.log("Writing data files:");
  writeData("companies.json", companies);
  writeData("contacts.json", contacts);
  writeData("deals.json", deals);
  writeData("tickets.json", tickets);
  writeData("activities.json", activities);

  console.log("\nSeed data generation complete.");
}

main();
