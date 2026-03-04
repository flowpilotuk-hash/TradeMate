import { BudgetRisk, BudgetSignal } from "@shared/enums";
import type { BudgetState, LayoutChange, TimelineBucket } from "../state/state-types";

export function deriveBudgetRisk(args: {
  budget: BudgetState;
  layoutChange?: LayoutChange;
  timeline?: TimelineBucket;
}): BudgetRisk {
  const base =
    args.budget.signal === BudgetSignal.LOW
      ? BudgetRisk.HIGH
      : args.budget.signal === BudgetSignal.ALIGNED
        ? BudgetRisk.LOW
        : BudgetRisk.MEDIUM;

  if (args.layoutChange === "MAJOR" && base === BudgetRisk.MEDIUM) return BudgetRisk.HIGH;
  if (args.timeline === "ASAP" && args.layoutChange === "MAJOR" && base !== BudgetRisk.HIGH)
    return BudgetRisk.HIGH;

  return base;
}