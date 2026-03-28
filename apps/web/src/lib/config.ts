const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const DEFAULT_API_BASE = "https://api.flowpilotgroup.com";
const DEFAULT_APP_BASE = "https://flowpilotgroup.com";

const apiBaseFromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const appBaseFromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

export const API_BASE = trimTrailingSlash(
  apiBaseFromEnv && /^https?:\/\//i.test(apiBaseFromEnv)
    ? apiBaseFromEnv
    : process.env.NODE_ENV === "production"
      ? DEFAULT_API_BASE
      : "http://localhost:4000"
);

export const APP_BASE = trimTrailingSlash(
  appBaseFromEnv && /^https?:\/\//i.test(appBaseFromEnv)
    ? appBaseFromEnv
    : process.env.NODE_ENV === "production"
      ? DEFAULT_APP_BASE
      : "http://localhost:3000"
);

if (process.env.NODE_ENV === "production") {
  if (!API_BASE.startsWith("https://")) {
    throw new Error(`Invalid production API_BASE: ${API_BASE}`);
  }

  if (!APP_BASE.startsWith("https://")) {
    throw new Error(`Invalid production APP_BASE: ${APP_BASE}`);
  }
}