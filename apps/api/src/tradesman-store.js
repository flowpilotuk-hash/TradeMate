const { prisma } = require("./db");

function generateTradesmanId() {
  return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function mapTradesmanRecord(record) {
  if (!record) {
    return null;
  }

  return {
    tradesmanId: record.tradesmanId,
    businessName: record.businessName,
    slug: record.slug,
    email: record.email,
    passwordHash: record.passwordHash,
    createdAt: record.createdAt.toISOString(),
    subscriptionStatus: record.subscriptionStatus || "INACTIVE",
    stripeCustomerId: record.stripeCustomerId || null,
    stripeSubscriptionId: record.stripeSubscriptionId || null,
    stripeCheckoutSessionId: record.stripeCheckoutSessionId || null,
    plan: record.plan || null,
  };
}

function sanitizeTradesman(tradesman) {
  if (!tradesman) {
    return null;
  }

  return {
    tradesmanId: tradesman.tradesmanId,
    businessName: tradesman.businessName,
    slug: tradesman.slug,
    email: tradesman.email,
    createdAt: tradesman.createdAt,
    subscriptionStatus: tradesman.subscriptionStatus || "INACTIVE",
    plan: tradesman.plan || null,
  };
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug || `tradesman-${Date.now()}`;
  let counter = 1;

  while (await prisma.tradesman.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function createTradesman(input) {
  const businessName = String(input.businessName || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const baseSlug = input.slug ? slugify(input.slug) : slugify(businessName);
  const slug = await ensureUniqueSlug(baseSlug);

  const created = await prisma.tradesman.create({
    data: {
      tradesmanId: generateTradesmanId(),
      businessName,
      slug,
      email,
      passwordHash: String(input.passwordHash || ""),
      subscriptionStatus: "INACTIVE",
      plan: "starter",
    },
  });

  return mapTradesmanRecord(created);
}

async function getTradesmanById(tradesmanId) {
  const record = await prisma.tradesman.findUnique({
    where: { tradesmanId },
  });

  return mapTradesmanRecord(record);
}

async function getTradesmanBySlug(slug) {
  const record = await prisma.tradesman.findUnique({
    where: { slug },
  });

  return mapTradesmanRecord(record);
}

async function getTradesmanByEmail(email) {
  const record = await prisma.tradesman.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
  });

  return mapTradesmanRecord(record);
}

async function getTradesmanByStripeCustomerId(stripeCustomerId) {
  if (!stripeCustomerId) {
    return null;
  }

  const record = await prisma.tradesman.findFirst({
    where: { stripeCustomerId: String(stripeCustomerId) },
  });

  return mapTradesmanRecord(record);
}

async function listTradesmen() {
  const records = await prisma.tradesman.findMany({
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapTradesmanRecord).map(sanitizeTradesman);
}

async function updateTradesman(tradesmanId, updates) {
  const existing = await prisma.tradesman.findUnique({
    where: { tradesmanId },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.tradesman.update({
    where: { tradesmanId },
    data: {
      businessName:
        updates.businessName !== undefined
          ? String(updates.businessName).trim()
          : existing.businessName,
      email:
        updates.email !== undefined
          ? String(updates.email).trim().toLowerCase()
          : existing.email,
      slug:
        updates.slug !== undefined ? slugify(updates.slug) : existing.slug,
      passwordHash:
        updates.passwordHash !== undefined
          ? String(updates.passwordHash)
          : existing.passwordHash,
      subscriptionStatus:
        updates.subscriptionStatus !== undefined
          ? String(updates.subscriptionStatus)
          : existing.subscriptionStatus,
      stripeCustomerId:
        updates.stripeCustomerId !== undefined
          ? updates.stripeCustomerId
          : existing.stripeCustomerId,
      stripeSubscriptionId:
        updates.stripeSubscriptionId !== undefined
          ? updates.stripeSubscriptionId
          : existing.stripeSubscriptionId,
      stripeCheckoutSessionId:
        updates.stripeCheckoutSessionId !== undefined
          ? updates.stripeCheckoutSessionId
          : existing.stripeCheckoutSessionId,
      plan:
        updates.plan !== undefined ? updates.plan : existing.plan,
    },
  });

  return mapTradesmanRecord(updated);
}

async function updateTradesmanByStripeCustomerId(stripeCustomerId, updates) {
  const existing = await prisma.tradesman.findFirst({
    where: { stripeCustomerId: String(stripeCustomerId) },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.tradesman.update({
    where: { tradesmanId: existing.tradesmanId },
    data: {
      businessName:
        updates.businessName !== undefined
          ? String(updates.businessName).trim()
          : existing.businessName,
      email:
        updates.email !== undefined
          ? String(updates.email).trim().toLowerCase()
          : existing.email,
      slug:
        updates.slug !== undefined ? slugify(updates.slug) : existing.slug,
      passwordHash:
        updates.passwordHash !== undefined
          ? String(updates.passwordHash)
          : existing.passwordHash,
      subscriptionStatus:
        updates.subscriptionStatus !== undefined
          ? String(updates.subscriptionStatus)
          : existing.subscriptionStatus,
      stripeCustomerId:
        updates.stripeCustomerId !== undefined
          ? updates.stripeCustomerId
          : existing.stripeCustomerId,
      stripeSubscriptionId:
        updates.stripeSubscriptionId !== undefined
          ? updates.stripeSubscriptionId
          : existing.stripeSubscriptionId,
      stripeCheckoutSessionId:
        updates.stripeCheckoutSessionId !== undefined
          ? updates.stripeCheckoutSessionId
          : existing.stripeCheckoutSessionId,
      plan:
        updates.plan !== undefined ? updates.plan : existing.plan,
    },
  });

  return mapTradesmanRecord(updated);
}

async function seedDefaultTradesman() {
  const existing = await getTradesmanByEmail("owner@leedskitchen.co.uk");
  if (existing) {
    return existing;
  }

  const created = await prisma.tradesman.create({
    data: {
      tradesmanId: generateTradesmanId(),
      businessName: "Leeds Kitchen Co",
      slug: "leeds-kitchen-co",
      email: "owner@leedskitchen.co.uk",
      passwordHash:
        "$2b$10$3euPcmQFCiblsZeEu5s7p.9vL7Wn0VQnM4f9uQf0Y0lYHfM4v0v9a",
      subscriptionStatus: "ACTIVE",
      plan: "starter",
    },
  });

  return mapTradesmanRecord(created);
}

module.exports = {
  createTradesman,
  getTradesmanById,
  getTradesmanBySlug,
  getTradesmanByEmail,
  getTradesmanByStripeCustomerId,
  listTradesmen,
  updateTradesman,
  updateTradesmanByStripeCustomerId,
  sanitizeTradesman,
  seedDefaultTradesman,
};