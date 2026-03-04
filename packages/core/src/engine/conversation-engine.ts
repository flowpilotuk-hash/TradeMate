import type { ConversationStateV1 } from "../state/state-types";
import { recomputeDerivedState } from "./transition";

export type ValidatedFieldUpdate =
  | { key: "postcode"; value: string; confidence: number; source: "user" | "ai" }
  | { key: "jobType"; value: "FULL_FIT" | "REFRESH" | "WORKTOPS" | "OTHER"; confidence: number; source: "user" | "ai" }
  | { key: "kitchenSize"; value: "SMALL" | "MEDIUM" | "LARGE" | "UNKNOWN"; confidence: number; source: "user" | "ai" }
  | { key: "layoutChange"; value: "NONE" | "MINOR" | "MAJOR" | "UNKNOWN"; confidence: number; source: "user" | "ai" }
  | { key: "unitsSupply"; value: "CUSTOMER_SUPPLIED" | "FITTER_SUPPLIED" | "UNSURE"; confidence: number; source: "user" | "ai" }
  | { key: "timeline"; value: "ASAP" | "1_3_MONTHS" | "3_6_MONTHS" | "6_PLUS" | "UNKNOWN"; confidence: number; source: "user" | "ai" }
  | { key: "budget"; value: ConversationStateV1["budget"]; confidence: number; source: "user" | "ai" }
  | { key: "photos"; value: { assetIds: string[] }; confidence: number; source: "user" | "ai" }
  | { key: "firstName"; value: string; confidence: number; source: "user" | "ai" }
  | { key: "email"; value: string; confidence: number; source: "user" | "ai" }
  | { key: "phone"; value: string; confidence: number; source: "user" | "ai" };

export type ApplyUpdatesArgs = {
  state: ConversationStateV1;
  nowIso: string;
  updates: ValidatedFieldUpdate[];
  timelineSpecific?: boolean;
};

export function applyValidatedUpdates(args: ApplyUpdatesArgs): ConversationStateV1 {
  let next: ConversationStateV1 = {
    ...args.state,
    audit: {
      ...args.state.audit,
      lastUserMessageAt: args.nowIso,
      turnCount: args.state.audit.turnCount + 1,
    },
  };

  if (args.timelineSpecific === true) {
    next = { ...next, meta: { ...next.meta, timelineSpecific: true } };
  }

  for (const u of args.updates) {
    (next.fields as any)[u.key] = {
      value: u.value,
      source: u.source,
      confidence: clamp01(u.confidence),
      updatedAt: args.nowIso,
    };
  }

  return recomputeDerivedState(next);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}