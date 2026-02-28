"use client";

import { useState } from "react";
import { Plus, Users, Building2, DollarSign, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityFormModal } from "@/components/forms/entity-form-modal";
import {
  LIFECYCLE_STAGES,
  INDUSTRIES,
  COMPANY_SIZES,
  DEAL_STAGES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
} from "@/lib/constants";
import type { EntityType } from "@/types";

const ENTITY_OPTIONS = [
  { type: "contact" as EntityType, label: "New Contact", icon: Users },
  { type: "company" as EntityType, label: "New Company", icon: Building2 },
  { type: "deal" as EntityType, label: "New Deal", icon: DollarSign },
  { type: "ticket" as EntityType, label: "New Ticket", icon: Ticket },
] as const;

const ENTITY_TITLES: Record<EntityType, string> = {
  contact: "Create Contact",
  company: "Create Company",
  deal: "Create Deal",
  ticket: "Create Ticket",
};

function getDefaultValues(type: EntityType): Record<string, string> {
  switch (type) {
    case "contact":
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        lifecycleStage: "lead",
        owner: "Jordan Davis",
      };
    case "company":
      return {
        name: "",
        domain: "",
        industry: "technology",
        size: "1-10",
        phone: "",
        owner: "Jordan Davis",
      };
    case "deal":
      return {
        name: "",
        amount: "0",
        stage: "appointment_scheduled",
        closeDate: new Date().toISOString().split("T")[0],
        priority: "medium",
        probability: "50",
        owner: "Jordan Davis",
      };
    case "ticket":
      return {
        subject: "",
        status: "new",
        priority: "medium",
        category: "general_inquiry",
        description: "",
        owner: "Jordan Davis",
      };
  }
}

export function QuickCreateMenu() {
  const [modalType, setModalType] = useState<EntityType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  function openModal(type: EntityType) {
    setFormData(getDefaultValues(type));
    setModalType(type);
  }

  function closeModal() {
    setModalType(null);
    setFormData({});
  }

  async function handleSubmit() {
    if (!modalType) return;
    setIsLoading(true);

    try {
      const body =
        modalType === "deal"
          ? {
              ...formData,
              amount: Number(formData.amount),
              probability: Number(formData.probability),
            }
          : formData;

      const res = await fetch(`/api/${modalType}s`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create");

      closeModal();
    } catch {
      // Error handling can be enhanced later
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" className="rounded-full">
            <Plus className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ENTITY_OPTIONS.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => openModal(type)}>
              <Icon className="mr-2 size-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {modalType && (
        <EntityFormModal
          open={!!modalType}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          title={ENTITY_TITLES[modalType]}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        >
          <QuickCreateForm
            type={modalType}
            data={formData}
            onChange={updateField}
          />
        </EntityFormModal>
      )}
    </>
  );
}

function QuickCreateForm({
  type,
  data,
  onChange,
}: {
  type: EntityType;
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  switch (type) {
    case "contact":
      return (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First Name"
            value={data.firstName}
            onChange={(v) => onChange("firstName", v)}
            required
          />
          <FormField
            label="Last Name"
            value={data.lastName}
            onChange={(v) => onChange("lastName", v)}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={data.email}
            onChange={(v) => onChange("email", v)}
            required
          />
          <FormField
            label="Phone"
            value={data.phone}
            onChange={(v) => onChange("phone", v)}
          />
          <FormField
            label="Job Title"
            value={data.jobTitle}
            onChange={(v) => onChange("jobTitle", v)}
          />
          <FormSelect
            label="Lifecycle Stage"
            value={data.lifecycleStage}
            onChange={(v) => onChange("lifecycleStage", v)}
            options={LIFECYCLE_STAGES}
          />
        </div>
      );
    case "company":
      return (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Company Name"
            value={data.name}
            onChange={(v) => onChange("name", v)}
            required
          />
          <FormField
            label="Domain"
            value={data.domain}
            onChange={(v) => onChange("domain", v)}
            required
          />
          <FormSelect
            label="Industry"
            value={data.industry}
            onChange={(v) => onChange("industry", v)}
            options={INDUSTRIES}
          />
          <FormSelect
            label="Company Size"
            value={data.size}
            onChange={(v) => onChange("size", v)}
            options={COMPANY_SIZES}
          />
          <FormField
            label="Phone"
            value={data.phone}
            onChange={(v) => onChange("phone", v)}
          />
        </div>
      );
    case "deal":
      return (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Deal Name"
            value={data.name}
            onChange={(v) => onChange("name", v)}
            required
          />
          <FormField
            label="Amount"
            type="number"
            value={data.amount}
            onChange={(v) => onChange("amount", v)}
            required
          />
          <FormSelect
            label="Stage"
            value={data.stage}
            onChange={(v) => onChange("stage", v)}
            options={DEAL_STAGES}
          />
          <FormField
            label="Close Date"
            type="date"
            value={data.closeDate}
            onChange={(v) => onChange("closeDate", v)}
            required
          />
          <FormSelect
            label="Priority"
            value={data.priority}
            onChange={(v) => onChange("priority", v)}
            options={TICKET_PRIORITIES}
          />
          <FormField
            label="Probability (%)"
            type="number"
            value={data.probability}
            onChange={(v) => onChange("probability", v)}
          />
        </div>
      );
    case "ticket":
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField
              label="Subject"
              value={data.subject}
              onChange={(v) => onChange("subject", v)}
              required
            />
          </div>
          <FormSelect
            label="Priority"
            value={data.priority}
            onChange={(v) => onChange("priority", v)}
            options={TICKET_PRIORITIES}
          />
          <FormSelect
            label="Category"
            value={data.category}
            onChange={(v) => onChange("category", v)}
            options={TICKET_CATEGORIES}
          />
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      );
  }
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
