const { BRAND, LINKS } = require("./config");

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || `${BRAND.appName} <onboarding@resend.dev>`;

async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    return { ok: false, skipped: true, reason: "missing recipient" };
  }

  if (!RESEND_API_KEY) {
    console.log("[email:skipped:no-api-key]", {
      to,
      subject,
      text,
    });

    return { ok: true, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed: ${response.status} ${body}`);
  }

  return { ok: true };
}

function getFieldValue(lead, key) {
  return lead?.fields?.[key]?.value ?? "—";
}

async function sendNewLeadNotification({ lead, tradesman }) {
  if (!lead || !tradesman?.email) {
    return { ok: false, skipped: true, reason: "missing lead or tradesman email" };
  }

  const dashboardUrl = `${LINKS.webBaseUrl}/dashboard/${encodeURIComponent(
    tradesman.slug
  )}`;

  const subject = `New Lead – ${tradesman.businessName}`;
  const text = [
    `A new lead has arrived for ${tradesman.businessName}.`,
    "",
    `Trade: ${lead.tradeKind || "—"}`,
    `Postcode: ${getFieldValue(lead, "postcode")}`,
    `Timeline: ${getFieldValue(lead, "timeline")}`,
    `Email: ${getFieldValue(lead, "email")}`,
    `Phone: ${getFieldValue(lead, "phone")}`,
    "",
    `Open dashboard: ${dashboardUrl}`,
    "",
    `${BRAND.tradingName} · ${BRAND.supportEmail}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">New lead for ${escapeHtml(tradesman.businessName)}</h2>
      <p>A new customer enquiry has been submitted through ${escapeHtml(BRAND.appName)}.</p>
      <ul>
        <li><strong>Trade:</strong> ${escapeHtml(String(lead.tradeKind || "—"))}</li>
        <li><strong>Postcode:</strong> ${escapeHtml(String(getFieldValue(lead, "postcode")))}</li>
        <li><strong>Timeline:</strong> ${escapeHtml(String(getFieldValue(lead, "timeline")))}</li>
        <li><strong>Email:</strong> ${escapeHtml(String(getFieldValue(lead, "email")))}</li>
        <li><strong>Phone:</strong> ${escapeHtml(String(getFieldValue(lead, "phone")))}</li>
      </ul>
      <p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111827;color:#ffffff;text-decoration:none;font-weight:bold;">
          Open dashboard
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">
        ${escapeHtml(BRAND.tradingName)} · ${escapeHtml(BRAND.supportEmail)}
      </p>
    </div>
  `;

  return sendEmail({
    to: tradesman.email,
    subject,
    html,
    text,
  });
}

async function sendQuoteNotification({ lead, tradesman }) {
  const customerEmail = getFieldValue(lead, "email");

  if (!lead || !tradesman || !customerEmail || customerEmail === "—") {
    return { ok: false, skipped: true, reason: "missing lead, tradesman, or customer email" };
  }

  const subject = `Your quote from ${tradesman.businessName}`;
  const text = [
    `Your quote from ${tradesman.businessName}`,
    "",
    `Quote: ${lead.quote || "—"}`,
    "",
    `Business: ${tradesman.businessName}`,
    `Email: ${tradesman.email}`,
    "",
    `Reply directly to the business for the next steps.`,
    "",
    `${BRAND.tradingName} · ${BRAND.supportEmail}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Your quote from ${escapeHtml(tradesman.businessName)}</h2>
      <p>Thanks for your enquiry. Your quote is below.</p>
      <p style="font-size: 18px; font-weight: bold;">${escapeHtml(String(lead.quote || "—"))}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p><strong>Business:</strong> ${escapeHtml(tradesman.businessName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(tradesman.email)}</p>
      <p>Reply directly to the business to continue.</p>
      <p style="color:#6b7280;font-size:14px;">
        ${escapeHtml(BRAND.tradingName)} · ${escapeHtml(BRAND.supportEmail)}
      </p>
    </div>
  `;

  return sendEmail({
    to: String(customerEmail),
    subject,
    html,
    text,
  });
}

async function sendCustomerEnquiryConfirmation({ lead, tradesman }) {
  const customerEmail = getFieldValue(lead, "email");

  if (!lead || !tradesman || !customerEmail || customerEmail === "—") {
    return { ok: false, skipped: true, reason: "missing lead, tradesman, or customer email" };
  }

  const subject = `Your enquiry was sent to ${tradesman.businessName}`;
  const text = [
    `Thanks — your enquiry has been sent to ${tradesman.businessName}.`,
    "",
    `Trade: ${lead.tradeKind || "—"}`,
    `Postcode: ${getFieldValue(lead, "postcode")}`,
    `Timeline: ${getFieldValue(lead, "timeline")}`,
    "",
    `The business will review your enquiry and respond if suitable.`,
    "",
    `${BRAND.tradingName} · ${BRAND.supportEmail}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Your enquiry was sent</h2>
      <p>Thanks — your enquiry has been sent to <strong>${escapeHtml(tradesman.businessName)}</strong>.</p>
      <ul>
        <li><strong>Trade:</strong> ${escapeHtml(String(lead.tradeKind || "—"))}</li>
        <li><strong>Postcode:</strong> ${escapeHtml(String(getFieldValue(lead, "postcode")))}</li>
        <li><strong>Timeline:</strong> ${escapeHtml(String(getFieldValue(lead, "timeline")))}</li>
      </ul>
      <p>The business will review your enquiry and respond if suitable.</p>
      <p style="color:#6b7280;font-size:14px;">
        ${escapeHtml(BRAND.tradingName)} · ${escapeHtml(BRAND.supportEmail)}
      </p>
    </div>
  `;

  return sendEmail({
    to: String(customerEmail),
    subject,
    html,
    text,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = {
  sendNewLeadNotification,
  sendQuoteNotification,
  sendCustomerEnquiryConfirmation,
};