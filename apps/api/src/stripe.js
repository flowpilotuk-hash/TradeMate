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

async function createCheckoutSession(tradesman) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

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
    success_url: `${process.env.APP_BASE_URL}/signup-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_BASE_URL}/signup`,
    metadata: {
      tradesmanId: tradesman.tradesmanId,
    },
  });

  return session;
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured");
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