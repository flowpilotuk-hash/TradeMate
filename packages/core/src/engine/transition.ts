import { ConversationPhase, LeadCompletion } from "@shared/enums";
import type { ConversationStateV1 } from "../state/state-types";
import { deriveBudgetRisk } from "../risk/budget-risk";

export type EngineComputed = {
  missingProjectFields: string[];
  missingContactFields: string[];
  contactRequiredNow: boolean;
  isFull: boolean;
  nextPhase: ConversationStateV1["phase"];
};

export function computeProgress(state: ConversationStateV1): EngineComputed {
  const f = state.fields;

  const missingProjectFields: string[] = [];
  if (!f.jobType) missingProjectFields.push("jobType");
  if (!f.postcode) missingProjectFields.push("postcode");
  if (!f.kitchenSize) missingProjectFields.push("kitchenSize");
  if (!f.layoutChange) missingProjectFields.push("layoutChange");
  if (!f.unitsSupply) missingProjectFields.push("unitsSupply");
  if (!f.timeline) missingProjectFields.push("timeline");
  if (!f.budget) missingProjectFields.push("budget");

  const missingContactFields: string[] = [];
  if (!f.firstName) missingContactFields.push("firstName");
  if (!f.email) missingContactFields.push("email");

  const hasAtLeastFourProjectFields = 7 - missingProjectFields.length >= 4;

  const contactRequiredNow =
    !state.meta.contactRequested &&
    missingContactFields.length > 0 &&
    hasAtLeastFourProjectFields;

  const isFull = missingProjectFields.length === 0 && missingContactFields.length === 0;

  const nextPhase = isFull
    ? ConversationPhase.READY_FOR_HANDOFF
    : contactRequiredNow
      ? ConversationPhase.AWAITING_CONTACT
      : ConversationPhase.COLLECTING;

  return { missingProjectFields, missingContactFields, contactRequiredNow, isFull, nextPhase };
}

export function recomputeDerivedState(state: ConversationStateV1): ConversationStateV1 {
  const f = state.fields;

  const budgetRisk = deriveBudgetRisk({
    budget: state.budget,
    layoutChange: f.layoutChange?.value,
    timeline: f.timeline?.value,
  });

  const photoMissing = !f.photos || (f.photos.value.assetIds?.length ?? 0) === 0;

  const progress = computeProgress(state);
  const actionable = Boolean(f.firstName && f.email);
  const completion: LeadCompletion = progress.isFull ? LeadCompletion.FULL : LeadCompletion.PARTIAL;

  const flags: string[] = [];
  if (state.meta.timelineSpecific) flags.push("TIME_SENSITIVE");
  if (photoMissing) flags.push("PHOTO_MISSING");
  if (budgetRisk === "HIGH") flags.push("BUDGET_HIGH_RISK");
  if (budgetRisk === "MEDIUM") flags.push("BUDGET_MEDIUM_RISK");

  return {
    ...state,
    phase: progress.nextPhase,
    meta: {
      ...state.meta,
      photoMissing,
      handoffReady: progress.isFull,
      contactRequested: state.meta.contactRequested || progress.contactRequiredNow,
    },
    budget: { ...state.budget, risk: budgetRisk },
    classification: { completion, actionable, flags },
  };
}