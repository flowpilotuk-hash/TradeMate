let stripeInstance = null;

function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();

  if (!secretKey) {
    return null;
  }

  const Stripe = require("stripe");

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-04-10",
  });

  return stripeInstance;
}

function getAppBaseUrl() {
  return String(process.env.APP_BASE_URL || "https://flowpilotgroup.com")
    .trim()
    .replace(/\/+$/, "");
}

async function createCheckoutSession(tradesman) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const priceId = String(process.env.STRIPE_PRICE_ID || "").trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID is not configured");
  }

  if (!tradesman || !tradesman.tradesmanId || !tradesman.email) {
    throw new Error("Valid tradesman is required");
  }

  const appBaseUrl = getAppBaseUrl();

  const sessionPayload = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appBaseUrl}/signup-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/billing/cancelled`,
    metadata: {
      tradesmanId: tradesman.tradesmanId,
      tradesmanEmail: String(tradesman.email).trim().toLowerCase(),
    },
    subscription_data: {
      metadata: {
        tradesmanId: tradesman.tradesmanId,
        tradesmanEmail: String(tradesman.email).trim().toLowerCase(),
      },
    },
    client_reference_id: tradesman.tradesmanId,
    allow_promotion_codes: true,
  };

  const existingCustomerId = String(tradesman.stripeCustomerId || "").trim();

  if (existingCustomerId) {
    sessionPayload.customer = existingCustomerId;
  } else {
    sessionPayload.customer_email = String(tradesman.email).trim().toLowerCase();
  }

  const session = await stripe.checkout.sessions.create(sessionPayload);

  return session;
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

module.exports = {
  getStripe,
  createCheckoutSession,
  constructWebhookEvent,
};