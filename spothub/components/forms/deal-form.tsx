"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import type { Deal, DealStage } from "@/types";
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
import { DEAL_STAGES, OWNERS } from "@/lib/constants";
import { validateRequired, validatePositiveNumber } from "@/lib/validators";
import type { FormRef } from "./contact-form";

interface DealFormProps {
  deal?: Deal;
  onSubmit: (data: Partial<Deal>) => void;
  isLoading: boolean;
}

const DEAL_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const DealForm = forwardRef<FormRef, DealFormProps>(
  function DealForm({ deal, onSubmit, isLoading }, ref) {
    const [name, setName] = useState(deal?.name ?? "");
    const [amount, setAmount] = useState(deal?.amount?.toString() ?? "");
    const [stage, setStage] = useState<DealStage>(
      deal?.stage ?? "appointment_scheduled"
    );
    const [closeDate, setCloseDate] = useState(
      deal?.closeDate ? deal.closeDate.split("T")[0] : ""
    );
    const [companyId, setCompanyId] = useState(deal?.companyId ?? "");
    const [contactId, setContactId] = useState(deal?.contactId ?? "");
    const [owner, setOwner] = useState(deal?.owner ?? "");
    const [priority, setPriority] = useState<"low" | "medium" | "high">(
      deal?.priority ?? "medium"
    );
    const [description, setDescription] = useState(deal?.description ?? "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit() {
      const newErrors: Record<string, string> = {};

      const nameError = validateRequired(name, "Deal name");
      if (nameError) newErrors.name = nameError;

      const amountError = validateRequired(amount, "Amount");
      if (amountError) {
        newErrors.amount = amountError;
      } else {
        const numError = validatePositiveNumber(Number(amount), "Amount");
        if (numError) newErrors.amount = numError;
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      onSubmit({
        name,
        amount: Number(amount),
        stage,
        closeDate: closeDate || new Date().toISOString(),
        companyId: companyId || null,
        contactId: contactId || null,
        owner,
        priority,
        description,
      });
    }

    useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Deal Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Deal name"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Stage</Label>
          <Select
            value={stage}
            onValueChange={(v) => setStage(v as DealStage)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage..." />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="closeDate">Close Date</Label>
          <Input
            id="closeDate"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
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
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority..." />
            </SelectTrigger>
            <SelectContent>
              {DEAL_PRIORITIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deal description..."
            rows={3}
          />
        </div>
      </div>
    );
  }
);
