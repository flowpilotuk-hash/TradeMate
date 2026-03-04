"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIntent = exports.BudgetRisk = exports.BudgetSignal = exports.BudgetDisclosure = exports.LeadStatus = exports.LeadCompletion = exports.ConversationPhase = exports.TradeKind = void 0;
exports.TradeKind = {
    KITCHEN: "KITCHEN",
};
exports.ConversationPhase = {
    COLLECTING: "COLLECTING",
    AWAITING_CONTACT: "AWAITING_CONTACT",
    READY_FOR_HANDOFF: "READY_FOR_HANDOFF",
    HANDED_OFF: "HANDED_OFF",
    CLOSED: "CLOSED",
};
exports.LeadCompletion = {
    FULL: "FULL",
    PARTIAL: "PARTIAL",
};
exports.LeadStatus = {
    OPEN: "OPEN",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
};
exports.BudgetDisclosure = {
    EXPLICIT: "EXPLICIT",
    INDIRECT: "INDIRECT",
    NOT_DISCLOSED: "NOT_DISCLOSED",
};
exports.BudgetSignal = {
    ALIGNED: "ALIGNED",
    UNCLEAR: "UNCLEAR",
    LOW: "LOW",
};
exports.BudgetRisk = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
};
exports.ChatIntent = {
    PROVIDE_INFO: "PROVIDE_INFO",
    ASK_FAQ: "ASK_FAQ",
    ASK_PRICING: "ASK_PRICING",
    UPLOAD_PHOTO_INTENT: "UPLOAD_PHOTO_INTENT",
    CHITCHAT: "CHITCHAT",
    UNKNOWN: "UNKNOWN",
    ABUSIVE: "ABUSIVE",
};
//# sourceMappingURL=enums.js.map