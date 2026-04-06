const { prisma } = require("./db");
const { getTradesmanById } = require("./tradesman-store");

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapConversationRecord(record) {
  if (!record) {
    return null;
  }

  return {
    conversationId: record.conversationId,
    state: {
      version: record.version,
      tradeKind: record.tradeKind,
      phase: record.phase,
      fields: record.fieldsJson || {},
      meta: record.metaJson || {},
      budget: record.budgetJson || {},
      classification: record.classificationJson || {},
      audit: record.auditJson || {},
    },
    messages: Array.isArray(record.messagesJson) ? record.messagesJson : [],
    createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    tradesmanId: record.tradesman?.tradesmanId || null,
    tradesmanSlug: record.tradesman?.slug || null,
    tradesmanBusinessName: record.tradesman?.businessName || null,
  };
}

async function resolveInternalTradesmanIdFromState(state) {
  const publicTradesmanId =
    state?.meta?.tradesmanId ||
    null;

  if (!publicTradesmanId) {
    return null;
  }

  const tradesman = await getTradesmanById(publicTradesmanId);
  return tradesman?.id || null;
}

async function createConversation(initialState) {
  const conversationId = generateConversationId();
  const internalTradesmanId = await resolveInternalTradesmanIdFromState(initialState);

  const created = await prisma.conversation.create({
    data: {
      conversationId,
      version: Number(initialState?.version || 1),
      tradeKind: String(initialState?.tradeKind || "UNKNOWN"),
      phase: String(initialState?.phase || "COLLECTING"),
      fieldsJson: initialState?.fields || {},
      metaJson: initialState?.meta || {},
      budgetJson: initialState?.budget || {},
      classificationJson: initialState?.classification || {},
      auditJson: initialState?.audit || {},
      messagesJson: [],
      tradesmanId: internalTradesmanId,
    },
    include: {
      tradesman: true,
    },
  });

  return mapConversationRecord(created);
}

async function getConversation(conversationId) {
  const record = await prisma.conversation.findUnique({
    where: { conversationId },
    include: {
      tradesman: true,
    },
  });

  return mapConversationRecord(record);
}

async function updateConversation(conversationId, state, messages) {
  const existing = await prisma.conversation.findUnique({
    where: { conversationId },
    include: {
      tradesman: true,
    },
  });

  if (!existing) {
    return null;
  }

  const internalTradesmanId = await resolveInternalTradesmanIdFromState(state);

  const updated = await prisma.conversation.update({
    where: { conversationId },
    data: {
      version:
        state?.version !== undefined
          ? Number(state.version)
          : existing.version,
      tradeKind:
        state?.tradeKind !== undefined
          ? String(state.tradeKind)
          : existing.tradeKind,
      phase:
        state?.phase !== undefined
          ? String(state.phase)
          : existing.phase,
      fieldsJson:
        state?.fields !== undefined
          ? state.fields
          : existing.fieldsJson,
      metaJson:
        state?.meta !== undefined
          ? state.meta
          : existing.metaJson,
      budgetJson:
        state?.budget !== undefined
          ? state.budget
          : existing.budgetJson,
      classificationJson:
        state?.classification !== undefined
          ? state.classification
          : existing.classificationJson,
      auditJson:
        state?.audit !== undefined
          ? state.audit
          : existing.auditJson,
      messagesJson:
        messages !== undefined
          ? messages
          : existing.messagesJson,
      tradesmanId:
        internalTradesmanId !== undefined
          ? internalTradesmanId
          : existing.tradesmanId,
    },
    include: {
      tradesman: true,
    },
  });

  return mapConversationRecord(updated);
}

module.exports = {
  createConversation,
  getConversation,
  updateConversation,
};