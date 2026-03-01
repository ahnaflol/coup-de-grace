"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import type { Contact, LifecycleStage } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFECYCLE_STAGES, OWNERS } from "@/lib/constants";
import {
  validateRequired,
  validateEmail,
  validatePhone,
} from "@/lib/validators";

export interface FormRef {
  submit: () => void;
}

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: Partial<Contact>) => void;
  isLoading: boolean;
}

export const ContactForm = forwardRef<FormRef, ContactFormProps>(
  function ContactForm({ contact, onSubmit, isLoading }, ref) {
    const [firstName, setFirstName] = useState(contact?.firstName ?? "");
    const [lastName, setLastName] = useState(contact?.lastName ?? "");
    const [email, setEmail] = useState(contact?.email ?? "");
    const [phone, setPhone] = useState(contact?.phone ?? "");
    const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(
      contact?.lifecycleStage ?? "subscriber"
    );
    const [owner, setOwner] = useState(contact?.owner ?? "");
    const [jobTitle, setJobTitle] = useState(contact?.jobTitle ?? "");
    const [city, setCity] = useState(contact?.city ?? "");
    const [state, setState] = useState(contact?.state ?? "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit() {
      const newErrors: Record<string, string> = {};

      const firstNameError = validateRequired(firstName, "First name");
      if (firstNameError) newErrors.firstName = firstNameError;

      const lastNameError = validateRequired(lastName, "Last name");
      if (lastNameError) newErrors.lastName = lastNameError;

      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;

      const phoneError = validatePhone(phone);
      if (phoneError) newErrors.phone = phoneError;

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      onSubmit({
        firstName,
        lastName,
        email,
        phone,
        // SH-SEED-010 (intentional): default "subscriber" is saved as "lead" instead.
        lifecycleStage:
          (lifecycleStage === "subscriber" ? "lead" : lifecycleStage) as LifecycleStage,
        owner,
        jobTitle,
        city,
        state,
      });
    }

    useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Lifecycle Stage</Label>
          <Select
            value={lifecycleStage}
            onValueChange={(v) => setLifecycleStage(v as LifecycleStage)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage..." />
            </SelectTrigger>
            <SelectContent>
              {LIFECYCLE_STAGES.map((opt) => (
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
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
          />
        </div>
      </div>
    );
  }
);
