export declare const TradeKind: {
    readonly KITCHEN: "KITCHEN";
};
export type TradeKind = (typeof TradeKind)[keyof typeof TradeKind];
export declare const ConversationPhase: {
    readonly COLLECTING: "COLLECTING";
    readonly AWAITING_CONTACT: "AWAITING_CONTACT";
    readonly READY_FOR_HANDOFF: "READY_FOR_HANDOFF";
    readonly HANDED_OFF: "HANDED_OFF";
    readonly CLOSED: "CLOSED";
};
export type ConversationPhase = (typeof ConversationPhase)[keyof typeof ConversationPhase];
export declare const LeadCompletion: {
    readonly FULL: "FULL";
    readonly PARTIAL: "PARTIAL";
};
export type LeadCompletion = (typeof LeadCompletion)[keyof typeof LeadCompletion];
export declare const LeadStatus: {
    readonly OPEN: "OPEN";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
};
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];
export declare const BudgetDisclosure: {
    readonly EXPLICIT: "EXPLICIT";
    readonly INDIRECT: "INDIRECT";
    readonly NOT_DISCLOSED: "NOT_DISCLOSED";
};
export type BudgetDisclosure = (typeof BudgetDisclosure)[keyof typeof BudgetDisclosure];
export declare const BudgetSignal: {
    readonly ALIGNED: "ALIGNED";
    readonly UNCLEAR: "UNCLEAR";
    readonly LOW: "LOW";
};
export type BudgetSignal = (typeof BudgetSignal)[keyof typeof BudgetSignal];
export declare const BudgetRisk: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
};
export type BudgetRisk = (typeof BudgetRisk)[keyof typeof BudgetRisk];
export declare const ChatIntent: {
    readonly PROVIDE_INFO: "PROVIDE_INFO";
    readonly ASK_FAQ: "ASK_FAQ";
    readonly ASK_PRICING: "ASK_PRICING";
    readonly UPLOAD_PHOTO_INTENT: "UPLOAD_PHOTO_INTENT";
    readonly CHITCHAT: "CHITCHAT";
    readonly UNKNOWN: "UNKNOWN";
    readonly ABUSIVE: "ABUSIVE";
};
export type ChatIntent = (typeof ChatIntent)[keyof typeof ChatIntent];
//# sourceMappingURL=enums.d.ts.map