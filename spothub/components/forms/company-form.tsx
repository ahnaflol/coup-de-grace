"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import type { Company, Industry, CompanySize } from "@/types";
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
import { INDUSTRIES, COMPANY_SIZES, OWNERS } from "@/lib/constants";
import { validateRequired, validatePhone } from "@/lib/validators";
import type { FormRef } from "./contact-form";

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: Partial<Company>) => void;
  isLoading: boolean;
}

export const CompanyForm = forwardRef<FormRef, CompanyFormProps>(
  function CompanyForm({ company, onSubmit, isLoading }, ref) {
    const [name, setName] = useState(company?.name ?? "");
    const [domain, setDomain] = useState(company?.domain ?? "");
    const [industry, setIndustry] = useState<Industry>(
      company?.industry ?? "technology"
    );
    const [size, setSize] = useState<CompanySize>(company?.size ?? "1-10");
    const [annualRevenue, setAnnualRevenue] = useState(
      company?.annualRevenue?.toString() ?? ""
    );
    const [city, setCity] = useState(company?.city ?? "");
    const [state, setState] = useState(company?.state ?? "");
    const [country, setCountry] = useState(company?.country ?? "");
    const [owner, setOwner] = useState(company?.owner ?? "");
    const [phone, setPhone] = useState(company?.phone ?? "");
    const [description, setDescription] = useState(company?.description ?? "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit() {
      const newErrors: Record<string, string> = {};

      const nameError = validateRequired(name, "Company name");
      if (nameError) newErrors.name = nameError;

      const domainError = validateRequired(domain, "Domain");
      if (domainError) newErrors.domain = domainError;

      const phoneError = validatePhone(phone);
      if (phoneError) newErrors.phone = phoneError;

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      onSubmit({
        name,
        domain,
        industry,
        size,
        annualRevenue: annualRevenue ? Number(annualRevenue) : null,
        city,
        state,
        country,
        owner,
        phone,
        description,
      });
    }

    useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Company name"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain">Domain *</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
          />
          {errors.domain && (
            <p className="text-sm text-red-500">{errors.domain}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Industry</Label>
          <Select
            value={industry}
            onValueChange={(v) => setIndustry(v as Industry)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Company Size</Label>
          <Select
            value={size}
            onValueChange={(v) => setSize(v as CompanySize)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select size..." />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualRevenue">Annual Revenue</Label>
          <Input
            id="annualRevenue"
            type="number"
            value={annualRevenue}
            onChange={(e) => setAnnualRevenue(e.target.value)}
            placeholder="0"
          />
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

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
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

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Company description..."
            rows={3}
          />
        </div>
      </div>
    );
  }
);
