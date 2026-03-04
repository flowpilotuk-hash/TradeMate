import {
  BudgetDisclosure,
  BudgetRisk,
  BudgetSignal,
  ConversationPhase,
  LeadCompletion,
  TradeKind,
} from "@shared/enums";
import type { ConversationStateV1 } from "./state-types";

export const INITIAL_BUDGET_STATE = {
  disclosure: BudgetDisclosure.NOT_DISCLOSED,
  signal: BudgetSignal.UNCLEAR,
  risk: BudgetRisk.MEDIUM,
  indicators: {},
} as const;

export function createInitialConversationStateV1(args: {
  tradeKind?: typeof TradeKind.KITCHEN;
  nowIso: string;
}): ConversationStateV1 {
  return {
    version: 1,
    tradeKind: args.tradeKind ?? TradeKind.KITCHEN,
    phase: ConversationPhase.COLLECTING,
    fields: {},
    meta: {
      askedCounts: {},
      timelineSpecific: false,
      photoMissing: true,
      contactRequested: false,
      handoffReady: false,
    },
    budget: { ...INITIAL_BUDGET_STATE },
    classification: {
      completion: LeadCompletion.PARTIAL,
      actionable: false,
      flags: [],
    },
    audit: {
      lastUserMessageAt: args.nowIso,
      turnCount: 0,
    },
  };
}