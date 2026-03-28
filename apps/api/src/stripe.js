let stripeInstance = null;

function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || "";

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
  return (process.env.APP_BASE_URL || "https://flowpilotgroup.com").replace(/\/+$/, "");
}

async function createCheckoutSession(tradesman) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID is not configured");
  }

  if (!tradesman || !tradesman.tradesmanId || !tradesman.email) {
    throw new Error("Valid tradesman is required");
  }

  const appBaseUrl = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    customer_email: tradesman.email,
    success_url: `${appBaseUrl}/signup-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/billing/cancelled`,
    metadata: {
      tradesmanId: tradesman.tradesmanId,
    },
    subscription_data: {
      metadata: {
        tradesmanId: tradesman.tradesmanId,
      },
    },
  });

  return session;
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  getStripe,
  createCheckoutSession,
  constructWebhookEvent,
};