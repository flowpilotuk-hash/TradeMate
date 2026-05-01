function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

function normalizePostcode(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function isValidUkPostcode(value: unknown): boolean {
  const postcode = normalizePostcode(value);
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode);
}

function isValidPassword(value: unknown): boolean {
  return typeof value === "string" && value.length >= 8;
}

function isValidBusinessName(value: unknown): boolean {
  return typeof value === "string" && value.trim().length >= 2;
}

function isValidCustomerMessage(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 1000;
}

function isValidQuote(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 200;
}

export function validateTradesmanSignup(body: {
  businessName?: unknown;
  email?: unknown;
  password?: unknown;
}): string[] {
  const errors: string[] = [];

  if (!isValidBusinessName(body?.businessName)) {
    errors.push("businessName must be at least 2 characters");
  }

  if (!isValidEmail(body?.email)) {
    errors.push("email must be valid");
  }

  if (!isValidPassword(body?.password)) {
    errors.push("password must be at least 8 characters");
  }

  return errors;
}

export function validateLogin(body: {
  email?: unknown;
  password?: unknown;
}): string[] {
  const errors: string[] = [];

  if (!isValidEmail(body?.email)) {
    errors.push("email must be valid");
  }

  if (!isNonEmptyString(body?.password)) {
    errors.push("password is required");
  }

  return errors;
}

export function validateConversationMessage(body: {
  conversationId?: unknown;
  message?: unknown;
}): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(body?.conversationId)) {
    errors.push("conversationId is required");
  }

  if (!isValidCustomerMessage(body?.message)) {
    errors.push("message must be between 1 and 1000 characters");
  }

  return errors;
}

export function validateLeadCreation(body: {
  conversationId?: unknown;
}): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(body?.conversationId)) {
    errors.push("conversationId is required");
  }

  return errors;
}

export function validateQuoteBody(body: { quote?: unknown }): string[] {
  const errors: string[] = [];

  if (!isValidQuote(body?.quote)) {
    errors.push("quote must be between 3 and 200 characters");
  }

  return errors;
}

export {
  normalizeEmail,
  normalizePostcode,
  isValidEmail,
  isValidUkPostcode,
  isValidPassword,
  isValidBusinessName,
  isValidCustomerMessage,
  isValidQuote,
};