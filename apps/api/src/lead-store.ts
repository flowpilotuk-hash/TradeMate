const { prisma } = require("./db");
const { getTradesmanById } = require("./tradesman-store");

type JsonObject = Record<string, unknown>;

type TradesmanSummary = {
  id: number | string;
  tradesmanId?: string | null;
  slug?: string | null;
  businessName?: string | null;
};

type LeadRecord = {
  leadId: string;
  createdAt: Date;
  status: string;
  tradesmanId?: number | string | null;
  tradeKind: string;
  phase: string;
  classificationJson?: JsonObject | null;
  fieldsJson?: JsonObject | null;
  metaJson?: JsonObject | null;
  budgetJson?: JsonObject | null;
  auditJson?: JsonObject | null;
  conversationMessagesJson?: unknown;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  quotedAt?: Date | null;
  quote?: unknown;
  tradesman?: TradesmanSummary | null;
};

type LeadInput = {
  createdAt?: string | Date | null;
  status?: string;
  tradesmanId?: string | null;
  tradeKind?: string;
  phase?: string;
  classification?: JsonObject;
  fields?: JsonObject;
  meta?: JsonObject;
  budget?: JsonObject;
  audit?: JsonObject;
  conversationMessages?: unknown[];
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  quotedAt?: string | Date | null;
  quote?: unknown;
};

type LeadUpdateInput = {
  status?: string;
  tradesmanId?: string | null;
  tradeKind?: string;
  phase?: string;
  classification?: JsonObject;
  fields?: JsonObject;
  meta?: JsonObject;
  budget?: JsonObject;
  audit?: JsonObject;
  conversationMessages?: unknown[];
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  quotedAt?: string | Date | null;
  quote?: unknown;
};

type LeadResponse = {
  leadId: string;
  createdAt: string;
  status: string;
  tradesmanId: string | null;
  tradesmanSlug: string | null;
  tradesmanBusinessName: string | null;
  tradeKind: string;
  phase: string;
  classification: JsonObject | null | undefined;
  fields: JsonObject | null | undefined;
  meta: JsonObject | null | undefined;
  budget: JsonObject | null | undefined;
  audit: JsonObject | null | undefined;
  conversationMessages: unknown[];
  approvedAt: string | null;
  rejectedAt: string | null;
  quotedAt: string | null;
  quote: unknown;
};

function generateLeadId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapLeadRecord(
  record: LeadRecord | null | undefined
): LeadResponse | null {
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

async function resolveInternalTradesmanId(
  publicTradesmanId: string | null | undefined
): Promise<number | string | null> {
  if (!publicTradesmanId) {
    return null;
  }

  const tradesman = await getTradesmanById(publicTradesmanId);
  return tradesman?.id || null;
}

async function createLead(
  lead: LeadInput | null | undefined
): Promise<LeadResponse | null> {
  const internalTradesmanId = await resolveInternalTradesmanId(
    lead?.tradesmanId
  );

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

async function listLeads(): Promise<LeadResponse[]> {
  const leads = await prisma.lead.findMany({
    include: {
      tradesman: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedLeads: Array<LeadResponse | null> = leads.map(
    (record: LeadRecord) => mapLeadRecord(record)
  );

  return mappedLeads.filter(
    (mappedLead: LeadResponse | null): mappedLead is LeadResponse =>
      mappedLead !== null
  );
}

async function getLead(leadId: string): Promise<LeadResponse | null> {
  const lead = await prisma.lead.findUnique({
    where: { leadId },
    include: {
      tradesman: true,
    },
  });

  return mapLeadRecord(lead);
}

async function updateLead(
  leadId: string,
  updates: LeadUpdateInput | null | undefined
): Promise<LeadResponse | null> {
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
      quote: updates?.quote !== undefined ? updates.quote : existing.quote,
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

export {};