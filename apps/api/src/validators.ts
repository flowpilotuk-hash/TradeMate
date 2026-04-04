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

function hasFieldValue(
  fields: Record<string, { value?: unknown } | undefined> | undefined,
  key: string
): boolean {
  const entry = fields?.[key];

  if (!entry || typeof entry !== "object") {
    return false;
  }

  const value = entry.value;

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
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

export function validateConversationStateForSubmission(state: {
  fields?: Record<string, { value?: unknown } | undefined>;
}): string[] {
  const errors: string[] = [];
  const fields = state?.fields || {};

  const postcode = fields?.postcode?.value;
  const email = fields?.email?.value;

  if (!hasFieldValue(fields, "jobType")) {
    errors.push("jobType is required");
  }

  if (!postcode) {
    errors.push("postcode is required");
  } else if (!isValidUkPostcode(postcode)) {
    errors.push("postcode must be a valid UK postcode");
  }

  if (!hasFieldValue(fields, "kitchenSize")) {
    errors.push("kitchenSize is required");
  }

  if (!hasFieldValue(fields, "layoutChange")) {
    errors.push("layoutChange is required");
  }

  if (!hasFieldValue(fields, "unitsSupply")) {
    errors.push("unitsSupply is required");
  }

  if (!hasFieldValue(fields, "timeline")) {
    errors.push("timeline is required");
  }

  if (!hasFieldValue(fields, "budget")) {
    errors.push("budget is required");
  }

  if (!hasFieldValue(fields, "firstName")) {
    errors.push("firstName is required");
  }

  if (!email) {
    errors.push("email is required");
  } else if (!isValidEmail(email)) {
    errors.push("email must be valid");
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