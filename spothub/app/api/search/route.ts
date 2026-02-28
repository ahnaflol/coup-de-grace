import { getAll } from "@/lib/storage";
import type { Contact, Company, Deal, Ticket } from "@/types";
import type { SearchResult } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return Response.json([]);
  }

  const lower = q.toLowerCase();
  const results: SearchResult[] = [];

  const [contacts, companies, deals, tickets] = await Promise.all([
    getAll<Contact>("contacts.json"),
    getAll<Company>("companies.json"),
    getAll<Deal>("deals.json"),
    getAll<Ticket>("tickets.json"),
  ]);

  for (const contact of contacts) {
    const full = `${contact.firstName} ${contact.lastName}`;
    if (
      full.toLowerCase().includes(lower) ||
      contact.email.toLowerCase().includes(lower)
    ) {
      results.push({
        id: contact.id,
        type: "contact",
        title: full,
        subtitle: contact.email,
      });
    }
  }

  for (const company of companies) {
    if (
      company.name.toLowerCase().includes(lower) ||
      company.domain.toLowerCase().includes(lower)
    ) {
      results.push({
        id: company.id,
        type: "company",
        title: company.name,
        subtitle: company.domain,
      });
    }
  }

  for (const deal of deals) {
    if (
      deal.name.toLowerCase().includes(lower) ||
      (deal.companyName && deal.companyName.toLowerCase().includes(lower))
    ) {
      results.push({
        id: deal.id,
        type: "deal",
        title: deal.name,
        subtitle: `$${deal.amount.toLocaleString()}`,
      });
    }
  }

  for (const ticket of tickets) {
    if (
      ticket.subject.toLowerCase().includes(lower) ||
      (ticket.contactName && ticket.contactName.toLowerCase().includes(lower))
    ) {
      results.push({
        id: ticket.id,
        type: "ticket",
        title: ticket.subject,
        subtitle: ticket.status,
      });
    }
  }

  // BUG (intentional): artificial delay with no loading indicator on frontend
  await new Promise((r) => setTimeout(r, 300));

  return Response.json(results);
}
