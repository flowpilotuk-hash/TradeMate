const { isValidEmail, isValidUkPostcode } = require("./validators");

const SHARED_QUESTIONS = {
  postcode: {
    priority: 95,
    question: "What postcode is the property in?",
    quickSelects: ["LS15", "WF3", "Not sure"],
  },
  timeline: {
    priority: 76,
    question: "When were you hoping to get this done?",
    quickSelects: ["ASAP", "Next 1-3 months", "3-6 months", "Later on"],
  },
  budget: {
    priority: 72,
    question: "Do you have a rough budget in mind? Even a ballpark is helpful.",
    quickSelects: ["Under £5k", "£5k-£15k", "£15k+", "Not sure yet"],
  },
};

const CONTACT_QUESTIONS = {
  firstName: { priority: 50, question: "Can I grab your first name?", quickSelects: [] },
  email: {
    priority: 45,
    question: "What's the best email to send the confirmation to?",
    quickSelects: [],
  },
};

const CONTACT_FIELDS = ["firstName", "email"];

const TRADE_PROFILES = {
  KITCHEN: {
    label: "Kitchen",
    projectFields: [
      "jobType",
      "postcode",
      "kitchenSize",
      "layoutChange",
      "unitsSupply",
      "timeline",
      "budget",
    ],
    questions: {
      jobType: {
        priority: 100,
        question:
          "What sort of kitchen project is it - a full fit, a refresh, or worktops only?",
        quickSelects: ["Full fit", "Refresh", "Worktops only"],
      },
      kitchenSize: {
        priority: 80,
        question: "Roughly what size is the kitchen - small, medium, or large?",
        quickSelects: ["Small", "Medium", "Large"],
      },
      layoutChange: {
        priority: 88,
        question:
          "Are you keeping the same layout, making a few changes, or changing it quite a bit?",
        quickSelects: ["Same layout", "A few changes", "Major changes"],
      },
      unitsSupply: {
        priority: 85,
        question: "Will you be supplying the units, or are you looking for supply and fit?",
        quickSelects: ["I’m supplying them", "Supply and fit", "Not sure yet"],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobType: "Please confirm the type of kitchen job required.",
      postcode: "Please provide the property postcode.",
      kitchenSize: "Please confirm the kitchen size.",
      layoutChange: "Please confirm whether the layout is staying the same or changing.",
      unitsSupply: "Please confirm who is supplying the units.",
      timeline: "Please confirm the project timeline.",
      budget: "Please provide a budget indication.",
    },
  },

  ELECTRICAL: {
    label: "Electrical",
    projectFields: ["jobType", "postcode", "propertyType", "scope", "occupancy", "timeline"],
    questions: {
      jobType: {
        priority: 100,
        question:
          "What sort of electrical work do you need - a rewire, extra sockets or lights, an EV charger, a consumer unit upgrade, or fault finding?",
        quickSelects: [
          "Rewire",
          "Extra sockets/lights",
          "EV charger",
          "Consumer unit",
          "Fault finding",
          "Other",
        ],
      },
      propertyType: {
        priority: 88,
        question: "What kind of property is it - a house, flat, or commercial space?",
        quickSelects: ["House", "Flat", "Commercial"],
      },
      scope: {
        priority: 85,
        question: "Is the work for the whole property or a specific room?",
        quickSelects: ["Whole property", "One room", "Multiple rooms"],
      },
      occupancy: {
        priority: 80,
        question: "Is the property currently lived in, empty, or being renovated?",
        quickSelects: ["Lived in", "Empty", "Renovation"],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobType: "Please confirm the type of electrical work needed.",
      postcode: "Please provide the property postcode.",
      propertyType: "Please confirm the property type.",
      scope: "Please confirm whether the work is for the whole property or a specific area.",
      occupancy: "Please confirm whether the property is occupied.",
      timeline: "Please confirm the project timeline.",
    },
  },

  TILING: {
    label: "Tiling",
    projectFields: ["jobType", "postcode", "area", "substrate", "supplyTiles", "timeline", "budget"],
    questions: {
      jobType: {
        priority: 100,
        question:
          "What sort of tiling job is it - kitchen splashback, bathroom walls, floor tiling, a wet room, or something else?",
        quickSelects: [
          "Kitchen splashback",
          "Bathroom walls",
          "Floor tiling",
          "Wet room",
          "Outdoor",
          "Other",
        ],
      },
      area: {
        priority: 88,
        question: "Roughly how big is the area to tile?",
        quickSelects: ["Under 5 m²", "5-10 m²", "10-20 m²", "20+ m²", "Not sure"],
      },
      substrate: {
        priority: 82,
        question:
          "What's the surface like at the moment - existing tiles, plaster, plywood, or screed?",
        quickSelects: ["Existing tiles", "Plaster", "Plywood", "Concrete/screed", "Not sure"],
      },
      supplyTiles: {
        priority: 78,
        question: "Are you supplying the tiles, or do you want supply and fit?",
        quickSelects: ["I’m supplying them", "Supply and fit", "Not sure yet"],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobType: "Please confirm the type of tiling work needed.",
      postcode: "Please provide the property postcode.",
      area: "Please indicate the rough area to tile.",
      substrate: "Please describe the surface to tile onto.",
      supplyTiles: "Please confirm who is supplying the tiles.",
      timeline: "Please confirm the project timeline.",
      budget: "Please provide a budget indication.",
    },
  },

  BATHROOM: {
    label: "Bathroom",
    projectFields: [
      "jobType",
      "postcode",
      "size",
      "moveServices",
      "supplyFixtures",
      "timeline",
      "budget",
    ],
    questions: {
      jobType: {
        priority: 100,
        question:
          "What sort of bathroom job is it - a full refit, a refresh, a wet room, or a new ensuite?",
        quickSelects: ["Full refit", "Refresh", "Wet room", "Ensuite", "Other"],
      },
      size: {
        priority: 88,
        question: "Roughly what size is the bathroom - small, medium, or large?",
        quickSelects: ["Small", "Medium", "Large"],
      },
      moveServices: {
        priority: 82,
        question:
          "Are you moving any services (sink, toilet, shower) or keeping them where they are?",
        quickSelects: ["Keeping the layout", "Moving some", "Major changes"],
      },
      supplyFixtures: {
        priority: 78,
        question:
          "Are you supplying the suite and tiles, or do you want supply and fit?",
        quickSelects: ["I’m supplying them", "Supply and fit", "Not sure yet"],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobType: "Please confirm the type of bathroom work needed.",
      postcode: "Please provide the property postcode.",
      size: "Please confirm the bathroom size.",
      moveServices: "Please confirm whether services are moving.",
      supplyFixtures: "Please confirm who is supplying the fixtures.",
      timeline: "Please confirm the project timeline.",
      budget: "Please provide a budget indication.",
    },
  },

  JOINERY: {
    label: "Joinery",
    projectFields: [
      "jobType",
      "postcode",
      "scope",
      "material",
      "supplyMaterial",
      "timeline",
      "budget",
    ],
    questions: {
      jobType: {
        priority: 100,
        question:
          "What sort of joinery work is it - doors, skirting and architrave, a staircase, fitted wardrobes, decking, or something else?",
        quickSelects: [
          "Doors",
          "Skirting/architrave",
          "Staircase",
          "Fitted wardrobes",
          "Decking",
          "Other",
        ],
      },
      scope: {
        priority: 85,
        question: "Roughly how much is involved - one item, a few rooms, or a whole-house job?",
        quickSelects: ["One item", "A few rooms", "Whole house"],
      },
      material: {
        priority: 78,
        question: "What sort of material were you thinking - oak, pine, MDF, hardwood, or unsure?",
        quickSelects: ["Oak", "Pine", "MDF", "Hardwood", "Not sure"],
      },
      supplyMaterial: {
        priority: 74,
        question: "Are you supplying the materials, or do you want supply and fit?",
        quickSelects: ["I’m supplying it", "Supply and fit", "Not sure yet"],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobType: "Please confirm the type of joinery work needed.",
      postcode: "Please provide the property postcode.",
      scope: "Please confirm the scope of the work.",
      material: "Please confirm the material.",
      supplyMaterial: "Please confirm who is supplying the materials.",
      timeline: "Please confirm the project timeline.",
      budget: "Please provide a budget indication.",
    },
  },

  OTHER: {
    label: "Other",
    projectFields: ["jobDescription", "postcode", "timeline", "budget"],
    questions: {
      jobDescription: {
        priority: 100,
        question:
          "Could you describe the work you need? A few words is fine - e.g. 'plastering one bedroom' or 'replacing a roof tile'.",
        quickSelects: [],
      },
      ...SHARED_QUESTIONS,
      ...CONTACT_QUESTIONS,
    },
    submissionPrompts: {
      jobDescription: "Please describe the work needed.",
      postcode: "Please provide the property postcode.",
      timeline: "Please confirm the project timeline.",
      budget: "Please provide a budget indication.",
    },
  },
};

const TRADE_DETECTION_QUESTION = {
  field: "tradeKind",
  question:
    "What kind of work do you need help with - kitchens, electrical, tiling, bathrooms, or joinery?",
  quickSelects: ["Kitchen", "Electrical", "Tiling", "Bathroom", "Joinery", "Other"],
};

const TRADE_KEYWORDS = {
  KITCHEN: ["kitchen", "worktop", "cabinets", "kitchen units"],
  ELECTRICAL: [
    "rewire",
    "rewiring",
    "electric",
    "socket",
    "lighting",
    "lights",
    "consumer unit",
    "fuseboard",
    "ev charger",
    "fault finding",
    "circuit",
    "wiring",
    "electrician",
  ],
  TILING: ["tile", "tiles", "tiling", "grout", "splashback"],
  BATHROOM: ["bathroom", "ensuite", "wet room", "shower", "bathtub", "toilet", "basin"],
  JOINERY: [
    "joinery",
    "carpentry",
    "carpenter",
    "joiner",
    "skirting",
    "architrave",
    "staircase",
    "wardrobe",
    "decking",
    "shelving",
  ],
};

function normalizeTradeKindInput(text) {
  const lower = String(text || "").toLowerCase().trim();
  if (!lower) return null;

  if (lower === "kitchen" || lower === "kitchens") return "KITCHEN";
  if (lower === "electrical" || lower === "electric" || lower === "electrics")
    return "ELECTRICAL";
  if (lower === "tiling" || lower === "tiles" || lower === "tiler") return "TILING";
  if (lower === "bathroom" || lower === "bathrooms") return "BATHROOM";
  if (lower === "joinery" || lower === "carpentry") return "JOINERY";
  if (lower === "other") return "OTHER";

  return null;
}

function detectTradeFromKeywords(text) {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();
  const scores = {};

  for (const [trade, keywords] of Object.entries(TRADE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > 0) scores[trade] = score;
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0][0];

  entries.sort(([, a], [, b]) => b - a);

  if (entries[0][1] >= entries[1][1] + 1) return entries[0][0];

  return null;
}

function resolveTradeFromMessage(text) {
  const direct = normalizeTradeKindInput(text);
  if (direct) return direct;
  return detectTradeFromKeywords(text);
}

function getTradeProfile(tradeKind) {
  if (!tradeKind || tradeKind === "UNKNOWN") return null;
  return TRADE_PROFILES[tradeKind] || null;
}

function getProjectFieldsForTrade(tradeKind) {
  return getTradeProfile(tradeKind)?.projectFields || [];
}

function getQuestionDefinitionsForTrade(tradeKind) {
  return getTradeProfile(tradeKind)?.questions || {};
}

function getQuestionDefinition(tradeKind, fieldKey) {
  const questions = getQuestionDefinitionsForTrade(tradeKind);
  return questions[fieldKey] || null;
}

function isFieldInTrade(tradeKind, fieldKey) {
  const profile = getTradeProfile(tradeKind);
  if (!profile) return false;
  if (profile.projectFields.includes(fieldKey)) return true;
  if (CONTACT_FIELDS.includes(fieldKey)) return true;
  return false;
}

function hasFieldValue(field) {
  const value = field?.value;
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function validateConversationStateForSubmission(state) {
  const errors = [];
  const fields = (state && state.fields) || {};
  const tradeKind = (state && state.tradeKind) || "UNKNOWN";

  if (tradeKind === "UNKNOWN") {
    errors.push("Please confirm the type of work needed.");
    return errors;
  }

  const profile = getTradeProfile(tradeKind);
  if (!profile) {
    errors.push("Trade not recognised.");
    return errors;
  }

  for (const fieldKey of profile.projectFields) {
    if (!hasFieldValue(fields[fieldKey])) {
      errors.push(profile.submissionPrompts[fieldKey] || `Please provide ${fieldKey}.`);
    }
  }

  if (hasFieldValue(fields.postcode)) {
    const postcode = fields.postcode.value;
    if (!isValidUkPostcode(postcode)) {
      errors.push("postcode must be a valid UK postcode");
    }
  }

  if (!hasFieldValue(fields.firstName)) {
    errors.push("Please provide a first name.");
  } else {
    const firstName = fields.firstName.value;
    if (typeof firstName === "string" && firstName.trim().length < 2) {
      errors.push("firstName must be at least 2 characters");
    }
  }

  if (!hasFieldValue(fields.email)) {
    errors.push("Please provide an email address.");
  } else if (!isValidEmail(fields.email.value)) {
    errors.push("email must be valid");
  }

  return errors;
}

module.exports = {
  TRADE_PROFILES,
  TRADE_DETECTION_QUESTION,
  CONTACT_FIELDS,
  normalizeTradeKindInput,
  detectTradeFromKeywords,
  resolveTradeFromMessage,
  getTradeProfile,
  getProjectFieldsForTrade,
  getQuestionDefinitionsForTrade,
  getQuestionDefinition,
  isFieldInTrade,
  validateConversationStateForSubmission,
};
