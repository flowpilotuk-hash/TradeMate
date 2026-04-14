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

const QUESTION_CATALOG = {
  jobType: {
    priority: 100,
    question:
      "What sort of kitchen project is it - a full fit, a refresh, or worktops only?",
    quickSelects: ["Full fit", "Refresh", "Worktops only"],
  },
  postcode: {
    priority: 95,
    question: "What postcode is the property in?",
    quickSelects: ["LS15", "WF3", "Not sure"],
  },
  layoutChange: {
    priority: 88,
    question:
      "Are you keeping the same layout, making a few changes, or changing it quite a bit?",
    quickSelects: ["Same layout", "A few changes", "Major changes"],
  },
  unitsSupply: {
    priority: 85,
    question:
      "Will you be supplying the units, or are you looking for supply and fit?",
    quickSelects: ["I’m supplying them", "Supply and fit", "Not sure yet"],
  },
  kitchenSize: {
    priority: 80,
    question: "Roughly what size is the kitchen - small, medium, or large?",
    quickSelects: ["Small", "Medium", "Large"],
  },
  timeline: {
    priority: 76,
    question: "When were you hoping to get this done?",
    quickSelects: ["ASAP", "Next 1-3 months", "3-6 months", "Later on"],
  },
  budget: {
    priority: 72,
    question:
      "Do you have a rough budget in mind? Even a ballpark is helpful.",
    quickSelects: ["Under £10k", "£10k-£15k", "£15k+", "Not sure yet"],
  },
  firstName: {
    priority: 50,
    question: "Can I grab your first name?",
    quickSelects: [],
  },
  email: {
    priority: 45,
    question: "What's the best email to send the confirmation to?",
    quickSelects: [],
  },
};

const FOLLOW_UP_CATALOG = {
  unitCount: {
    key: "unitCount",
    priority: 68,
    question: "Roughly how many units are there at the moment?",
    blocking: false,
    quickSelects: ["6-8", "9-12", "13+", "Not sure"],
  },
  layoutShape: {
    key: "layoutShape",
    priority: 66,
    question:
      "Is it mainly a straight run, L-shape, U-shape, galley, or does it include an island?",
    blocking: false,
    quickSelects: ["Straight", "L-shape", "U-shape", "Galley", "Island"],
  },
  servicesMoving: {
    key: "servicesMoving",
    priority: 72,
    question:
      "What’s moving - just appliances and units, or sink and cooker positions as well?",
    blocking: false,
    quickSelects: [
      "Appliances/units only",
      "Sink/cooker too",
      "Not sure",
    ],
  },
  unitsChosen: {
    key: "unitsChosen",
    priority: 70,
    question:
      "Have you already bought the units, or are you still deciding on them?",
    blocking: false,
    quickSelects: ["Already bought", "Still deciding"],
  },
  unitsBrandKnown: {
    key: "unitsBrandKnown",
    priority: 58,
    question: "Do you know the kitchen brand or supplier yet?",
    blocking: false,
    quickSelects: ["Howdens", "Wren", "IKEA", "Magnet", "Not sure"],
  },
  budgetScope: {
    key: "budgetScope",
    priority: 64,
    question:
      "Is that budget for the whole job including supply, or mainly labour and fitting?",
    blocking: false,
    quickSelects: ["Whole project", "Labour/fitting", "Not sure"],
  },
  timelineFlexibility: {
    key: "timelineFlexibility",
    priority: 60,
    question: "Is that timing flexible, or are you working to a firm deadline?",
    blocking: false,
    quickSelects: ["Flexible", "Firm deadline"],
  },
};

const PROJECT_FIELDS = [
  "jobType",
  "postcode",
  "kitchenSize",
  "layoutChange",
  "unitsSupply",
  "timeline",
  "budget",
];

const CONTACT_FIELDS = ["firstName", "email"];

const ENUM_CONTRADICTION_FIELDS = new Set([
  "jobType",
  "kitchenSize",
  "layoutChange",
  "unitsSupply",
  "timeline",
]);

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
    logError("cors.origin_blocked", new Error("Origin not allowed"), {
      requestOrigin,
      allowedOrigins: ALLOWED_ORIGINS,
      path: req.url || null,
      method: req.method || null,
    });

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
      askedSequence: [],
      lastQuestionField: null,
      lastBotStyle: null,
      timelineSpecific: false,
      photoMissing: true,
      contactRequested: false,
      handoffReady: false,
      notes: [],
      propertyUse: null,
      fieldEvidence: {},
      pendingClarification: null,
      contradictions: [],
      optionalInsights: {},
      followUpQueue: [],
      askedFollowUps: {},
      quickSelects: [],
      lastUserIntent: null,
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

function normalizeSingleLine(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextForDetection(text) {
  return normalizeSingleLine(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s*-\s*/g, "-");
}

function titleCaseWord(value) {
  const lower = String(value || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function hasFieldValue(field) {
  const actual = field?.value;

  if (actual === undefined || actual === null) return false;
  if (typeof actual === "string") return actual.trim() !== "";
  if (Array.isArray(actual)) return actual.length > 0;
  if (typeof actual === "object") return Object.keys(actual).length > 0;

  return true;
}

function getFieldValue(state, key) {
  return state?.fields?.[key]?.value;
}

function getOptionalInsight(state, key) {
  return state?.meta?.optionalInsights?.[key];
}

function hasOptionalInsight(state, key) {
  const value = getOptionalInsight(state, key);
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function normalizePostcode(value) {
  const compact = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (compact.length <= 3) return compact;
  return compact.replace(/^(.+)(.{3})$/, "$1 $2");
}

function pushUpdate(updates, key, value, confidence = 0.9, source = "ai") {
  const existingIndex = updates.findIndex((item) => item.key === key);
  const nextItem = { key, value, confidence, source };

  if (existingIndex >= 0) {
    if (
      Number(updates[existingIndex].confidence || 0) <= Number(confidence || 0)
    ) {
      updates[existingIndex] = nextItem;
    }
    return;
  }

  updates.push(nextItem);
}

function addUniqueNote(notes, note) {
  const normalized = normalizeSingleLine(note);
  if (!normalized) return;
  if (!notes.includes(normalized)) {
    notes.push(normalized);
  }
}

function addUniqueContradiction(existing, contradiction) {
  const key = `${contradiction.field}:${contradiction.from}->${contradiction.to}`;
  if (
    !existing.some(
      (item) => `${item.field}:${item.from}->${item.to}` === key
    )
  ) {
    existing.push(contradiction);
  }
}

function getExpectedFieldFromState(state) {
  return String(state?.meta?.lastQuestionField || "").trim() || null;
}

function getAskedCount(state, key) {
  return Number(state?.meta?.askedCounts?.[key] || 0);
}

function getAskedFollowUpCount(state, key) {
  return Number(state?.meta?.askedFollowUps?.[key] || 0);
}

function countCompletedFields(state, keys) {
  return keys.filter((key) => hasFieldValue(state?.fields?.[key])).length;
}

function shouldPreferContactNow(state) {
  const missingContactFields = CONTACT_FIELDS.filter(
    (key) => !hasFieldValue(state?.fields?.[key])
  );

  if (missingContactFields.length === 0) return false;

  const projectCompleted = countCompletedFields(state, PROJECT_FIELDS);
  return projectCompleted >= 4;
}

function compareFieldStrength(existingField, incomingUpdate) {
  if (!hasFieldValue(existingField)) {
    return true;
  }

  const existingConfidence = Number(existingField?.confidence || 0);
  const incomingConfidence = Number(incomingUpdate?.confidence || 0);

  if (incomingConfidence >= existingConfidence + 0.08) {
    return true;
  }

  if (existingConfidence < 0.75 && incomingConfidence >= existingConfidence) {
    return true;
  }

  return false;
}

function inferBudgetSignalFromAmount(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "UNCLEAR";
  }
  if (amount < 10000) return "LOW";
  if (amount <= 20000) return "MEDIUM";
  return "HIGH";
}

function parseNumericBudgetAmount(raw, hasK) {
  const cleaned = String(raw || "").replace(/,/g, "");
  const num = Number(cleaned);

  if (!Number.isFinite(num)) return null;

  return hasK ? Math.round(num * 1000) : Math.round(num);
}

function buildBudgetValue(args) {
  const disclosure = args.disclosure || "NOT_DISCLOSED";
  const amountMin = Number.isFinite(args.amountMin) ? args.amountMin : null;
  const amountMax = Number.isFinite(args.amountMax) ? args.amountMax : null;
  const representative =
    amountMin !== null && amountMax !== null
      ? Math.round((amountMin + amountMax) / 2)
      : amountMin !== null
        ? amountMin
        : amountMax !== null
          ? amountMax
          : null;

  const signal =
    args.signal ||
    inferBudgetSignalFromAmount(representative) ||
    "UNCLEAR";

  return {
    disclosure,
    signal,
    risk: args.risk || (disclosure === "NOT_DISCLOSED" ? "HIGH" : "MEDIUM"),
    indicators: {
      raw: args.raw || null,
      amountMin,
      amountMax,
      approximate: Boolean(args.approximate),
      under: Boolean(args.under),
      lowestPossible: Boolean(args.lowestPossible),
      notes: args.notes || null,
    },
  };
}

function parseBudgetValue(text, currentQuestion) {
  const normalized = normalizeTextForDetection(text);
  const lower = normalized.toLowerCase();

  if (
    /\b(not sure(?: yet)?|unsure|don't know|do not know|no idea|haven't decided|too early to say|tbd|to be decided)\b/.test(
      lower
    ) &&
    (/\bbudget\b/.test(lower) || currentQuestion === "budget")
  ) {
    return buildBudgetValue({
      disclosure: "NOT_DISCLOSED",
      signal: "UNCLEAR",
      risk: "HIGH",
      raw: normalized,
      notes: "budget unknown",
    });
  }

  if (
    /\b(cheap as possible|as cheap as possible|lowest price|lowest possible|keep costs down|minimise cost|minimize cost|budget option|cost effective|cheapest option)\b/.test(
      lower
    )
  ) {
    return buildBudgetValue({
      disclosure: "INDIRECT",
      signal: "LOW",
      risk: "MEDIUM",
      raw: normalized,
      lowestPossible: true,
      notes: "customer wants lowest possible cost",
    });
  }

  const rangeMatch =
    normalized.match(
      /\b(?:around|about|roughly|approx(?:imately)?|something like)?\s*£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\s*(?:to|-|–|and)\s*£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\b/i
    ) ||
    normalized.match(
      /\bbetween\s+£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\s+and\s+£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\b/i
    );

  if (rangeMatch) {
    const amount1 = parseNumericBudgetAmount(rangeMatch[1], Boolean(rangeMatch[2]));
    const amount2 = parseNumericBudgetAmount(rangeMatch[3], Boolean(rangeMatch[4]));

    if (amount1 !== null && amount2 !== null) {
      const min = Math.min(amount1, amount2);
      const max = Math.max(amount1, amount2);

      return buildBudgetValue({
        disclosure: "RANGE",
        amountMin: min,
        amountMax: max,
        risk: "LOW",
        raw: normalized,
        approximate: /\b(around|about|roughly|approx|something like)/i.test(
          normalized
        ),
        notes: "budget range provided",
      });
    }
  }

  const underMatch = normalized.match(
    /\b(?:under|up to|max|maximum|no more than)\s+£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\b/i
  );
  if (underMatch) {
    const amount = parseNumericBudgetAmount(underMatch[1], Boolean(underMatch[2]));
    if (amount !== null) {
      return buildBudgetValue({
        disclosure: "EXPLICIT",
        amountMax: amount,
        under: true,
        risk: "LOW",
        raw: normalized,
        notes: "budget cap provided",
      });
    }
  }

  const exactMatch =
    normalized.match(
      /\b(?:budget(?: is)?|around|about|roughly|approx(?:imately)?|at around|something like)\s+£?\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\b/i
    ) ||
    normalized.match(/\b£\s?(\d+(?:[.,]\d+)?)\s*(k|grand)?\b/i) ||
    ((currentQuestion === "budget" || /\bbudget\b/.test(lower)) &&
    normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(k|grand)\b/i)
      ? normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(k|grand)\b/i)
      : null) ||
    (currentQuestion === "budget" ? normalized.match(/\b(\d{4,6})\b/) : null);

  if (exactMatch) {
    const amount = parseNumericBudgetAmount(exactMatch[1], Boolean(exactMatch[2]));
    if (amount !== null) {
      const isApprox = /\b(around|about|roughly|approx|something like)\b/i.test(
        normalized
      );

      return buildBudgetValue({
        disclosure: isApprox ? "APPROXIMATE" : "EXPLICIT",
        amountMin: amount,
        amountMax: amount,
        risk: isApprox ? "MEDIUM" : "LOW",
        raw: normalized,
        approximate: isApprox,
        notes: "budget figure provided",
      });
    }
  }

  return null;
}

function getMonthsUntil(targetMonthIndex, fromDate) {
  const currentMonth = fromDate.getMonth();
  let diff = targetMonthIndex - currentMonth;
  if (diff < 0) diff += 12;
  return diff;
}

function getSeasonRepresentativeMonth(season) {
  switch (season) {
    case "spring":
      return 3;
    case "summer":
      return 6;
    case "autumn":
    case "fall":
      return 9;
    case "winter":
      return 0;
    default:
      return null;
  }
}

function bucketMonthsDiff(diff) {
  if (diff <= 0) return "ASAP";
  if (diff <= 3) return "1_3_MONTHS";
  if (diff <= 6) return "3_6_MONTHS";
  return "6_PLUS";
}

function parseTimelineValue(text, nowDate = new Date()) {
  const normalized = normalizeTextForDetection(text);
  const lower = normalized.toLowerCase();

  const weekMatch = lower.match(/\b(?:in\s+)?(\d+)\s*(week|weeks)\b/);
  if (weekMatch) {
    const weeks = Number(weekMatch[1]);

    if (weeks <= 2) {
      return { value: "ASAP", specific: true, raw: normalized };
    }

    if (weeks <= 12) {
      return { value: "1_3_MONTHS", specific: true, raw: normalized };
    }

    return { value: "3_6_MONTHS", specific: true, raw: normalized };
  }

  const monthCountMatch = lower.match(/\b(?:in\s+)?(\d+)\s*(month|months)\b/);
  if (monthCountMatch) {
    const months = Number(monthCountMatch[1]);
    if (months <= 1) return { value: "1_3_MONTHS", specific: true, raw: normalized };
    if (months <= 6) return { value: "3_6_MONTHS", specific: true, raw: normalized };
    return { value: "6_PLUS", specific: true, raw: normalized };
  }

  if (
    /\b(asap|urgent|straight away|right away|as soon as possible|immediately|soon as you can)\b/.test(
      lower
    )
  ) {
    return { value: "ASAP", specific: true, raw: normalized };
  }

  if (
    /\b(next week|within a few weeks|in a few weeks|this month|next month|in a month|within 3 months|in the next few months|soon)\b/.test(
      lower
    )
  ) {
    return { value: "1_3_MONTHS", specific: true, raw: normalized };
  }

  if (
    /\b(in a few months|in few months|in several months|couple of months|a couple of months|probably autumn|probably summer|probably spring|probably winter)\b/.test(
      lower
    )
  ) {
    const seasonMatch = lower.match(/\b(spring|summer|autumn|fall|winter)\b/);
    if (seasonMatch) {
      const representativeMonth = getSeasonRepresentativeMonth(seasonMatch[1]);
      const diff =
        representativeMonth === null
          ? 4
          : getMonthsUntil(representativeMonth, nowDate);

      return {
        value: bucketMonthsDiff(diff),
        specific: true,
        raw: normalized,
      };
    }

    return { value: "3_6_MONTHS", specific: true, raw: normalized };
  }

  if (
    /\b(later this year|towards the end of the year|next year|no rush|not urgent|sometime next year|later on|eventually)\b/.test(
      lower
    )
  ) {
    return { value: "6_PLUS", specific: true, raw: normalized };
  }

  const seasonMatch = lower.match(/\b(spring|summer|autumn|fall|winter)\b/);
  if (seasonMatch) {
    const representativeMonth = getSeasonRepresentativeMonth(seasonMatch[1]);
    const diff =
      representativeMonth === null ? 3 : getMonthsUntil(representativeMonth, nowDate);

    return {
      value: bucketMonthsDiff(diff),
      specific: true,
      raw: normalized,
    };
  }

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const monthIndex = monthNames.findIndex((month) =>
    new RegExp(`\\b${month}\\b`, "i").test(lower)
  );

  if (monthIndex >= 0) {
    const diff = getMonthsUntil(monthIndex, nowDate);
    return {
      value: bucketMonthsDiff(diff),
      specific: true,
      raw: normalized,
    };
  }

  return null;
}

function splitIntoSegments(text) {
  return normalizeTextForDetection(text)
    .split(/[.!?]+|\s*,\s*|\s+\band\b\s+/i)
    .map((part) => normalizeSingleLine(part))
    .filter(Boolean);
}

function isNegativeUncertainty(text) {
  return /\b(not sure(?: yet)?|unsure|don't know|do not know|no idea|haven't decided|too early to say|tbd)\b/i.test(
    text
  );
}

function extractPostcode(text, updates) {
  const postcodeMatch = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
  if (!postcodeMatch) return;
  pushUpdate(updates, "postcode", normalizePostcode(postcodeMatch[1]), 0.96, "nlp");
}

function extractEmail(text, updates, currentQuestion) {
  const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);

  if (emailMatch) {
    pushUpdate(updates, "email", emailMatch[0].trim().toLowerCase(), 0.99, "nlp");
    return;
  }

  if (currentQuestion === "email") {
    const compactEmail = text.replace(/\s+/g, "");
    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(compactEmail)) {
      pushUpdate(updates, "email", compactEmail.toLowerCase(), 0.99, "context");
    }
  }
}

function extractPhone(text, updates) {
  const phoneMatch = text.match(
    /\b(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}\b/
  );
  if (phoneMatch) {
    pushUpdate(updates, "phone", normalizeSingleLine(phoneMatch[0]), 0.92, "nlp");
  }
}

function extractJobType(text, lower, updates, currentQuestion, ambiguities) {
  if (
    /\b(worktops?|countertops?)\b/.test(lower) &&
    /\b(doors?|refresh|replacement|facelift)\b/.test(lower)
  ) {
    pushUpdate(updates, "jobType", "REFRESH", 0.91, "nlp");
    return;
  }

  if (/\b(worktops?|countertops?)\b/.test(lower)) {
    pushUpdate(updates, "jobType", "WORKTOPS", 0.93, "nlp");
    return;
  }

  if (
    /\b(refresh|refreshing|kitchen refresh|doors only|replacement doors|new doors|facelift|update rather than full)\b/.test(
      lower
    )
  ) {
    pushUpdate(updates, "jobType", "REFRESH", 0.92, "nlp");

    if (
      /\bkitchen refresh\b/.test(lower) &&
      !/\b(doors|worktops|units|full)\b/.test(lower)
    ) {
      ambiguities.push({
        field: "jobType",
        question:
          "When you say refresh, is that mainly doors and worktops, or more of a wider update?",
        reason: "refresh_scope_unclear",
        priority: 92,
      });
    }
    return;
  }

  if (
    /\b(full kitchen|new kitchen|complete kitchen|complete refit|full refit|full fit|kitchen fit|kitchen fitted|kitchen installation|rip out and replace|brand new kitchen)\b/.test(
      lower
    )
  ) {
    pushUpdate(updates, "jobType", "FULL_FIT", 0.93, "nlp");
    return;
  }

  if (
    /\bkitchen\b/.test(lower) &&
    /\b(install|installation|refit|fit)\b/.test(lower)
  ) {
    pushUpdate(updates, "jobType", "FULL_FIT", 0.88, "nlp");
    return;
  }

  if (currentQuestion === "jobType") {
    if (/\b(full|full fit|new kitchen|complete|refit)\b/.test(lower)) {
      pushUpdate(updates, "jobType", "FULL_FIT", 0.94, "context");
      return;
    }

    if (/\b(refresh|doors|facelift)\b/.test(lower)) {
      pushUpdate(updates, "jobType", "REFRESH", 0.94, "context");
      return;
    }

    if (/\b(worktops?)\b/.test(lower)) {
      pushUpdate(updates, "jobType", "WORKTOPS", 0.94, "context");
    }
  }
}

function extractKitchenSize(lower, updates, currentQuestion) {
  if (/\bsmall\b|\bcompact\b/.test(lower)) {
    pushUpdate(updates, "kitchenSize", "SMALL", 0.9, "nlp");
    return;
  }

  if (/\bmedium\b|\baverage\b|\bmid[- ]?size\b/.test(lower)) {
    pushUpdate(updates, "kitchenSize", "MEDIUM", 0.91, "nlp");
    return;
  }

  if (/\blarge\b|\bbig\b|\bspacious\b/.test(lower)) {
    pushUpdate(updates, "kitchenSize", "LARGE", 0.9, "nlp");
    return;
  }

  if (currentQuestion === "kitchenSize") {
    if (/^\s*(small|compact)\s*$/i.test(lower)) {
      pushUpdate(updates, "kitchenSize", "SMALL", 0.97, "context");
      return;
    }

    if (/^\s*(medium|average)\s*$/i.test(lower)) {
      pushUpdate(updates, "kitchenSize", "MEDIUM", 0.97, "context");
      return;
    }

    if (/^\s*(large|big)\s*$/i.test(lower)) {
      pushUpdate(updates, "kitchenSize", "LARGE", 0.97, "context");
    }
  }
}

function extractLayoutChange(lower, updates, currentQuestion, ambiguities) {
  const saysNone =
    /\b(current layout|keeping current layout|keep current layout|keeping the current layout|keep the current layout|keeping the layout|keep the layout|same layout|existing layout|no layout change|leave layout as is|staying as is|same footprint)\b/.test(
      lower
    );

  const saysMinor =
    /\b(minor changes|small changes|few changes|a few changes|some changes|tweak|tweaks|minor layout changes|slight changes|move the sink slightly|move sink slightly|shift a unit|move a unit|keeping most of the layout)\b/.test(
      lower
    );

  const saysMajor =
    /\b(significant changes|major changes|major layout changes|full layout change|moving everything|reconfigure|reconfiguration|completely changing layout|opening it up|moving the whole kitchen)\b/.test(
      lower
    );

  if (saysNone && saysMinor) {
    ambiguities.push({
      field: "layoutChange",
      question:
        "Just to check, are you keeping the overall layout with a couple of tweaks, or is it staying exactly the same?",
      reason: "layout_none_vs_minor",
      priority: 97,
    });
    pushUpdate(updates, "layoutChange", "MINOR", 0.75, "nlp");
    return;
  }

  if (saysNone) {
    pushUpdate(updates, "layoutChange", "NONE", 0.96, "nlp");
    return;
  }

  if (saysMinor) {
    pushUpdate(updates, "layoutChange", "MINOR", 0.92, "nlp");
    return;
  }

  if (saysMajor) {
    pushUpdate(updates, "layoutChange", "MAJOR", 0.93, "nlp");
    return;
  }

  if (currentQuestion === "layoutChange") {
    if (/^\s*(same|current|existing|none)\s*$/i.test(lower)) {
      pushUpdate(updates, "layoutChange", "NONE", 0.97, "context");
      return;
    }

    if (/^\s*(minor|few|small)\s*$/i.test(lower)) {
      pushUpdate(updates, "layoutChange", "MINOR", 0.95, "context");
      return;
    }

    if (/^\s*(major|significant|full)\s*$/i.test(lower)) {
      pushUpdate(updates, "layoutChange", "MAJOR", 0.95, "context");
    }
  }
}

function extractUnitsSupply(lower, updates, currentQuestion, ambiguities) {
  const customerSupplied =
    /\b(i['’]?ll supply the units|i will supply the units|customer supplied|already have the units|i have the units|i bought the units|we bought the units|we already bought the units|already purchased the units|already bought the kitchen|already have the kitchen|units already bought|we've got the units|we already have them)\b/.test(
      lower
    );

  const fitterSupplied =
    /\b(you supply|supply and fit|need you to supply|please supply|want supply and fit|looking for supply and fit|need supply and fit|full supply and fit)\b/.test(
      lower
    );

  if (customerSupplied && fitterSupplied) {
    ambiguities.push({
      field: "unitsSupply",
      question:
        "Just to clarify, have you already bought the units, or would you like supply and fit?",
      reason: "units_supply_conflict",
      priority: 96,
    });
    return;
  }

  if (customerSupplied) {
    pushUpdate(updates, "unitsSupply", "CUSTOMER_SUPPLIED", 0.95, "nlp");
    return;
  }

  if (fitterSupplied) {
    pushUpdate(updates, "unitsSupply", "FITTER_SUPPLIED", 0.93, "nlp");
    return;
  }

  if (
    currentQuestion === "unitsSupply" &&
    /\b(not sure|unsure|don't know|do not know|not decided)\b/.test(lower)
  ) {
    pushUpdate(updates, "unitsSupply", "UNSURE", 0.93, "context");
    return;
  }

  if (currentQuestion === "unitsSupply") {
    if (/^\s*(me|myself|we will|i will|customer)\s*$/i.test(lower)) {
      pushUpdate(updates, "unitsSupply", "CUSTOMER_SUPPLIED", 0.94, "context");
      return;
    }

    if (/^\s*(you|supply and fit|supply)\s*$/i.test(lower)) {
      pushUpdate(updates, "unitsSupply", "FITTER_SUPPLIED", 0.94, "context");
    }
  }
}

function extractFirstName(text, lower, updates, currentQuestion) {
  const namePatterns = [
    /\bmy name is\s+([A-Za-z'-]{2,40})\b/i,
    /\bi['’]?m\s+([A-Za-z'-]{2,40})\b/i,
    /\bi am\s+([A-Za-z'-]{2,40})\b/i,
  ];

  const blockedWords = new Set([
    "after",
    "looking",
    "needing",
    "thinking",
    "planning",
    "wanting",
    "interested",
    "not",
    "unsure",
    "same",
    "medium",
    "small",
    "large",
    "budget",
    "autumn",
    "summer",
    "winter",
    "spring",
    "asap",
    "next",
  ]);

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = String(match[1] || "").trim();
      if (candidate && !blockedWords.has(candidate.toLowerCase())) {
        pushUpdate(updates, "firstName", titleCaseWord(candidate), 0.94, "nlp");
        return;
      }
    }
  }

  if (
    currentQuestion === "firstName" &&
    /^[A-Za-z][A-Za-z' -]{1,40}$/.test(text) &&
    !/\b(layout|changes|kitchen|budget|month|email|postcode|autumn|summer|winter|spring)\b/i.test(
      text
    )
  ) {
    const firstToken = text.trim().split(/\s+/)[0];
    if (!blockedWords.has(firstToken.toLowerCase())) {
      pushUpdate(updates, "firstName", titleCaseWord(firstToken), 0.98, "context");
    }
  }
}

function extractPropertyContext(lower, notes, metaPatch) {
  if (
    /\b(rental|rented property|buy to let|buy-to-let|tenant|let property|for a rental|for rental)\b/.test(
      lower
    )
  ) {
    metaPatch.propertyUse = "RENTAL";
    addUniqueNote(notes, "Property appears to be a rental.");
  }

  if (/\b(homeowner|our home|my home|own house|owner occupied)\b/.test(lower)) {
    metaPatch.propertyUse = "OWNER_OCCUPIED";
  }
}

function extractOptionalInsights(
  text,
  lower,
  updates,
  optionalInsights,
  currentQuestion
) {
  const unitCountMatch =
    text.match(/\b(\d{1,2})\s+(?:units|cabinets|cupboards)\b/i) ||
    (currentQuestion === "unitCount" ? text.match(/\b(\d{1,2})\b/) : null);

  if (unitCountMatch) {
    const count = Number(unitCountMatch[1]);
    if (Number.isFinite(count) && count > 0 && count <= 40) {
      optionalInsights.unitCount = {
        value: count,
        confidence: currentQuestion === "unitCount" ? 0.97 : 0.88,
      };
    }
  }

  if (/\b(straight run|single run|straight)\b/.test(lower)) {
    optionalInsights.layoutShape = { value: "STRAIGHT", confidence: 0.9 };
  } else if (/\bl-shape|l shaped|l-shaped\b/.test(lower)) {
    optionalInsights.layoutShape = { value: "L_SHAPE", confidence: 0.92 };
  } else if (/\bu-shape|u shaped|u-shaped\b/.test(lower)) {
    optionalInsights.layoutShape = { value: "U_SHAPE", confidence: 0.92 };
  } else if (/\bgalley\b/.test(lower)) {
    optionalInsights.layoutShape = { value: "GALLEY", confidence: 0.9 };
  } else if (/\bisland\b/.test(lower)) {
    optionalInsights.layoutShape = { value: "ISLAND", confidence: 0.9 };
  }

  if (
    /\b(sink and cooker|sink & cooker|moving the sink and cooker|sink position|cooker position|plumbing and electrics|water and electric|services moving)\b/.test(
      lower
    )
  ) {
    optionalInsights.servicesMoving = {
      value: "SERVICES_AND_APPLIANCES",
      confidence: 0.92,
    };
  } else if (
    /\b(just appliances|appliances only|only the appliances|units only|cabinets only)\b/.test(
      lower
    )
  ) {
    optionalInsights.servicesMoving = {
      value: "APPLIANCES_OR_UNITS_ONLY",
      confidence: 0.88,
    };
  } else if (
    currentQuestion === "servicesMoving" &&
    /\b(not sure|unsure)\b/.test(lower)
  ) {
    optionalInsights.servicesMoving = {
      value: "UNSURE",
      confidence: 0.93,
    };
  }

  if (
    /\b(already bought|already purchased|already have them|already got them)\b/.test(
      lower
    )
  ) {
    optionalInsights.unitsChosen = {
      value: "ALREADY_BOUGHT",
      confidence: 0.94,
    };
  } else if (
    /\b(still deciding|still choosing|haven't chosen|not chosen yet|looking at options)\b/.test(
      lower
    )
  ) {
    optionalInsights.unitsChosen = {
      value: "STILL_DECIDING",
      confidence: 0.92,
    };
  }

  const brandMatch = text.match(
    /\b(?:howdens|wren|ikea|magnet|b&q|benchmarx|wickes|symphony|nobilia)\b/i
  );
  if (brandMatch) {
    optionalInsights.unitsBrandKnown = {
      value: brandMatch[0].toUpperCase(),
      confidence: 0.92,
    };
  } else if (
    currentQuestion === "unitsBrandKnown" &&
    /\b(not sure|don't know|unsure)\b/.test(lower)
  ) {
    optionalInsights.unitsBrandKnown = {
      value: "UNKNOWN",
      confidence: 0.93,
    };
  }

  if (/\b(labour only|labor only|fitting only|install only)\b/.test(lower)) {
    optionalInsights.budgetScope = {
      value: "LABOUR_ONLY",
      confidence: 0.9,
    };
  } else if (
    /\b(total job|whole job|everything included|supply and fit overall|all in)\b/.test(
      lower
    )
  ) {
    optionalInsights.budgetScope = {
      value: "FULL_PROJECT",
      confidence: 0.9,
    };
  }

  if (/\b(flexible|can move|not fixed|no hard deadline)\b/.test(lower)) {
    optionalInsights.timelineFlexibility = {
      value: "FLEXIBLE",
      confidence: 0.9,
    };
  } else if (
    /\b(hard deadline|must be done by|needs to be done by|fixed date)\b/.test(
      lower
    )
  ) {
    optionalInsights.timelineFlexibility = {
      value: "FIRM_DEADLINE",
      confidence: 0.92,
    };
  }

  if (
    currentQuestion === "unitCount" &&
    !optionalInsights.unitCount &&
    /\b(not sure|unsure|don't know)\b/.test(lower)
  ) {
    optionalInsights.unitCount = {
      value: "UNKNOWN",
      confidence: 0.93,
    };
  }
}

function inferAnswerFromActiveQuestion(text, lower, currentQuestion, updates, notes) {
  if (!currentQuestion) return;

  if (currentQuestion === "timeline" && isNegativeUncertainty(text)) {
    addUniqueNote(notes, "Customer is unsure on timeline.");
    return;
  }

  if (currentQuestion === "budget" && isNegativeUncertainty(text)) {
    pushUpdate(
      updates,
      "budget",
      buildBudgetValue({
        disclosure: "NOT_DISCLOSED",
        signal: "UNCLEAR",
        risk: "HIGH",
        raw: text,
        notes: "budget unknown",
      }),
      0.97,
      "context"
    );
    return;
  }

  if (currentQuestion === "postcode") {
    const likelyAreaCode = text.match(/^\s*([A-Z]{1,2}\d{1,2}[A-Z]?)\s*$/i);
    if (likelyAreaCode) {
      pushUpdate(
        updates,
        "postcode",
        likelyAreaCode[1].toUpperCase(),
        0.74,
        "context"
      );
      return;
    }
  }

  if (
    currentQuestion === "jobType" &&
    /^\s*(full fit|full|refresh|worktops only|worktops)\s*$/i.test(text)
  ) {
    extractJobType(text, lower, updates, currentQuestion, []);
    return;
  }

  if (
    currentQuestion === "layoutChange" &&
    /^\s*(same layout|same|none|few changes|minor|major changes|major)\s*$/i.test(
      text
    )
  ) {
    extractLayoutChange(lower, updates, currentQuestion, []);
    return;
  }

  if (
    currentQuestion === "unitsSupply" &&
    /^\s*(i'?m supplying them|supplying them|me|myself|supply and fit|you supply|not sure)\s*$/i.test(
      text
    )
  ) {
    extractUnitsSupply(lower, updates, currentQuestion, []);
    return;
  }

  if (
    currentQuestion === "kitchenSize" &&
    /^\s*(small|medium|large)\s*$/i.test(text)
  ) {
    extractKitchenSize(lower, updates, currentQuestion);
    return;
  }

  if (currentQuestion === "firstName") {
    extractFirstName(text, lower, updates, currentQuestion);
    return;
  }

  if (currentQuestion === "email") {
    extractEmail(text, updates, currentQuestion);
  }
}

function buildClarificationForContradiction(field, existingValue, incomingValue) {
  if (field === "layoutChange") {
    return "Just to make sure I've got that right - are you keeping the same layout, making a few tweaks, or changing it more significantly?";
  }

  if (field === "unitsSupply") {
    return "Just to check, are you supplying the units yourself, or would you like supply and fit?";
  }

  if (field === "jobType") {
    return "Just so I classify it properly, is this a full fit, more of a refresh, or worktops only?";
  }

  if (field === "timeline") {
    return "Just to pin the timing down, are you thinking soon, within a few months, or later on?";
  }

  if (field === "kitchenSize") {
    return "Just to confirm, would you class the kitchen as small, medium, or large?";
  }

  return `Just to confirm, should I treat ${field} as ${existingValue} or ${incomingValue}?`;
}

function isContradictoryFieldUpdate(existingField, incomingUpdate) {
  if (!existingField || !incomingUpdate) return false;
  if (!ENUM_CONTRADICTION_FIELDS.has(incomingUpdate.key)) return false;
  if (!hasFieldValue(existingField)) return false;

  const existingValue = existingField.value;
  const incomingValue = incomingUpdate.value;

  if (existingValue === incomingValue) return false;

  const existingConfidence = Number(existingField.confidence || 0);
  const incomingConfidence = Number(incomingUpdate.confidence || 0);

  return existingConfidence >= 0.8 && incomingConfidence >= 0.8;
}

function shouldClarifyBudget(existingField, incomingUpdate) {
  if (!existingField || !incomingUpdate) return false;
  if (incomingUpdate.key !== "budget") return false;
  if (!hasFieldValue(existingField)) return false;

  const existing = existingField.value || {};
  const incoming = incomingUpdate.value || {};

  const existingKnown =
    Number.isFinite(existing?.indicators?.amountMin) ||
    Number.isFinite(existing?.indicators?.amountMax);
  const incomingKnown =
    Number.isFinite(incoming?.indicators?.amountMin) ||
    Number.isFinite(incoming?.indicators?.amountMax);

  if (!existingKnown || !incomingKnown) return false;

  const existingMin = Number.isFinite(existing?.indicators?.amountMin)
    ? existing.indicators.amountMin
    : existing.indicators.amountMax;
  const incomingMin = Number.isFinite(incoming?.indicators?.amountMin)
    ? incoming.indicators.amountMin
    : incoming.indicators.amountMax;

  if (
    Number.isFinite(existingMin) &&
    Number.isFinite(incomingMin) &&
    Math.abs(existingMin - incomingMin) >= 10000
  ) {
    return true;
  }

  return false;
}

function mergeFieldEvidence(existingEvidence, update, userMessage, nowIso) {
  const previous = Array.isArray(existingEvidence) ? [...existingEvidence] : [];
  const nextEntry = {
    value: update.value,
    source: update.source || "ai",
    confidence: Number(update.confidence || 0),
    observedAt: nowIso,
    raw: normalizeSingleLine(userMessage).slice(0, 240),
  };

  previous.push(nextEntry);
  return previous.slice(-6);
}

function mergeOptionalInsight(existing, incoming) {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (Number(incoming.confidence || 0) >= Number(existing.confidence || 0)) {
    return incoming;
  }
  return existing;
}

function extractUpdatesFromMessage(message, state) {
  const text = normalizeTextForDetection(message);
  const lower = text.toLowerCase();
  const currentQuestion = getExpectedFieldFromState(state);
  const segments = splitIntoSegments(text);

  const updates = [];
  const notes = [];
  const ambiguities = [];
  const optionalInsights = {};
  let timelineSpecific = false;

  const metaPatch = {
    notesToAdd: [],
    propertyUse: null,
    ambiguities: [],
    optionalInsights: {},
    lastUserIntent: null,
  };

  for (const segment of segments.length > 0 ? segments : [text]) {
    const segText = normalizeTextForDetection(segment);
    const segLower = segText.toLowerCase();

    extractPostcode(segText, updates);
    extractEmail(segText, updates, currentQuestion);
    extractPhone(segText, updates);
    extractJobType(segText, segLower, updates, currentQuestion, ambiguities);
    extractKitchenSize(segLower, updates, currentQuestion);
    extractLayoutChange(segLower, updates, currentQuestion, ambiguities);
    extractUnitsSupply(segLower, updates, currentQuestion, ambiguities);
    extractFirstName(segText, segLower, updates, currentQuestion);
    extractPropertyContext(segLower, notes, metaPatch);
    extractOptionalInsights(
      segText,
      segLower,
      updates,
      optionalInsights,
      currentQuestion
    );

    const parsedBudget = parseBudgetValue(segText, currentQuestion);
    if (parsedBudget) {
      pushUpdate(updates, "budget", parsedBudget, 0.92, "nlp");
    }

    const parsedTimeline = parseTimelineValue(segText);
    if (parsedTimeline) {
      pushUpdate(updates, "timeline", parsedTimeline.value, 0.92, "nlp");
      timelineSpecific = parsedTimeline.specific === true;
      addUniqueNote(notes, `Timeline mentioned: ${parsedTimeline.raw}`);
    }

    inferAnswerFromActiveQuestion(
      segText,
      segLower,
      currentQuestion,
      updates,
      notes
    );
  }

  if (
    currentQuestion === "postcode" &&
    updates.every((item) => item.key !== "postcode")
  ) {
    const likelyAreaCode = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)\b/i);
    if (likelyAreaCode && text.trim().length <= 10) {
      pushUpdate(
        updates,
        "postcode",
        likelyAreaCode[1].toUpperCase(),
        0.72,
        "context"
      );
    }
  }

  if (/\b(rental|tenant|buy to let|buy-to-let)\b/i.test(text)) {
    metaPatch.lastUserIntent = "RENTAL_CONTEXT";
  } else if (updates.length >= 2) {
    metaPatch.lastUserIntent = "MULTI_FIELD_ANSWER";
  } else if (currentQuestion && updates.some((u) => u.key === currentQuestion)) {
    metaPatch.lastUserIntent = "DIRECT_ANSWER";
  } else {
    metaPatch.lastUserIntent = "GENERAL_MESSAGE";
  }

  for (const note of notes) {
    addUniqueNote(metaPatch.notesToAdd, note);
  }

  metaPatch.ambiguities = ambiguities;
  metaPatch.optionalInsights = optionalInsights;

  return { updates, timelineSpecific, metaPatch };
}

function getMissingProjectFields(state) {
  return PROJECT_FIELDS.filter((key) => !hasFieldValue(state?.fields?.[key]));
}

function getMissingContactFields(state) {
  return CONTACT_FIELDS.filter((key) => !hasFieldValue(state?.fields?.[key]));
}

function hasSubmissionBlockingClarification(state) {
  return Boolean(state?.meta?.pendingClarification?.field);
}

function meetsSubmissionConfidenceThreshold(state) {
  const required = [
    ["jobType", 0.8],
    ["postcode", 0.75],
    ["kitchenSize", 0.75],
    ["layoutChange", 0.75],
    ["unitsSupply", 0.75],
    ["timeline", 0.7],
    ["budget", 0.7],
    ["firstName", 0.9],
    ["email", 0.95],
  ];

  return required.every(([key, threshold]) => {
    const field = state?.fields?.[key];
    return hasFieldValue(field) && Number(field?.confidence || 0) >= threshold;
  });
}

function recomputeDerivedState(state) {
  const f = state.fields || {};

  const missingProjectFields = getMissingProjectFields(state);
  const missingContactFields = getMissingContactFields(state);

  const hasAtLeastFourProjectFields =
    PROJECT_FIELDS.length - missingProjectFields.length >= 4;

  const contactRequiredNow =
    !state.meta.contactRequested &&
    missingContactFields.length > 0 &&
    hasAtLeastFourProjectFields;

  const isFull =
    missingProjectFields.length === 0 &&
    missingContactFields.length === 0 &&
    !hasSubmissionBlockingClarification(state) &&
    meetsSubmissionConfidenceThreshold(state);

  const nextPhase = isFull
    ? "READY_FOR_HANDOFF"
    : contactRequiredNow
      ? "AWAITING_CONTACT"
      : "COLLECTING";

  const photoMissing =
    !f.photos ||
    !f.photos.value ||
    ((f.photos.value.assetIds || []).length === 0);

  const flags = [];
  if (state.meta.timelineSpecific) flags.push("TIME_SENSITIVE");
  if (photoMissing) flags.push("PHOTO_MISSING");

  const normalizedBudget = hasFieldValue(f.budget)
    ? {
        disclosure: f.budget.value?.disclosure || "NOT_DISCLOSED",
        signal: f.budget.value?.signal || "UNCLEAR",
        risk: f.budget.value?.risk || "MEDIUM",
        indicators: f.budget.value?.indicators || {},
      }
    : {
        ...state.budget,
        risk: "MEDIUM",
      };

  if (normalizedBudget.risk === "HIGH") {
    flags.push("BUDGET_HIGH_RISK");
  } else if (normalizedBudget.risk === "MEDIUM") {
    flags.push("BUDGET_MEDIUM_RISK");
  }

  if (state?.meta?.propertyUse === "RENTAL") {
    flags.push("RENTAL_PROPERTY");
  }

  if (hasSubmissionBlockingClarification(state)) {
    flags.push("NEEDS_CLARIFICATION");
  }

  if (!meetsSubmissionConfidenceThreshold(state)) {
    flags.push("LOW_CONFIDENCE_FIELDS");
  }

  return {
    ...state,
    phase: nextPhase,
    meta: {
      ...state.meta,
      photoMissing,
      handoffReady: isFull,
      contactRequested: state.meta.contactRequested || contactRequiredNow,
    },
    budget: normalizedBudget,
    classification: {
      completion: isFull ? "FULL" : "PARTIAL",
      actionable: Boolean(hasFieldValue(f.firstName) && hasFieldValue(f.email)),
      flags,
    },
  };
}

function shouldQueueFollowUp(state, key) {
  if (!FOLLOW_UP_CATALOG[key]) return false;
  if (hasOptionalInsight(state, key)) return false;
  if (getAskedFollowUpCount(state, key) >= 1) return false;

  const jobType = getFieldValue(state, "jobType");
  const kitchenSize = getFieldValue(state, "kitchenSize");
  const layoutChange = getFieldValue(state, "layoutChange");
  const unitsSupply = getFieldValue(state, "unitsSupply");
  const timeline = getFieldValue(state, "timeline");
  const budget = getFieldValue(state, "budget");

  if (key === "unitCount") {
    return (
      Boolean(kitchenSize) &&
      (kitchenSize === "MEDIUM" ||
        kitchenSize === "LARGE" ||
        jobType === "FULL_FIT")
    );
  }

  if (key === "layoutShape") {
    return Boolean(kitchenSize) && (jobType === "FULL_FIT" || layoutChange === "MAJOR");
  }

  if (key === "servicesMoving") {
    return layoutChange === "MINOR" || layoutChange === "MAJOR";
  }

  if (key === "unitsChosen") {
    return unitsSupply === "CUSTOMER_SUPPLIED";
  }

  if (key === "unitsBrandKnown") {
    return (
      unitsSupply === "CUSTOMER_SUPPLIED" &&
      hasOptionalInsight(state, "unitsChosen")
    );
  }

  if (key === "budgetScope") {
    return Boolean(budget) && (jobType === "FULL_FIT" || unitsSupply === "FITTER_SUPPLIED");
  }

  if (key === "timelineFlexibility") {
    return (
      timeline === "ASAP" ||
      timeline === "1_3_MONTHS" ||
      state?.meta?.propertyUse === "RENTAL"
    );
  }

  return false;
}

function enqueueFollowUps(state) {
  const existingQueue = Array.isArray(state?.meta?.followUpQueue)
    ? [...state.meta.followUpQueue]
    : [];

  const present = new Set(existingQueue);

  for (const key of Object.keys(FOLLOW_UP_CATALOG)) {
    if (present.has(key)) continue;
    if (shouldQueueFollowUp(state, key)) {
      existingQueue.push(key);
      present.add(key);
    }
  }

  existingQueue.sort((a, b) => {
    const aPriority = Number(FOLLOW_UP_CATALOG[a]?.priority || 0);
    const bPriority = Number(FOLLOW_UP_CATALOG[b]?.priority || 0);
    return bPriority - aPriority;
  });

  return {
    ...state,
    meta: {
      ...state.meta,
      followUpQueue: existingQueue,
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
    meta: {
      ...(args.state.meta || {}),
      notes: Array.isArray(args.state?.meta?.notes)
        ? [...args.state.meta.notes]
        : [],
      fieldEvidence: {
        ...(args.state?.meta?.fieldEvidence || {}),
      },
      contradictions: Array.isArray(args.state?.meta?.contradictions)
        ? [...args.state.meta.contradictions]
        : [],
      optionalInsights: {
        ...(args.state?.meta?.optionalInsights || {}),
      },
      followUpQueue: Array.isArray(args.state?.meta?.followUpQueue)
        ? [...args.state.meta.followUpQueue]
        : [],
      askedFollowUps: {
        ...(args.state?.meta?.askedFollowUps || {}),
      },
    },
    fields: {
      ...(args.state.fields || {}),
    },
  };

  if (args.timelineSpecific === true) {
    next.meta.timelineSpecific = true;
  }

  if (args.metaPatch?.propertyUse) {
    next.meta.propertyUse = args.metaPatch.propertyUse;
  }

  if (args.metaPatch?.lastUserIntent) {
    next.meta.lastUserIntent = args.metaPatch.lastUserIntent;
  }

  for (const note of args.metaPatch?.notesToAdd || []) {
    addUniqueNote(next.meta.notes, note);
  }

  for (const [key, value] of Object.entries(args.metaPatch?.optionalInsights || {})) {
    next.meta.optionalInsights[key] = mergeOptionalInsight(
      next.meta.optionalInsights[key],
      value
    );
  }

  let pendingClarification = next.meta.pendingClarification || null;

  for (const ambiguity of args.metaPatch?.ambiguities || []) {
    if (!pendingClarification) {
      pendingClarification = {
        field: ambiguity.field,
        question: ambiguity.question,
        reason: ambiguity.reason,
        createdAt: args.nowIso,
      };
    }
  }

  for (const u of args.updates || []) {
    next.meta.fieldEvidence[u.key] = mergeFieldEvidence(
      next.meta.fieldEvidence[u.key],
      u,
      args.userMessage || "",
      args.nowIso
    );

    const existingField = next.fields[u.key];

    if (isContradictoryFieldUpdate(existingField, u)) {
      addUniqueContradiction(next.meta.contradictions, {
        field: u.key,
        from: existingField.value,
        to: u.value,
        at: args.nowIso,
      });

      pendingClarification = {
        field: u.key,
        question: buildClarificationForContradiction(
          u.key,
          existingField.value,
          u.value
        ),
        reason: "contradiction",
        createdAt: args.nowIso,
      };
      continue;
    }

    if (shouldClarifyBudget(existingField, u)) {
      pendingClarification = {
        field: "budget",
        question:
          "Just to make sure I've got the budget right, is it closer to the earlier figure or the later one?",
        reason: "budget_conflict",
        createdAt: args.nowIso,
      };
      continue;
    }

    if (!compareFieldStrength(existingField, u)) {
      continue;
    }

    next.fields[u.key] = {
      value: u.value,
      source: u.source || "ai",
      confidence: typeof u.confidence === "number" ? u.confidence : 0.8,
      updatedAt: args.nowIso,
    };

    if (
      pendingClarification &&
      pendingClarification.field === u.key &&
      Number(u.confidence || 0) >= 0.9
    ) {
      pendingClarification = null;
    }
  }

  next.meta.pendingClarification = pendingClarification;
  next = recomputeDerivedState(next);
  next = enqueueFollowUps(next);

  return next;
}

function annotateQuestionAsked(state, nextField) {
  if (!nextField) {
    return {
      ...state,
      meta: {
        ...state.meta,
        lastQuestionField: null,
      },
    };
  }

  const askedCounts = {
    ...(state?.meta?.askedCounts || {}),
    [nextField]: Number(state?.meta?.askedCounts?.[nextField] || 0) + 1,
  };

  const askedSequence = Array.isArray(state?.meta?.askedSequence)
    ? [...state.meta.askedSequence, nextField]
    : [nextField];

  return {
    ...state,
    meta: {
      ...state.meta,
      askedCounts,
      askedSequence,
      lastQuestionField: nextField,
    },
  };
}

function annotateFollowUpAsked(state, followUpKey) {
  if (!followUpKey) return state;

  const askedFollowUps = {
    ...(state?.meta?.askedFollowUps || {}),
    [followUpKey]: Number(state?.meta?.askedFollowUps?.[followUpKey] || 0) + 1,
  };

  const nextQueue = Array.isArray(state?.meta?.followUpQueue)
    ? state.meta.followUpQueue.filter((item) => item !== followUpKey)
    : [];

  return {
    ...state,
    meta: {
      ...state.meta,
      askedFollowUps,
      followUpQueue: nextQueue,
      lastQuestionField: followUpKey,
    },
  };
}

function formatBudgetSummary(budget) {
  if (!budget || typeof budget !== "object") return null;

  const min = budget?.indicators?.amountMin;
  const max = budget?.indicators?.amountMax;
  const disclosure = budget?.disclosure;

  if (disclosure === "NOT_DISCLOSED") {
    return "budget still open";
  }

  if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
    return `budget around £${Math.round(min / 1000)}k-£${Math.round(max / 1000)}k`;
  }

  if (Number.isFinite(max) && budget?.indicators?.under) {
    return `budget up to £${Math.round(max / 1000)}k`;
  }

  if (Number.isFinite(max) && Number.isFinite(min) && min === max) {
    if (max >= 1000) {
      return `budget around £${Math.round(max / 1000)}k`;
    }
    return `budget around £${max}`;
  }

  if (budget?.indicators?.lowestPossible) {
    return "budget as low as possible";
  }

  return null;
}

function formatTimelineSummary(value) {
  if (!value) return null;
  if (value === "ASAP") return "timeline ASAP";
  if (value === "1_3_MONTHS") return "timeline in the next 1-3 months";
  if (value === "3_6_MONTHS") return "timeline in the next 3-6 months";
  if (value === "6_PLUS") return "timeline later on";
  return null;
}

function formatFieldSummary(field, value, state) {
  if (!value) return null;

  if (field === "jobType") {
    if (value === "FULL_FIT") return "full kitchen fit";
    if (value === "REFRESH") return "kitchen refresh";
    if (value === "WORKTOPS") return "worktops only";
  }

  if (field === "postcode") {
    return `property in ${value}`;
  }

  if (field === "kitchenSize") {
    return `${String(value).toLowerCase()} kitchen`;
  }

  if (field === "layoutChange") {
    if (value === "NONE") return "same layout";
    if (value === "MINOR") return "minor layout changes";
    if (value === "MAJOR") return "major layout changes";
  }

  if (field === "unitsSupply") {
    if (value === "CUSTOMER_SUPPLIED") return "customer supplying units";
    if (value === "FITTER_SUPPLIED") return "supply and fit";
    if (value === "UNSURE") return "units supply still open";
  }

  if (field === "timeline") {
    return formatTimelineSummary(value);
  }

  if (field === "budget") {
    return formatBudgetSummary(value);
  }

  if (field === "firstName") {
    return `name ${value}`;
  }

  if (field === "email") {
    return "email captured";
  }

  if (field === "phone") {
    return "phone captured";
  }

  return null;
}

function buildCapturedSummary(capturedKeys, state) {
  const summaries = [];

  for (const key of capturedKeys || []) {
    const value = getFieldValue(state, key);
    const summary = formatFieldSummary(key, value, state);
    if (summary) summaries.push(summary);
  }

  if (state?.meta?.propertyUse === "RENTAL" && !summaries.includes("rental property")) {
    summaries.push("rental property");
  }

  return summaries.slice(0, 3);
}

function joinNatural(parts) {
  const cleaned = (parts || []).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

function buildAcknowledgement(capturedKeys, state) {
  const keySet = new Set(capturedKeys || []);

  if (keySet.has("firstName") && keySet.has("email")) {
    return "Perfect, thanks.";
  }

  if (keySet.has("budget")) {
    const budget = getFieldValue(state, "budget");
    if (budget?.disclosure === "NOT_DISCLOSED") {
      return "No problem.";
    }
  }

  const summary = buildCapturedSummary(capturedKeys, state);

  if (summary.length >= 2) {
    return `Got it - ${joinNatural(summary)}.`;
  }

  if (summary.length === 1) {
    return `Got it - ${summary[0]}.`;
  }

  if ((capturedKeys || []).length >= 2) {
    return "Thanks, that's helpful.";
  }

  if ((capturedKeys || []).length === 1) {
    return "Got it.";
  }

  return "";
}

function getQuestionPriorityScore(state, key) {
  const base = Number(QUESTION_CATALOG[key]?.priority || 0);
  const askedCount = getAskedCount(state, key);
  const lastQuestionField = getExpectedFieldFromState(state);
  let score = base;

  if (askedCount > 0) {
    score -= askedCount * 30;
  }

  if (lastQuestionField === key) {
    score -= 20;
  }

  if (key === "postcode") {
    score += 10;
  }

  if (key === "jobType") {
    score += 20;
  }

  if (key === "firstName" || key === "email") {
    if (!shouldPreferContactNow(state)) score -= 10;
    else score += 8;
  }

  if (key === "timeline" && getFieldValue(state, "jobType")) {
    score += 3;
  }

  if (key === "budget" && getFieldValue(state, "timeline")) {
    score += 2;
  }

  return score;
}

function pickBestMissingField(state) {
  const missingProjectFields = getMissingProjectFields(state);
  const missingContactFields = getMissingContactFields(state);

  const candidateKeys = shouldPreferContactNow(state)
    ? [...missingProjectFields, ...missingContactFields]
    : [...missingProjectFields, ...missingContactFields];

  if (candidateKeys.length === 0) return null;

  const scored = candidateKeys.map((key) => ({
    key,
    score: getQuestionPriorityScore(state, key),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.key || null;
}

function pickBestFollowUp(state) {
  const queue = Array.isArray(state?.meta?.followUpQueue)
    ? state.meta.followUpQueue
    : [];

  for (const key of queue) {
    if (FOLLOW_UP_CATALOG[key] && !hasOptionalInsight(state, key)) {
      return key;
    }
  }

  return null;
}

function shouldAskFollowUpNow(state, followUpKey) {
  if (!followUpKey) return false;
  if (!FOLLOW_UP_CATALOG[followUpKey]) return false;
  if (hasSubmissionBlockingClarification(state)) return false;
  if (hasOptionalInsight(state, followUpKey)) return false;
  if (getAskedFollowUpCount(state, followUpKey) >= 1) return false;

  const missingProject = getMissingProjectFields(state);
  if (missingProject.length > 2) return false;

  const missingContact = getMissingContactFields(state);
  if (shouldPreferContactNow(state) && missingContact.length > 0) return false;

  return true;
}

function getConversationTone(state, options = {}) {
  const capturedKeys = options.capturedKeys || [];
  const turnCount = Number(state?.audit?.turnCount || 0);
  const propertyUse = state?.meta?.propertyUse || null;
  const budget = getFieldValue(state, "budget");

  if (state?.meta?.pendingClarification) return "clarifying";
  if (budget?.disclosure === "NOT_DISCLOSED") return "reassuring";
  if (propertyUse === "RENTAL") return "practical";
  if (capturedKeys.length >= 3) return "confident";
  if (turnCount <= 1) return "welcoming";
  return "neutral";
}

function softenQuestion(question, tone, nextField) {
  if (!question) return question;

  if (tone === "reassuring" && nextField === "budget") {
    return "No worries if it's not fixed yet - do you have a rough budget in mind? Even a ballpark is helpful.";
  }

  if (tone === "practical" && nextField === "timeline") {
    return "Roughly when were you hoping to get this done?";
  }

  if (tone === "welcoming" && nextField === "jobType") {
    return "To start with, what sort of kitchen project is it - a full fit, a refresh, or worktops only?";
  }

  if (tone === "confident" && nextField === "firstName") {
    return "That gives me a good picture so far - can I grab your first name?";
  }

  if (tone === "confident" && nextField === "email") {
    return "Great - what's the best email to send the confirmation to?";
  }

  return question;
}

function buildHumanReply(acknowledgement, question) {
  if (!acknowledgement && !question) return "";
  if (!acknowledgement) return question;
  if (!question) return acknowledgement;
  return `${acknowledgement} ${question}`;
}

function getQuickSelectsForField(field, state) {
  if (!field) return [];
  if (FOLLOW_UP_CATALOG[field]?.quickSelects) {
    return FOLLOW_UP_CATALOG[field].quickSelects.slice(0, 5);
  }
  if (QUESTION_CATALOG[field]?.quickSelects) {
    const defaults = QUESTION_CATALOG[field].quickSelects.slice(0, 5);

    if (field === "postcode") {
      const existing = getFieldValue(state, "postcode");
      if (existing && !defaults.includes(existing)) {
        return [existing, ...defaults].slice(0, 5);
      }
    }

    return defaults;
  }
  return [];
}

function getCompletionSummary(state) {
  const jobType = formatFieldSummary("jobType", getFieldValue(state, "jobType"), state);
  const postcode = formatFieldSummary("postcode", getFieldValue(state, "postcode"), state);
  const timeline = formatFieldSummary("timeline", getFieldValue(state, "timeline"), state);
  const budget = formatFieldSummary("budget", getFieldValue(state, "budget"), state);

  return joinNatural([jobType, postcode, timeline, budget].filter(Boolean));
}

function getNextQuestion(state, options = {}) {
  const pendingClarification = state?.meta?.pendingClarification || null;
  const capturedKeys = options.capturedKeys || [];
  const acknowledgement = buildAcknowledgement(capturedKeys, state);
  const tone = getConversationTone(state, options);

  if (pendingClarification?.question) {
    const quickSelects = getQuickSelectsForField(pendingClarification.field, state);
    return {
      nextField: pendingClarification.field,
      question: pendingClarification.question,
      reply: buildHumanReply(
        acknowledgement || "Just to make sure I've got this right.",
        pendingClarification.question
      ),
      tone: "clarifying",
      isFollowUp: false,
      quickSelects,
    };
  }

  const followUpKey = pickBestFollowUp(state);
  if (shouldAskFollowUpNow(state, followUpKey)) {
    const baseQuestion = FOLLOW_UP_CATALOG[followUpKey].question;
    const question = softenQuestion(baseQuestion, tone, followUpKey);
    const quickSelects = getQuickSelectsForField(followUpKey, state);

    return {
      nextField: followUpKey,
      question,
      reply: buildHumanReply(acknowledgement, question),
      tone,
      isFollowUp: true,
      quickSelects,
    };
  }

  const nextField = pickBestMissingField(state);

  if (!nextField) {
    const completionSummary = getCompletionSummary(state);
    return {
      nextField: null,
      question: null,
      reply: completionSummary
        ? `Thanks - I've got what I need: ${completionSummary}. I'll pass this over for review.`
        : "Thanks - I've got everything I need for now. I'll pass this over for review.",
      tone: "complete",
      isFollowUp: false,
      quickSelects: [],
    };
  }

  const baseQuestion = QUESTION_CATALOG[nextField]?.question || null;
  const question = softenQuestion(baseQuestion, tone, nextField);
  const quickSelects = getQuickSelectsForField(nextField, state);

  return {
    nextField,
    question,
    reply: buildHumanReply(acknowledgement, question),
    tone,
    isFollowUp: false,
    quickSelects,
  };
}

function parseLeadIdFromUrl(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 2 && parts[0] === "leads"
    ? decodeURIComponent(parts[1])
    : null;
}

function parseTradesmanSlugFromUrl(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 2 && parts[0] === "tradesman"
    ? decodeURIComponent(parts[1])
    : null;
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

function isTerminalInactiveStripeSubscriptionStatus(status) {
  return (
    status === "canceled" ||
    status === "unpaid" ||
    status === "paused" ||
    status === "incomplete_expired"
  );
}

async function resolveTradesmanForCheckoutSession(session) {
  const tradesmanId =
    session?.metadata?.tradesmanId ||
    session?.client_reference_id ||
    null;

  if (tradesmanId) {
    const byId = await getTradesmanById(tradesmanId);
    if (byId) return byId;
  }

  const stripeCustomerId =
    typeof session?.customer === "string" ? session.customer : null;

  if (stripeCustomerId) {
    const byCustomer = await getTradesmanByStripeCustomerId(stripeCustomerId);
    if (byCustomer) return byCustomer;
  }

  const email =
    session?.customer_details?.email ||
    session?.customer_email ||
    session?.metadata?.tradesmanEmail ||
    null;

  if (email) {
    const byEmail = await getTradesmanByEmail(String(email).trim().toLowerCase());
    if (byEmail) return byEmail;
  }

  return null;
}

async function resolveTradesmanForSubscription(subscription) {
  const tradesmanId = subscription?.metadata?.tradesmanId || null;

  if (tradesmanId) {
    const byId = await getTradesmanById(tradesmanId);
    if (byId) return byId;
  }

  const stripeCustomerId =
    typeof subscription?.customer === "string" ? subscription.customer : null;

  if (stripeCustomerId) {
    const byCustomer = await getTradesmanByStripeCustomerId(stripeCustomerId);
    if (byCustomer) return byCustomer;
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
        stripeCustomerId,
        stripeSubscriptionId,
        stripeStatus,
      }
    );
    return;
  }

  const currentStatus = String(tradesman.subscriptionStatus || "").toUpperCase();

  if (currentStatus === "ACTIVE") {
    if (isTerminalInactiveStripeSubscriptionStatus(stripeStatus)) {
      await updateTradesman(tradesman.tradesmanId, {
        subscriptionStatus: "INACTIVE",
        stripeCustomerId,
        stripeSubscriptionId,
      });

      logInfo("billing.subscription.downgraded", {
        tradesmanId: tradesman.tradesmanId,
        stripeStatus,
      });
    } else {
      logInfo("billing.subscription.ignored_update", {
        tradesmanId: tradesman.tradesmanId,
        stripeStatus,
      });
    }

    return;
  }

  if (stripeStatus === "active" || stripeStatus === "trialing") {
    await updateTradesman(tradesman.tradesmanId, {
      subscriptionStatus: "ACTIVE",
      stripeCustomerId,
      stripeSubscriptionId,
    });

    logInfo("billing.subscription.activated", {
      tradesmanId: tradesman.tradesmanId,
    });
  }
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

      sendJson(
        res,
        200,
        { token, tradesman: sanitizeTradesman(tradesman) },
        allowedOrigin
      );
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
      const tradesman = tradesmanSlug
        ? await getTradesmanBySlug(tradesmanSlug)
        : null;

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
      const prepared = enqueueFollowUps(created.state);
      const next = getNextQuestion(prepared);

      let stateWithMeta = {
        ...prepared,
        meta: {
          ...prepared.meta,
          lastBotStyle: next.tone || null,
          quickSelects: next.quickSelects || [],
        },
      };

      stateWithMeta = next.isFollowUp
        ? annotateFollowUpAsked(stateWithMeta, next.nextField)
        : annotateQuestionAsked(stateWithMeta, next.nextField);

      const initialMessages = [{ role: "bot", text: next.reply }];

      await updateConversation(
        created.conversationId,
        stateWithMeta,
        initialMessages
      );

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
          state: freshConversation?.state || stateWithMeta,
          messages: freshConversation?.messages || initialMessages,
          nextField: next.nextField,
          question: next.question,
          reply: next.reply,
          quickSelects: next.quickSelects || [],
        },
        allowedOrigin
      );
      return;
    }

    if (
      req.method === "POST" &&
      requestUrl.pathname === "/conversation/apply-updates"
    ) {
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
        metaPatch: body.metaPatch || null,
        userMessage: body.userMessage || "",
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

      const messages = Array.isArray(conversation.messages)
        ? [...conversation.messages]
        : [];
      messages.push({ role: "user", text: String(message) });

      const extracted = extractUpdatesFromMessage(String(message), conversation.state);

      const nextState = applyValidatedUpdates({
        state: conversation.state,
        nowIso: new Date().toISOString(),
        updates: extracted.updates,
        timelineSpecific: extracted.timelineSpecific === true,
        metaPatch: extracted.metaPatch,
        userMessage: String(message),
      });

      const next = getNextQuestion(nextState, {
        capturedKeys: extracted.updates.map((item) => item.key),
      });

      let stateWithTone = {
        ...nextState,
        meta: {
          ...nextState.meta,
          lastBotStyle: next.tone || null,
          quickSelects: next.quickSelects || [],
        },
      };

      stateWithTone = next.isFollowUp
        ? annotateFollowUpAsked(stateWithTone, next.nextField)
        : annotateQuestionAsked(stateWithTone, next.nextField);

      messages.push({ role: "bot", text: next.reply });

      await updateConversation(conversationId, stateWithTone, messages);

      logInfo("conversation.message", {
        conversationId,
        phase: stateWithTone.phase,
        capturedKeys: extracted.updates.map((item) => item.key),
        nextField: next.nextField,
        pendingClarification: Boolean(stateWithTone?.meta?.pendingClarification),
        tone: next.tone || null,
        isFollowUp: next.isFollowUp === true,
      });

      sendJson(
        res,
        200,
        {
          conversationId,
          state: stateWithTone,
          messages,
          nextField: next.nextField,
          question: next.question,
          reply: next.reply,
          quickSelects: next.quickSelects || [],
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

      if (hasSubmissionBlockingClarification(conversation.state)) {
        sendJson(
          res,
          400,
          { error: "Conversation still needs clarification before submission" },
          allowedOrigin
        );
        return;
      }

      if (!meetsSubmissionConfidenceThreshold(conversation.state)) {
        sendJson(
          res,
          400,
          { error: "Conversation data is not confident enough for submission yet" },
          allowedOrigin
        );
        return;
      }

      const submissionErrors = validateConversationStateForSubmission(
        conversation.state
      );
      if (submissionErrors.length > 0) {
        sendJson(res, 400, { error: submissionErrors.join(", ") }, allowedOrigin);
        return;
      }

      let ownership = getTradesmanFromConversationState(conversation.state);

      if (!ownership.tradesmanId) {
        const fallbackSlug =
          conversation.state?.meta?.tradesmanSlug ||
          conversation.state?.meta?.slug ||
          null;

        if (fallbackSlug) {
          const fallbackTradesman = await getTradesmanBySlug(fallbackSlug);
          if (fallbackTradesman) {
            ownership.tradesmanId = fallbackTradesman.tradesmanId;
            ownership.tradesmanSlug = fallbackTradesman.slug;
            ownership.tradesmanBusinessName = fallbackTradesman.businessName;
          }
        }
      }

      const normalizedMeta = {
        ...(conversation.state.meta || {}),
        tradesmanId: ownership.tradesmanId || null,
        tradesmanSlug: ownership.tradesmanSlug || null,
        tradesmanBusinessName: ownership.tradesmanBusinessName || null,
      };

      const lead = await createLead({
        createdAt: new Date().toISOString(),
        status: "NEW",
        tradesmanId: ownership.tradesmanId,
        tradeKind: conversation.state.tradeKind,
        phase: conversation.state.phase,
        classification: conversation.state.classification,
        fields: conversation.state.fields,
        meta: normalizedMeta,
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