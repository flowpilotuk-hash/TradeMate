import type {
  BudgetDisclosure,
  BudgetRisk,
  BudgetSignal,
  ConversationPhase,
  LeadCompletion,
  TradeKind,
} from "@shared/enums";

export type FieldRecord<T> = {
  value: T;
  source: "user" | "ai" | "admin";
  confidence: number; // 0..1
  updatedAt: string; // ISO date-time
};

export type KitchenJobType = "FULL_FIT" | "REFRESH" | "WORKTOPS" | "OTHER";
export type KitchenSize = "SMALL" | "MEDIUM" | "LARGE" | "UNKNOWN";
export type LayoutChange = "NONE" | "MINOR" | "MAJOR" | "UNKNOWN";
export type UnitsSupply = "CUSTOMER_SUPPLIED" | "FITTER_SUPPLIED" | "UNSURE";
export type TimelineBucket =
  | "ASAP"
  | "1_3_MONTHS"
  | "3_6_MONTHS"
  | "6_PLUS"
  | "UNKNOWN";

export type BudgetState = {
  disclosure: BudgetDisclosure;
  signal: BudgetSignal;
  risk: BudgetRisk;
  indicators: {
    supplier?: string;
    worktopHint?: string;
    appliancesIncluded?: boolean;
    notes?: string;
  };
};

export type KitchenFields = {
  postcode?: FieldRecord<string>;
  jobType?: FieldRecord<KitchenJobType>;
  kitchenSize?: FieldRecord<KitchenSize>;
  layoutChange?: FieldRecord<LayoutChange>;
  unitsSupply?: FieldRecord<UnitsSupply>;
  timeline?: FieldRecord<TimelineBucket>;
  budget?: FieldRecord<BudgetState>;
  photos?: FieldRecord<{ assetIds: string[] }>;

  firstName?: FieldRecord<string>;
  email?: FieldRecord<string>;
  phone?: FieldRecord<string>;
};

export type ConversationMeta = {
  lastQuestionKey?: string;
  askedCounts: Record<string, number>;
  timelineSpecific: boolean;
  photoMissing: boolean;
  contactRequested: boolean;
  handoffReady: boolean;
};

export type LeadClassification = {
  completion: LeadCompletion;
  actionable: boolean;
  flags: string[];
};

export type ConversationStateV1 = {
  version: 1;
  tradeKind: TradeKind;
  phase: ConversationPhase;

  fields: KitchenFields;

  meta: ConversationMeta;
  budget: BudgetState;
  classification: LeadClassification;

  audit: {
    lastUserMessageAt?: string;
    turnCount: number;
  };
};