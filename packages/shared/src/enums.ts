export const TradeKind = {
  KITCHEN: "KITCHEN",
} as const;
export type TradeKind = (typeof TradeKind)[keyof typeof TradeKind];

export const ConversationPhase = {
  COLLECTING: "COLLECTING",
  AWAITING_CONTACT: "AWAITING_CONTACT",
  READY_FOR_HANDOFF: "READY_FOR_HANDOFF",
  HANDED_OFF: "HANDED_OFF",
  CLOSED: "CLOSED",
} as const;
export type ConversationPhase =
  (typeof ConversationPhase)[keyof typeof ConversationPhase];

export const LeadCompletion = {
  FULL: "FULL",
  PARTIAL: "PARTIAL",
} as const;
export type LeadCompletion = (typeof LeadCompletion)[keyof typeof LeadCompletion];

export const LeadStatus = {
  OPEN: "OPEN",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const BudgetDisclosure = {
  EXPLICIT: "EXPLICIT",
  INDIRECT: "INDIRECT",
  NOT_DISCLOSED: "NOT_DISCLOSED",
} as const;
export type BudgetDisclosure =
  (typeof BudgetDisclosure)[keyof typeof BudgetDisclosure];

export const BudgetSignal = {
  ALIGNED: "ALIGNED",
  UNCLEAR: "UNCLEAR",
  LOW: "LOW",
} as const;
export type BudgetSignal = (typeof BudgetSignal)[keyof typeof BudgetSignal];

export const BudgetRisk = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type BudgetRisk = (typeof BudgetRisk)[keyof typeof BudgetRisk];

export const ChatIntent = {
  PROVIDE_INFO: "PROVIDE_INFO",
  ASK_FAQ: "ASK_FAQ",
  ASK_PRICING: "ASK_PRICING",
  UPLOAD_PHOTO_INTENT: "UPLOAD_PHOTO_INTENT",
  CHITCHAT: "CHITCHAT",
  UNKNOWN: "UNKNOWN",
  ABUSIVE: "ABUSIVE",
} as const;
export type ChatIntent = (typeof ChatIntent)[keyof typeof ChatIntent];