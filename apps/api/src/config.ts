const APP_NAME = "TradeMate";
const COMPANY_NAME = "FlowPilot Group";
const TRADING_NAME = "FlowPilot Group";

/*
IMPORTANT:
Your home address MUST NOT appear anywhere in the product.
Only public contact details go here.
*/

const SUPPORT_EMAIL = "hello@flowpilotuk.com";
const PRIVACY_EMAIL = "hello@flowpilotuk.com";

const WEB_BASE_URL =
  process.env.APP_BASE_URL || "http://localhost:3000";

const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:4000";

const BRAND = {
  appName: APP_NAME,
  companyName: COMPANY_NAME,
  tradingName: TRADING_NAME,
  supportEmail: SUPPORT_EMAIL,
  privacyEmail: PRIVACY_EMAIL,
  website: "https://trademateuk.com",
};

const LINKS = {
  webBaseUrl: WEB_BASE_URL,
  apiBaseUrl: API_BASE_URL,
};

module.exports = {
  BRAND,
  LINKS,
};