const { prisma } = require("./db");
const { getTradesmanById } = require("./tradesman-store");

function generateLeadId() {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapLeadRecord(record) {
  if (!record) {
    return null;
  }

  return {
    leadId: record.leadId,
    createdAt: record.createdAt.toISOString(),
    status: record.status,
    tradesmanId: record.tradesman?.tradesmanId || null,
    tradesmanSlug: record.tradesman?.slug || null,
    tradesmanBusinessName: record.tradesman?.businessName || null,
    tradeKind: record.tradeKind,
    phase: record.phase,
    classification: record.classificationJson,
    fields: record.fieldsJson,
    meta: record.metaJson,
    budget: record.budgetJson,
    audit: record.auditJson,
    conversationMessages: Array.isArray(record.conversationMessagesJson)
      ? record.conversationMessagesJson
      : [],
    approvedAt: record.approvedAt ? record.approvedAt.toISOString() : null,
    rejectedAt: record.rejectedAt ? record.rejectedAt.toISOString() : null,
    quotedAt: record.quotedAt ? record.quotedAt.toISOString() : null,
    quote: record.quote || null,
  };
}

async function resolveInternalTradesmanId(publicTradesmanId) {
  if (!publicTradesmanId) {
    return null;
  }

  const tradesman = await getTradesmanById(publicTradesmanId);
  return tradesman?.id || null;
}

async function createLead(lead) {
  const internalTradesmanId = await resolveInternalTradesmanId(lead?.tradesmanId);

  const created = await prisma.lead.create({
    data: {
      leadId: generateLeadId(),
      createdAt: lead?.createdAt ? new Date(lead.createdAt) : new Date(),
      status: String(lead?.status || "NEW"),
      tradesmanId: internalTradesmanId,
      tradeKind: String(lead?.tradeKind || "UNKNOWN"),
      phase: String(lead?.phase || "COLLECTING"),
      classificationJson: lead?.classification || {},
      fieldsJson: lead?.fields || {},
      metaJson: lead?.meta || {},
      budgetJson: lead?.budget || {},
      auditJson: lead?.audit || {},
      conversationMessagesJson: Array.isArray(lead?.conversationMessages)
        ? lead.conversationMessages
        : [],
      approvedAt: lead?.approvedAt ? new Date(lead.approvedAt) : null,
      rejectedAt: lead?.rejectedAt ? new Date(lead.rejectedAt) : null,
      quotedAt: lead?.quotedAt ? new Date(lead.quotedAt) : null,
      quote: lead?.quote || null,
    },
    include: {
      tradesman: true,
    },
  });

  return mapLeadRecord(created);
}

async function listLeads() {
  const leads = await prisma.lead.findMany({
    include: {
      tradesman: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return leads.map(mapLeadRecord);
}

async function getLead(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { leadId },
    include: {
      tradesman: true,
    },
  });

  return mapLeadRecord(lead);
}

async function updateLead(leadId, updates) {
  const existing = await prisma.lead.findUnique({
    where: { leadId },
    include: {
      tradesman: true,
    },
  });

  if (!existing) {
    return null;
  }

  const internalTradesmanId =
    updates?.tradesmanId !== undefined
      ? await resolveInternalTradesmanId(updates.tradesmanId)
      : existing.tradesmanId;

  const updated = await prisma.lead.update({
    where: { leadId },
    data: {
      status: updates?.status ?? existing.status,
      tradesmanId: internalTradesmanId,
      tradeKind: updates?.tradeKind ?? existing.tradeKind,
      phase: updates?.phase ?? existing.phase,
      classificationJson:
        updates?.classification !== undefined
          ? updates.classification
          : existing.classificationJson,
      fieldsJson:
        updates?.fields !== undefined ? updates.fields : existing.fieldsJson,
      metaJson:
        updates?.meta !== undefined ? updates.meta : existing.metaJson,
      budgetJson:
        updates?.budget !== undefined ? updates.budget : existing.budgetJson,
      auditJson:
        updates?.audit !== undefined ? updates.audit : existing.auditJson,
      conversationMessagesJson:
        updates?.conversationMessages !== undefined
          ? updates.conversationMessages
          : existing.conversationMessagesJson,
      approvedAt:
        updates?.approvedAt !== undefined
          ? updates.approvedAt
            ? new Date(updates.approvedAt)
            : null
          : existing.approvedAt,
      rejectedAt:
        updates?.rejectedAt !== undefined
          ? updates.rejectedAt
            ? new Date(updates.rejectedAt)
            : null
          : existing.rejectedAt,
      quotedAt:
        updates?.quotedAt !== undefined
          ? updates.quotedAt
            ? new Date(updates.quotedAt)
            : null
          : existing.quotedAt,
      quote:
        updates?.quote !== undefined ? updates.quote : existing.quote,
    },
    include: {
      tradesman: true,
    },
  });

  return mapLeadRecord(updated);
}

module.exports = {
  createLead,
  listLeads,
  getLead,
  updateLead,
};