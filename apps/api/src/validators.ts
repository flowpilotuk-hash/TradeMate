function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

function normalizePostcode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function isValidUkPostcode(value) {
  const postcode = normalizePostcode(value);
  return /^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$/i.test(postcode);
}

function isValidPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

function isValidBusinessName(value) {
  return typeof value === "string" && value.trim().length >= 2;
}

function isValidCustomerMessage(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 1000;
}

function isValidQuote(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 200;
}

function validateTradesmanSignup(body) {
  const errors = [];

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

function validateLogin(body) {
  const errors = [];

  if (!isValidEmail(body?.email)) {
    errors.push("email must be valid");
  }

  if (!isNonEmptyString(body?.password)) {
    errors.push("password is required");
  }

  return errors;
}

function validateConversationMessage(body) {
  const errors = [];

  if (!isNonEmptyString(body?.conversationId)) {
    errors.push("conversationId is required");
  }

  if (!isValidCustomerMessage(body?.message)) {
    errors.push("message must be between 1 and 1000 characters");
  }

  return errors;
}

function validateLeadCreation(body) {
  const errors = [];

  if (!isNonEmptyString(body?.conversationId)) {
    errors.push("conversationId is required");
  }

  return errors;
}

function validateQuoteBody(body) {
  const errors = [];

  if (!isValidQuote(body?.quote)) {
    errors.push("quote must be between 3 and 200 characters");
  }

  return errors;
}

function validateConversationStateForSubmission(state) {
  const errors = [];
  const fields = state?.fields || {};

  const postcode = fields?.postcode?.value;
  const email = fields?.email?.value;

  if (postcode && !isValidUkPostcode(postcode)) {
    errors.push("postcode must be a valid UK postcode");
  }

  if (email && !isValidEmail(email)) {
    errors.push("email must be valid");
  }

  return errors;
}

module.exports = {
  normalizeEmail,
  normalizePostcode,
  isValidEmail,
  isValidUkPostcode,
  isValidPassword,
  isValidBusinessName,
  isValidCustomerMessage,
  isValidQuote,
  validateTradesmanSignup,
  validateLogin,
  validateConversationMessage,
  validateLeadCreation,
  validateQuoteBody,
  validateConversationStateForSubmission,
};
