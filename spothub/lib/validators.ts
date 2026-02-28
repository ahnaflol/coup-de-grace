export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null; // Phone is optional
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "Phone number must have at least 10 digits";
  return null;
}

export function validatePositiveNumber(value: number | null, fieldName: string): string | null {
  if (value === null || value === undefined) return null;
  if (isNaN(value) || value < 0) return `${fieldName} must be a positive number`;
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url) return null; // URL is optional
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return null;
  } catch {
    return "Invalid URL format";
  }
}

export function validateFutureDate(dateString: string, fieldName: string): string | null {
  if (!dateString) return `${fieldName} is required`;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return `Invalid ${fieldName}`;
  return null;
}
