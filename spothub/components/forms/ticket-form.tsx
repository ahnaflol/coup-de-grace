"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  OWNERS,
} from "@/lib/constants";
import { validateRequired } from "@/lib/validators";
import type { FormRef } from "./contact-form";

interface TicketFormProps {
  ticket?: Ticket;
  onSubmit: (data: Partial<Ticket>) => void;
  isLoading: boolean;
}

export const TicketForm = forwardRef<FormRef, TicketFormProps>(
  function TicketForm({ ticket, onSubmit, isLoading }, ref) {
    const [subject, setSubject] = useState(ticket?.subject ?? "");
    const [status, setStatus] = useState<TicketStatus>(
      ticket?.status ?? "new"
    );
    const [priority, setPriority] = useState<TicketPriority>(
      ticket?.priority ?? "medium"
    );
    const [category, setCategory] = useState<TicketCategory>(
      ticket?.category ?? "general_inquiry"
    );
    const [contactId, setContactId] = useState(ticket?.contactId ?? "");
    const [companyId, setCompanyId] = useState(ticket?.companyId ?? "");
    const [owner, setOwner] = useState(ticket?.owner ?? "");
    const [description, setDescription] = useState(ticket?.description ?? "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit() {
      const newErrors: Record<string, string> = {};

      const subjectError = validateRequired(subject, "Subject");
      if (subjectError) newErrors.subject = subjectError;

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      onSubmit({
        subject,
        status,
        priority,
        category,
        contactId: contactId || null,
        companyId: companyId || null,
        owner,
        description,
      });
    }

    useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ticket subject"
          />
          {errors.subject && (
            <p className="text-sm text-red-500">{errors.subject}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as TicketStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TicketPriority)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority..." />
            </SelectTrigger>
            <SelectContent>
              {TICKET_PRIORITIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as TicketCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {TICKET_CATEGORIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Owner</Label>
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select owner..." />
            </SelectTrigger>
            <SelectContent>
              {OWNERS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactId">Contact ID</Label>
          <Input
            id="contactId"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            placeholder="Contact ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyId">Company ID</Label>
          <Input
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Company ID"
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={3}
          />
        </div>
      </div>
    );
  }
);
