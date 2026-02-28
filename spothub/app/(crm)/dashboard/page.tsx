"use client";

import { useEffect, useState } from "react";
import { Users, Building2, DollarSign, Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";
import type { Contact } from "@/types";

interface MetricCard {
  label: string;
  icon: React.ElementType;
  value: number | null;
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16" />
      </CardContent>
    </Card>
  );
}

function MetricCardDisplay({ card }: { card: MetricCard }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {card.label}
        </CardTitle>
        <card.icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {card.value !== null ? card.value.toLocaleString() : "--"}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([
    { label: "Total Contacts", icon: Users, value: null },
    { label: "Total Companies", icon: Building2, value: null },
    { label: "Open Deals", icon: DollarSign, value: null },
    { label: "Open Tickets", icon: Ticket, value: null },
  ]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [contactsRes, companiesRes, dealsRes, ticketsRes] =
          await Promise.all([
            fetch("/api/contacts?pageSize=1"),
            fetch("/api/companies?pageSize=1"),
            // BUG-06: Fetches total deal count instead of filtering by open stages.
            // Shows ALL deals (including closed_won and closed_lost) instead of
            // only non-closed deals.
            fetch("/api/deals?pageSize=1"),
            fetch(
              "/api/tickets?pageSize=1&status=new,waiting_on_contact,waiting_on_us,in_progress"
            ),
          ]);

        const [contacts, companies, deals, tickets] = await Promise.all([
          contactsRes.json(),
          companiesRes.json(),
          dealsRes.json(),
          ticketsRes.json(),
        ]);

        setMetrics([
          { label: "Total Contacts", icon: Users, value: contacts.total },
          {
            label: "Total Companies",
            icon: Building2,
            value: companies.total,
          },
          { label: "Open Deals", icon: DollarSign, value: deals.total },
          { label: "Open Tickets", icon: Ticket, value: tickets.total },
        ]);
      } catch {
        // Keep null values on error
      }
    }

    async function fetchRecentContacts() {
      try {
        const res = await fetch(
          "/api/contacts?pageSize=5&sortBy=createdAt&sortOrder=desc"
        );
        const data = await res.json();
        setRecentContacts(data.data);
      } catch {
        // Keep empty on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
    fetchRecentContacts();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))
          : metrics.map((card) => (
              <MetricCardDisplay key={card.label} card={card} />
            ))}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Recent Contacts</h2>
        {isLoading ? (
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b last:border-0 text-sm"
                    >
                      <td className="px-4 py-3 font-medium">
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contact.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contact.companyName ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(contact.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
