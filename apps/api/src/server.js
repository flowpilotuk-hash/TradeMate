require("dotenv").config();

const { createServer } = require("http");
const {
  createConversation,
  getConversation,
  updateConversation,
} = require("./conversation-store");
const {
  createLead,
  listLeads,
  getLead,
  updateLead,
} = require("./lead-store");
const {
  createTradesman,
  getTradesmanById,
  getTradesmanBySlug,
  getTradesmanByEmail,
  getTradesmanByStripeCustomerId,
  listTradesmen,
  updateTradesman,
  sanitizeTradesman,
  seedDefaultTradesman,
} = require("./tradesman-store");
const {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} = require("./auth");
const {
  sendNewLeadNotification,
  sendQuoteNotification,
  sendCustomerEnquiryConfirmation,
} = require("./notifications");
const {
  validateTradesmanSignup,
  validateLogin,
  validateConversationMessage,
  validateLeadCreation,
  validateQuoteBody,
  validateConversationStateForSubmission,
} = require("./validators");
const { rateLimit } = require("./rate-limit");
const {
  createCheckoutSession,
  constructWebhookEvent,
} = require("./stripe");

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 4000);

const DEFAULT_APP_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://flowpilotgroup.com"
    : "http://localhost:3000";

const DEFAULT_ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? [
        "https://flowpilotgroup.com",
        "https://www.flowpilotgroup.com",
        "https://flowpilotgroup.vercel.app",
      ]
    : ["http://localhost:3000"];

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

function normalizeBaseUrl(url, fallback) {
  return String(url || fallback).trim().replace(/\/+$/, "");
}

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  process.env.ALLOWED_ORIGIN ||
  DEFAULT_ALLOWED_ORIGINS.join(",")
)
  .split(",")
  .map((value) => normalizeOrigin(value))
  .filter(Boolean);

const APP_BASE_URL = normalizeBaseUrl(
  process.env.APP_BASE_URL,
  DEFAULT_APP_BASE_URL
);

function logInfo(event, data = {}) {
  console.log(
    JSON.stringify({
      level: "info",
      event,
      at: new Date().toISOString(),
      ...data,
    })
  );
}

function logError(event, error, data = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      at: new Date().toISOString(),
      message: error?.message || "Unknown error",
      ...data,
    })
  );
}

function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return true;
  }

  if (normalized.endsWith(".vercel.app")) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(normalized);
}

function getAllowedOrigin(req) {
  const requestOrigin = normalizeOrigin(req.headers.origin);

  if (!requestOrigin) {
    return "*";
  }

  if (isAllowedOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return ALLOWED_ORIGINS[0] || normalizeOrigin(DEFAULT_ALLOWED_ORIGINS[0]);
}

function writeCorsHeaders(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function sendJson(res, statusCode, payload, origin) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  writeCorsHeaders(res, origin);
  res.end(JSON.stringify(payload));
}

function sendEmpty(res, statusCode, origin) {
  res.statusCode = statusCode;
  writeCorsHeaders(res, origin);
  res.end();
}

function rejectDisallowedOrigin(req, res) {
  const requestOrigin = normalizeOrigin(req.headers.origin);

  if (!requestOrigin) {
    return false;
  }

  if (!isAllowedOrigin(requestOrigin)) {
    logError(
      "cors.origin_blocked",
      new Error("Origin not allowed"),
      {
        requestOrigin,
        allowedOrigins: ALLOWED_ORIGINS,
        path: req.url || null,
        method: req.method || null,
      }
    );

    sendJson(
      res,
      403,
      {
        error: "Origin not allowed",
        origin: requestOrigin,
      },
      ALLOWED_ORIGINS[0] || normalizeOrigin(DEFAULT_ALLOWED_ORIGINS[0])
    );
    return true;
  }

  return false;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getRequestUrl(req) {
  return new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
}

function createInitialConversationStateV1(args) {
  return {
    version: 1,
    tradeKind: "KITCHEN",
    phase: "COLLECTING",
    fields: {},
    meta: {
      askedCounts: {},
      timelineSpecific: false,
      photoMissing: true,
      contactRequested: false,
      handoffReady: false,
      tradesmanId: args.tradesmanId || null,
      tradesmanSlug: args.tradesmanSlug || null,
      tradesmanBusinessName: args.tradesmanBusinessName || null,
    },
    budget: {
      disclosure: "NOT_DISCLOSED",
      signal: "UNCLEAR",
      risk: "MEDIUM",
      indicators: {},
    },
    classification: {
      completion: "PARTIAL",
      actionable: false,
      flags: [],
    },
    audit: {
      lastUserMessageAt: args.nowIso,
      turnCount: 0,
    },
  };
}

function recomputeDerivedState(state) {
  const f = state.fields || {};

  const missingProjectFields = [];
  if (!f.jobType) missingProjectFields.push("jobType");
  if (!f.postcode) missingProjectFields.push("postcode");
  if (!f.kitchenSize) missingProjectFields.push("kitchenSize");
  if (!f.layoutChange) missingProjectFields.push("layoutChange");
  if (!f.unitsSupply) missingProjectFields.push("unitsSupply");
  if (!f.timeline) missingProjectFields.push("timeline");
  if (!f.budget) missingProjectFields.push("budget");

  const missingContactFields = [];
  if (!f.firstName) missingContactFields.push("firstName");
  if (!f.email) missingContactFields.push("email");

  const hasAtLeastFourProjectFields = 7 - missingProjectFields.length >= 4;

  const contactRequiredNow =
    !state.meta.contactRequested &&
    missingContactFields.length > 0 &&
    hasAtLeastFourProjectFields;

  const isFull =
    missingProjectFields.length === 0 && missingContactFields.length === 0;

  const nextPhase = isFull
    ? "READY_FOR_HANDOFF"
    : contactRequiredNow
      ? "AWAITING_CONTACT"
      : "COLLECTING";

  const photoMissing =
    !f.photos || !f.photos.value || ((f.photos.value.assetIds || []).length === 0);

  const flags = [];
  if (state.meta.timelineSpecific) flags.push("TIME_SENSITIVE");
  if (photoMissing) flags.push("PHOTO_MISSING");
  flags.push("BUDGET_MEDIUM_RISK");

  return {
    ...state,
    phase: nextPhase,
    meta: {
      ...state.meta,
      photoMissing,
      handoffReady: isFull,
      contactRequested: state.meta.contactRequested || contactRequiredNow,
    },
    budget: {
      ...state.budget,
      risk: "MEDIUM",
    },
    classification: {
      completion: isFull ? "FULL" : "PARTIAL",
      actionable: Boolean(f.firstName && f.email),
      flags,
    },
  };
}

function applyValidatedUpdates(args) {
  let next = {
    ...args.state,
    audit: {
      ...args.state.audit,
      lastUserMessageAt: args.nowIso,
      turnCount: ((args.state.audit && args.state.audit.turnCount) || 0) + 1,
    },
  };

  if (args.timelineSpecific === true) {
    next = {
      ...next,
      meta: {
        ...next.meta,
        timelineSpecific: true,
      },
    };
  }

  for (const u of args.updates || []) {
    next.fields = next.fields || {};
    next.fields[u.key] = {
      value: u.value,
      source: u.source || "ai",
      confidence: typeof u.confidence === "number" ? u.confidence : 0.8,
      updatedAt: args.nowIso,
    };
  }

  return recomputeDerivedState(next);
}

function extractUpdatesFromMessage(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  const updates = [];
  let timelineSpecific = false;

  const postcodeMatch = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
  if (postcodeMatch) {
    updates.push({
      key: "postcode",
      value: postcodeMatch[1].toUpperCase().replace(/\s+/, " "),
      confidence: 0.94,
      source: "ai",
    });
  }

  const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  if (emailMatch) {
    updates.push({
      key: "email",
      value: emailMatch[0],
      confidence: 0.99,
      source: "ai",
    });
  }

  const phoneMatch = text.match(/\b(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}\b/);
  if (phoneMatch) {
    updates.push({
      key: "phone",
      value: phoneMatch[0].trim(),
      confidence: 0.92,
      source: "ai",
    });
  }

  if (/\bworktops?\b/.test(lower)) {
    updates.push({ key: "jobType", value: "WORKTOPS", confidence: 0.91, source: "ai" });
  } else if (/\b(refresh|doors only|replacement doors)\b/.test(lower)) {
    updates.push({ key: "jobType", value: "REFRESH", confidence: 0.9, source: "ai" });
  } else if (/\bkitchen\b/.test(lower)) {
    updates.push({ key: "jobType", value: "FULL_FIT", confidence: 0.82, source: "ai" });
  }

  if (/\bsmall\b/.test(lower)) {
    updates.push({ key: "kitchenSize", value: "SMALL", confidence: 0.9, source: "ai" });
  } else if (/\bmedium\b/.test(lower)) {
    updates.push({ key: "kitchenSize", value: "MEDIUM", confidence: 0.9, source: "ai" });
  } else if (/\blarge\b/.test(lower)) {
    updates.push({ key: "kitchenSize", value: "LARGE", confidence: 0.9, source: "ai" });
  }

  if (/\b(keeping the layout|same layout|no layout change)\b/.test(lower)) {
    updates.push({ key: "layoutChange", value: "NONE", confidence: 0.88, source: "ai" });
  } else if (/\b(minor changes|small changes|move a few things)\b/.test(lower)) {
    updates.push({ key: "layoutChange", value: "MINOR", confidence: 0.88, source: "ai" });
  } else if (/\b(major changes|full layout change|moving everything)\b/.test(lower)) {
    updates.push({ key: "layoutChange", value: "MAJOR", confidence: 0.88, source: "ai" });
  }

  if (
    /\b(i['’]?ll supply the units|i will supply the units|customer supplied|already have the units)\b/.test(lower)
  ) {
    updates.push({ key: "unitsSupply", value: "CUSTOMER_SUPPLIED", confidence: 0.88, source: "ai" });
  } else if (/\b(you supply|supply and fit|need you to supply)\b/.test(lower)) {
    updates.push({ key: "unitsSupply", value: "FITTER_SUPPLIED", confidence: 0.88, source: "ai" });
  } else if (/\b(not sure|unsure)\b/.test(lower)) {
    updates.push({ key: "unitsSupply", value: "UNSURE", confidence: 0.88, source: "ai" });
  }

  const firstNameMatch =
    text.match(/\bmy name is\s+([A-Za-z]+)/i) ||
    text.match(/\bi['’]?m\s+([A-Za-z]+)/i) ||
    text.match(/\bi am\s+([A-Za-z]+)/i);

  if (firstNameMatch) {
    const rawName = firstNameMatch[1];
    const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    updates.push({
      key: "firstName",
      value: normalizedName,
      confidence: 0.9,
      source: "ai",
    });
  }

  const lowBudgetSignal =
    /\b(cheap as possible|lowest price|keep it under 5k|very tight budget)\b/.test(lower);

  const budgetRangeMatch =
    text.match(/\bbetween\s+£?\s?(\d+(?:[.,]\d+)?)\s?k?\s+and\s+£?\s?(\d+(?:[.,]\d+)?)\s?k?\b/i);

  const explicitBudgetMatch =
    text.match(/\b(?:budget is|budget|around|about|roughly|under|up to)\s+£?\s?(\d+(?:[.,]\d+)?)\s?k\b/i) ||
    text.match(/\b£\s?(\d+(?:[.,]\d+)?)\s?k?\b/i) ||
    text.match(/\b(\d+(?:[.,]\d+)?)\s?k\b/i);

  if (budgetRangeMatch) {
    updates.push({
      key: "budget",
      value: {
        disclosure: "EXPLICIT",
        signal: lowBudgetSignal ? "LOW" : "UNCLEAR",
        risk: "MEDIUM",
        indicators: { notes: budgetRangeMatch[0] },
      },
      confidence: 0.9,
      source: "ai",
    });
  } else if (explicitBudgetMatch) {
    updates.push({
      key: "budget",
      value: {
        disclosure: "EXPLICIT",
        signal: lowBudgetSignal ? "LOW" : "UNCLEAR",
        risk: "MEDIUM",
        indicators: { notes: explicitBudgetMatch[0] },
      },
      confidence: 0.9,
      source: "ai",
    });
  } else if (/\b(not sure on budget|unsure on budget|don't know the budget|no idea on budget)\b/.test(lower)) {
    updates.push({
      key: "budget",
      value: {
        disclosure: "NOT_DISCLOSED",
        signal: "UNCLEAR",
        risk: "MEDIUM",
        indicators: { notes: "budget unknown" },
      },
      confidence: 0.85,
      source: "ai",
    });
  } else if (lowBudgetSignal) {
    updates.push({
      key: "budget",
      value: {
        disclosure: "INDIRECT",
        signal: "LOW",
        risk: "MEDIUM",
        indicators: { notes: "low budget signal" },
      },
      confidence: 0.85,
      source: "ai",
    });
  }

  if (/\b(asap|urgent|straight away)\b/.test(lower)) {
    updates.push({ key: "timeline", value: "ASAP", confidence: 0.96, source: "ai" });
    timelineSpecific = true;
  } else if (/\b(next month|in a month|within 3 months)\b/.test(lower)) {
    updates.push({ key: "timeline", value: "1_3_MONTHS", confidence: 0.9, source: "ai" });
    timelineSpecific = true;
  } else if (/\b(in 3 months|in 4 months|in 6 months)\b/.test(lower)) {
    updates.push({ key: "timeline", value: "3_6_MONTHS", confidence: 0.89, source: "ai" });
    timelineSpecific = true;
  } else if (/\b(later this year|next year|no rush)\b/.test(lower)) {
    updates.push({ key: "timeline", value: "6_PLUS", confidence: 0.88, source: "ai" });
    timelineSpecific = true;
  }

  return { updates, timelineSpecific };
}

function getNextQuestion(state) {
  const fields = (state && state.fields) || {};

  const orderedFields = [
    { key: "jobType", question: "Are you looking for a full kitchen fit, a refresh, or worktops only?" },
    { key: "postcode", question: "What postcode is the property in?" },
    { key: "kitchenSize", question: "Roughly what size is the kitchen - small, medium, or large?" },
    { key: "layoutChange", question: "Are you keeping the current layout, making minor changes, or changing it significantly?" },
    { key: "unitsSupply", question: "Will you be supplying the units, or are you looking for supply and fit?" },
    { key: "timeline", question: "When were you hoping to get this done?" },
    { key: "budget", question: "Just so we're aligned, what sort of budget range did you have in mind for the project?" },
    { key: "firstName", question: "Can I grab your first name?" },
    { key: "email", question: "What's the best email to send the confirmation to?" },
  ];

  for (const field of orderedFields) {
    const value = fields[field.key];
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");

    if (isMissing) {
      return {
        nextField: field.key,
        question: field.question,
        reply: field.question,
      };
    }
  }

  return {
    nextField: null,
    question: null,
    reply: "Thanks - I've got everything I need for now. I'll pass this over for review.",
  };
}

function parseLeadIdFromUrl(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 2 && parts[0] === "leads" ? decodeURIComponent(parts[1]) : null;
}

function parseTradesmanSlugFromUrl(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 2 && parts[0] === "tradesman" ? decodeURIComponent(parts[1]) : null;
}

function normalizeQuoteText(input) {
  return String(input || "")
    .replace(/�/g, "GBP ")
    .replace(/£/g, "GBP ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTradesmanFromConversationState(state) {
  return {
    tradesmanId: state?.meta?.tradesmanId || null,
    tradesmanSlug: state?.meta?.tradesmanSlug || null,
    tradesmanBusinessName: state?.meta?.tradesmanBusinessName || null,
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

async function getAuthenticatedTradesman(req) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.tradesmanId) {
    return null;
  }

  return getTradesmanById(payload.tradesmanId);
}

async function requireAuth(req, res) {
  const tradesman = await getAuthenticatedTradesman(req);
  if (!tradesman) {
    sendJson(res, 401, { error: "Unauthorized" }, getAllowedOrigin(req));
    return null;
  }
  return tradesman;
}

async function ensureLeadExists(res, req, leadId) {
  const lead = await getLead(leadId);
  if (!lead) {
    sendJson(res, 404, { error: "Lead not found" }, getAllowedOrigin(req));
    return null;
  }
  return lead;
}

function ensureLeadOwnership(res, req, lead, tradesman) {
  if (!lead || !tradesman) {
    return false;
  }

  if (lead.tradesmanId !== tradesman.tradesmanId) {
    sendJson(res, 403, { error: "Forbidden" }, getAllowedOrigin(req));
    return false;
  }

  return true;
}

function ensureValidTransition(currentStatus, nextStatus) {
  if (nextStatus === "APPROVED") return currentStatus === "NEW";
  if (nextStatus === "REJECTED") return currentStatus === "NEW";
  if (nextStatus === "QUOTED") return currentStatus === "APPROVED";
  return false;
}

function ensureSubscriptionActive(res, req, tradesman) {
  if (!tradesman) {
    return false;
  }

  if (tradesman.subscriptionStatus !== "ACTIVE") {
    sendJson(
      res,
      402,
      { error: "Payment Required", subscriptionStatus: tradesman.subscriptionStatus },
      getAllowedOrigin(req)
    );
    return false;
  }

  return true;
}

function isActiveStripeSubscriptionStatus(status) {
  return status === "active" || status === "trialing";
}

function isTerminalInactiveStripeSubscriptionStatus(status) {
  return (
    status === "canceled" ||
    status === "unpaid" ||
    status === "paused" ||
    status === "incomplete_expired"
  );
}

function resolveNextSubscriptionStatus(currentStatus, stripeStatus) {
  const normalizedCurrent = String(currentStatus || "").trim().toUpperCase() || "INACTIVE";
  const normalizedStripe = String(stripeStatus || "").trim().toLowerCase();

  if (normalizedCurrent === "ACTIVE") {
    if (isTerminalInactiveStripeSubscriptionStatus(normalizedStripe)) {
      return "INACTIVE";
    }
    return "ACTIVE";
  }

  if (isActiveStripeSubscriptionStatus(normalizedStripe)) {
    return "ACTIVE";
  }

  if (isTerminalInactiveStripeSubscriptionStatus(normalizedStripe)) {
    return "INACTIVE";
  }

  return normalizedCurrent;
}

async function resolveTradesmanForCheckoutSession(session) {
  const tradesmanId =
    session?.metadata?.tradesmanId ||
    session?.client_reference_id ||
    null;

  if (tradesmanId) {
    const byId = await getTradesmanById(tradesmanId);
    if (byId) {
      return byId;
    }
  }

  const stripeCustomerId =
    typeof session?.customer === "string" ? session.customer : null;

  if (stripeCustomerId) {
    const byCustomer = await getTradesmanByStripeCustomerId(stripeCustomerId);
    if (byCustomer) {
      return byCustomer;
    }
  }

  const email =
    session?.customer_details?.email ||
    session?.customer_email ||
    session?.metadata?.tradesmanEmail ||
    null;

  if (email) {
    const byEmail = await getTradesmanByEmail(String(email).trim().toLowerCase());
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

async function resolveTradesmanForSubscription(subscription) {
  const tradesmanId = subscription?.metadata?.tradesmanId || null;

  if (tradesmanId) {
    const byId = await getTradesmanById(tradesmanId);
    if (byId) {
      return byId;
    }
  }

  const stripeCustomerId =
    typeof subscription?.customer === "string" ? subscription.customer : null;

  if (stripeCustomerId) {
    const byCustomer = await getTradesmanByStripeCustomerId(stripeCustomerId);
    if (byCustomer) {
      return byCustomer;
    }
  }

  return null;
}

async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;

  const paymentStatus = String(session?.payment_status || "").toLowerCase();
  const sessionStatus = String(session?.status || "").toLowerCase();

  if (paymentStatus && paymentStatus !== "paid" && paymentStatus !== "no_payment_required") {
    logInfo("billing.checkout.completed.ignored_unpaid", {
      eventId: event.id || null,
      sessionId: session?.id || null,
      paymentStatus,
      sessionStatus,
    });
    return;
  }

  if (sessionStatus && sessionStatus !== "complete") {
    logInfo("billing.checkout.completed.ignored_incomplete", {
      eventId: event.id || null,
      sessionId: session?.id || null,
      paymentStatus,
      sessionStatus,
    });
    return;
  }

  const tradesman = await resolveTradesmanForCheckoutSession(session);
  const stripeCustomerId =
    typeof session?.customer === "string" ? session.customer : null;
  const stripeSubscriptionId =
    typeof session?.subscription === "string" ? session.subscription : null;

  if (!tradesman) {
    logError(
      "billing.checkout.completed.no_match",
      new Error("Unable to match tradesman for checkout session"),
      {
        eventId: event.id || null,
        sessionId: session?.id || null,
        tradesmanIdFromMetadata: session?.metadata?.tradesmanId || null,
        clientReferenceId: session?.client_reference_id || null,
        stripeCustomerId,
        stripeSubscriptionId,
        email:
          session?.customer_details?.email ||
          session?.customer_email ||
          session?.metadata?.tradesmanEmail ||
          null,
      }
    );
    return;
  }

  await updateTradesman(tradesman.tradesmanId, {
    subscriptionStatus: "ACTIVE",
    stripeCustomerId,
    stripeSubscriptionId,
    stripeCheckoutSessionId: session?.id || null,
    plan: tradesman.plan || "starter",
  });

  logInfo("billing.checkout.completed", {
    eventId: event.id || null,
    tradesmanId: tradesman.tradesmanId,
    sessionId: session?.id || null,
    stripeCustomerId,
    stripeSubscriptionId,
  });
}

async function handleSubscriptionCreatedOrUpdated(event) {
  const subscription = event.data.object;
  const stripeCustomerId =
    typeof subscription?.customer === "string" ? subscription.customer : null;
  const stripeSubscriptionId = subscription?.id || null;
  const stripeStatus = String(subscription?.status || "").toLowerCase();

  const tradesman = await resolveTradesmanForSubscription(subscription);

  if (!tradesman) {
    logError(
      "billing.subscription.no_match",
      new Error("Unable to match tradesman for subscription"),
      {
        eventId: event.id || null,
        eventType: event.type,
        tradesmanIdFromMetadata: subscription?.metadata?.tradesmanId || null,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeStatus,
      }
    );
    return;
  }

  const currentStatus =
    String(tradesman.subscriptionStatus || "").trim().toUpperCase() || "INACTIVE";
  const nextStatus = resolveNextSubscriptionStatus(currentStatus, stripeStatus);

  await updateTradesman(tradesman.tradesmanId, {
    subscriptionStatus: nextStatus,
    stripeCustomerId,
    stripeSubscriptionId,
    plan: tradesman.plan || "starter",
  });

  logInfo("billing.subscription.synced", {
    eventId: event.id || null,
    eventType: event.type,
    tradesmanId: tradesman.tradesmanId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeStatus,
    currentStatus,
    nextStatus,
  });
}

async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  const stripeCustomerId =
    typeof subscription?.customer === "string" ? subscription.customer : null;
  const stripeSubscriptionId = subscription?.id || null;

  const tradesman = await resolveTradesmanForSubscription(subscription);

  if (!tradesman) {
    logError(
      "billing.subscription.deleted.no_match",
      new Error("Unable to match tradesman for deleted subscription"),
      {
        eventId: event.id || null,
        tradesmanIdFromMetadata: subscription?.metadata?.tradesmanId || null,
        stripeCustomerId,
        stripeSubscriptionId,
      }
    );
    return;
  }

  await updateTradesman(tradesman.tradesmanId, {
    subscriptionStatus: "INACTIVE",
    stripeCustomerId,
    stripeSubscriptionId,
    plan: tradesman.plan || "starter",
  });

  logInfo("billing.subscription.deleted", {
    eventId: event.id || null,
    tradesmanId: tradesman.tradesmanId,
    stripeCustomerId,
    stripeSubscriptionId,
  });
}

async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      return;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionCreatedOrUpdated(event);
      return;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      return;

    default:
      logInfo("billing.webhook.ignored_event", {
        eventId: event.id || null,
        eventType: event.type,
      });
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = getRequestUrl(req);
  const allowedOrigin = getAllowedOrigin(req);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204, allowedOrigin);
    return;
  }

  if (requestUrl.pathname !== "/billing/webhook") {
    if (rejectDisallowedOrigin(req, res)) return;
    if (!rateLimit(req, res)) return;
  }

  logInfo("request", {
    method: req.method,
    path: requestUrl.pathname,
    host: req.headers.host || null,
    origin: req.headers.origin || null,
  });

  try {
    await seedDefaultTradesman();

    if (req.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(
        res,
        200,
        {
          status: "ok",
          appBaseUrl: APP_BASE_URL,
          allowedOrigins: ALLOWED_ORIGINS,
        },
        allowedOrigin
      );
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/billing/webhook") {
      const rawBody = await readRawBody(req);
      const signature = req.headers["stripe-signature"];

      try {
        const event = constructWebhookEvent(rawBody, signature);

        logInfo("billing.webhook.received", {
          eventId: event.id || null,
          eventType: event.type,
        });

        await handleStripeWebhookEvent(event);
        sendEmpty(res, 200, allowedOrigin);
        return;
      } catch (error) {
        logError("billing.webhook.failed", error, {
          path: requestUrl.pathname,
          signaturePresent: Boolean(signature),
        });
        sendJson(res, 400, { error: "Webhook error" }, allowedOrigin);
        return;
      }
    }

    if (req.method === "POST" && requestUrl.pathname === "/auth/login") {
      const body = await readJsonBody(req);
      const loginErrors = validateLogin(body);

      if (loginErrors.length > 0) {
        sendJson(res, 400, { error: loginErrors.join(", ") }, allowedOrigin);
        return;
      }

      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const tradesman = await getTradesmanByEmail(email);

      if (!tradesman || !verifyPassword(password, tradesman.passwordHash)) {
        sendJson(res, 401, { error: "Invalid email or password" }, allowedOrigin);
        return;
      }

      const token = createToken({
        tradesmanId: tradesman.tradesmanId,
        email: tradesman.email,
        slug: tradesman.slug,
      });

      logInfo("auth.login.success", {
        tradesmanId: tradesman.tradesmanId,
        slug: tradesman.slug,
      });

      sendJson(res, 200, { token, tradesman: sanitizeTradesman(tradesman) }, allowedOrigin);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/auth/me") {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;

      sendJson(res, 200, sanitizeTradesman(tradesman), allowedOrigin);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/tradesmen") {
      const tradesmen = await listTradesmen();
      sendJson(res, 200, tradesmen, allowedOrigin);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/tradesmen") {
      const body = await readJsonBody(req);
      const signupErrors = validateTradesmanSignup(body);

      if (signupErrors.length > 0) {
        sendJson(res, 400, { error: signupErrors.join(", ") }, allowedOrigin);
        return;
      }

      try {
        const tradesman = await createTradesman({
          businessName: String(body.businessName || "").trim(),
          email: String(body.email || "").trim().toLowerCase(),
          slug: body.slug,
          passwordHash: hashPassword(String(body.password)),
        });

        const token = createToken({
          tradesmanId: tradesman.tradesmanId,
          email: tradesman.email,
          slug: tradesman.slug,
        });

        logInfo("tradesman.created", {
          tradesmanId: tradesman.tradesmanId,
          slug: tradesman.slug,
        });

        sendJson(
          res,
          200,
          {
            token,
            tradesman: sanitizeTradesman(tradesman),
            publicChatLink: `${APP_BASE_URL}/chat/${tradesman.slug}`,
          },
          allowedOrigin
        );
        return;
      } catch (error) {
        const message = String(error?.message || "");
        const code = String(error?.code || "");

        if (
          code === "23505" ||
          message.includes("Tradesman_email_key") ||
          message.toLowerCase().includes("duplicate key")
        ) {
          sendJson(
            res,
            409,
            { error: "An account with this email already exists. Please log in." },
            allowedOrigin
          );
          return;
        }

        throw error;
      }
    }

    if (req.method === "POST" && requestUrl.pathname === "/billing/checkout") {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;

      try {
        const session = await createCheckoutSession(tradesman);

        await updateTradesman(tradesman.tradesmanId, {
          stripeCheckoutSessionId: session.id,
          stripeCustomerId:
            typeof session.customer === "string"
              ? session.customer
              : tradesman.stripeCustomerId || null,
        });

        logInfo("billing.checkout.created", {
          tradesmanId: tradesman.tradesmanId,
          sessionId: session.id,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : null,
        });

        sendJson(res, 200, { checkoutUrl: session.url }, allowedOrigin);
        return;
      } catch (error) {
        logError("billing.checkout.failed", error, {
          tradesmanId: tradesman.tradesmanId,
        });
        sendJson(
          res,
          500,
          { error: error.message || "Stripe checkout failed" },
          allowedOrigin
        );
        return;
      }
    }

    if (req.method === "GET" && requestUrl.pathname.startsWith("/tradesman/")) {
      const slug = parseTradesmanSlugFromUrl(requestUrl.pathname);
      const tradesman = slug ? await getTradesmanBySlug(slug) : null;

      if (!tradesman) {
        sendJson(res, 404, { error: "Tradesman not found" }, allowedOrigin);
        return;
      }

      sendJson(res, 200, sanitizeTradesman(tradesman), allowedOrigin);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/conversation/start") {
      const tradesmanSlug = requestUrl.searchParams.get("tradesmanSlug");
      const tradesman = tradesmanSlug ? await getTradesmanBySlug(tradesmanSlug) : null;

      if (tradesmanSlug && !tradesman) {
        sendJson(res, 404, { error: "Tradesman not found" }, allowedOrigin);
        return;
      }

      const initialState = createInitialConversationStateV1({
        nowIso: new Date().toISOString(),
        tradesmanId: tradesman?.tradesmanId || null,
        tradesmanSlug: tradesman?.slug || null,
        tradesmanBusinessName: tradesman?.businessName || null,
      });

      const created = await createConversation(initialState);
      const next = getNextQuestion(created.state);
      const initialMessages = [{ role: "bot", text: next.reply }];

      await updateConversation(created.conversationId, created.state, initialMessages);

      logInfo("conversation.started", {
        conversationId: created.conversationId,
        tradesmanSlug: tradesman?.slug || null,
      });

      const freshConversation = await getConversation(created.conversationId);

      sendJson(
        res,
        200,
        {
          conversationId: created.conversationId,
          state: freshConversation?.state || created.state,
          messages: freshConversation?.messages || initialMessages,
          nextField: next.nextField,
          question: next.question,
          reply: next.reply,
        },
        allowedOrigin
      );
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/conversation/apply-updates") {
      const body = await readJsonBody(req);

      if (!body.state || !Array.isArray(body.updates)) {
        sendJson(res, 400, { error: "state and updates required" }, allowedOrigin);
        return;
      }

      const nextState = applyValidatedUpdates({
        state: body.state,
        nowIso: new Date().toISOString(),
        updates: body.updates,
        timelineSpecific: body.timelineSpecific === true,
      });

      sendJson(res, 200, nextState, allowedOrigin);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/conversation/message") {
      const body = await readJsonBody(req);
      const conversationErrors = validateConversationMessage(body);

      if (conversationErrors.length > 0) {
        sendJson(res, 400, { error: conversationErrors.join(", ") }, allowedOrigin);
        return;
      }

      const conversationId = body.conversationId;
      const message = body.message;
      const conversation = await getConversation(conversationId);

      if (!conversation) {
        sendJson(res, 404, { error: "Conversation not found" }, allowedOrigin);
        return;
      }

      const messages = Array.isArray(conversation.messages) ? [...conversation.messages] : [];
      messages.push({ role: "user", text: String(message) });

      const extracted = extractUpdatesFromMessage(String(message));

      const nextState = applyValidatedUpdates({
        state: conversation.state,
        nowIso: new Date().toISOString(),
        updates: extracted.updates,
        timelineSpecific: extracted.timelineSpecific === true,
      });

      const next = getNextQuestion(nextState);
      messages.push({ role: "bot", text: next.reply });

      await updateConversation(conversationId, nextState, messages);

      logInfo("conversation.message", {
        conversationId,
        phase: nextState.phase,
      });

      sendJson(
        res,
        200,
        {
          conversationId,
          state: nextState,
          messages,
          nextField: next.nextField,
          question: next.question,
          reply: next.reply,
        },
        allowedOrigin
      );
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/leads/from-conversation") {
      const body = await readJsonBody(req);
      const leadCreationErrors = validateLeadCreation(body);

      if (leadCreationErrors.length > 0) {
        sendJson(res, 400, { error: leadCreationErrors.join(", ") }, allowedOrigin);
        return;
      }

      const conversationId = body.conversationId;
      const conversation = await getConversation(conversationId);

      if (!conversation) {
        sendJson(res, 404, { error: "Conversation not found" }, allowedOrigin);
        return;
      }

      const submissionErrors = validateConversationStateForSubmission(conversation.state);
      if (submissionErrors.length > 0) {
        sendJson(res, 400, { error: submissionErrors.join(", ") }, allowedOrigin);
        return;
      }

      const ownership = getTradesmanFromConversationState(conversation.state);

      const lead = await createLead({
        createdAt: new Date().toISOString(),
        status: "NEW",
        tradesmanId: ownership.tradesmanId,
        tradeKind: conversation.state.tradeKind,
        phase: conversation.state.phase,
        classification: conversation.state.classification,
        fields: conversation.state.fields,
        meta: conversation.state.meta,
        budget: conversation.state.budget,
        audit: conversation.state.audit,
        conversationMessages: conversation.messages || [],
      });

      logInfo("lead.created", {
        leadId: lead.leadId,
        tradesmanId: lead.tradesmanId,
        status: lead.status,
      });

      if (ownership.tradesmanId) {
        const tradesman = await getTradesmanById(ownership.tradesmanId);
        if (tradesman) {
          try {
            await sendNewLeadNotification({ lead, tradesman });
          } catch (notificationError) {
            logError("lead.new_notification.failed", notificationError, {
              leadId: lead.leadId,
            });
          }

          try {
            await sendCustomerEnquiryConfirmation({ lead, tradesman });
          } catch (notificationError) {
            logError("lead.customer_confirmation.failed", notificationError, {
              leadId: lead.leadId,
            });
          }
        }
      }

      sendJson(res, 200, lead, allowedOrigin);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/leads") {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;
      if (!ensureSubscriptionActive(res, req, tradesman)) return;

      const statusFilter = String(requestUrl.searchParams.get("status") || "")
        .trim()
        .toUpperCase();

      let leads = (await listLeads()).filter(
        (lead) => lead.tradesmanId === tradesman.tradesmanId
      );

      if (statusFilter) {
        leads = leads.filter(
          (lead) => String(lead.status || "").toUpperCase() === statusFilter
        );
      }

      sendJson(res, 200, leads, allowedOrigin);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname.startsWith("/leads/")) {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;
      if (!ensureSubscriptionActive(res, req, tradesman)) return;

      const leadId = parseLeadIdFromUrl(requestUrl.pathname);
      const lead = leadId ? await getLead(leadId) : null;

      if (!lead) {
        sendJson(res, 404, { error: "Lead not found" }, allowedOrigin);
        return;
      }

      if (!ensureLeadOwnership(res, req, lead, tradesman)) return;

      sendJson(res, 200, lead, allowedOrigin);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname.endsWith("/approve")) {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;
      if (!ensureSubscriptionActive(res, req, tradesman)) return;

      const leadId = parseLeadIdFromUrl(requestUrl.pathname);
      const lead = leadId ? await ensureLeadExists(res, req, leadId) : null;
      if (!lead) return;
      if (!ensureLeadOwnership(res, req, lead, tradesman)) return;

      if (!ensureValidTransition(lead.status, "APPROVED")) {
        sendJson(res, 400, { error: "Invalid status transition" }, allowedOrigin);
        return;
      }

      const updated = await updateLead(leadId, {
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
      });

      logInfo("lead.approved", { leadId, tradesmanId: tradesman.tradesmanId });

      sendJson(res, 200, updated, allowedOrigin);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname.endsWith("/reject")) {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;
      if (!ensureSubscriptionActive(res, req, tradesman)) return;

      const leadId = parseLeadIdFromUrl(requestUrl.pathname);
      const lead = leadId ? await ensureLeadExists(res, req, leadId) : null;
      if (!lead) return;
      if (!ensureLeadOwnership(res, req, lead, tradesman)) return;

      if (!ensureValidTransition(lead.status, "REJECTED")) {
        sendJson(res, 400, { error: "Invalid status transition" }, allowedOrigin);
        return;
      }

      const updated = await updateLead(leadId, {
        status: "REJECTED",
        rejectedAt: new Date().toISOString(),
      });

      logInfo("lead.rejected", { leadId, tradesmanId: tradesman.tradesmanId });

      sendJson(res, 200, updated, allowedOrigin);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname.endsWith("/quote")) {
      const tradesman = await requireAuth(req, res);
      if (!tradesman) return;
      if (!ensureSubscriptionActive(res, req, tradesman)) return;

      const body = await readJsonBody(req);
      const quoteErrors = validateQuoteBody(body);

      if (quoteErrors.length > 0) {
        sendJson(res, 400, { error: quoteErrors.join(", ") }, allowedOrigin);
        return;
      }

      const leadId = parseLeadIdFromUrl(requestUrl.pathname);
      const lead = leadId ? await ensureLeadExists(res, req, leadId) : null;
      if (!lead) return;
      if (!ensureLeadOwnership(res, req, lead, tradesman)) return;

      if (!ensureValidTransition(lead.status, "QUOTED")) {
        sendJson(res, 400, { error: "Invalid status transition" }, allowedOrigin);
        return;
      }

      const updated = await updateLead(leadId, {
        status: "QUOTED",
        quote: normalizeQuoteText(body.quote),
        quotedAt: new Date().toISOString(),
      });

      logInfo("lead.quoted", { leadId, tradesmanId: tradesman.tradesmanId });

      try {
        await sendQuoteNotification({ lead: updated, tradesman });
      } catch (notificationError) {
        logError("lead.quote_notification.failed", notificationError, { leadId });
      }

      sendJson(res, 200, updated, allowedOrigin);
      return;
    }

    sendJson(res, 404, { error: "Not Found" }, allowedOrigin);
  } catch (error) {
    logError("server.unhandled", error, {
      method: req.method,
      path: requestUrl.pathname,
    });

    sendJson(
      res,
      500,
      { error: "Internal Server Error", detail: error?.message || "Unknown error" },
      allowedOrigin
    );
  }
});

server.listen(PORT, HOST, () => {
  logInfo("server.started", {
    host: HOST,
    port: PORT,
    appBaseUrl: APP_BASE_URL,
    allowedOrigins: ALLOWED_ORIGINS,
  });
});