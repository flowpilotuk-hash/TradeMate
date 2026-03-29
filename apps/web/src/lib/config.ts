const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const DEFAULT_PUBLIC_API_BASE = "/api";
const DEFAULT_APP_BASE =
  process.env.NODE_ENV === "production"
    ? "https://flowpilotgroup.com"
    : "http://localhost:3000";

const appBaseFromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

export const API_BASE = trimTrailingSlash(DEFAULT_PUBLIC_API_BASE);

export const APP_BASE = trimTrailingSlash(
  appBaseFromEnv && /^https?:\/\//i.test(appBaseFromEnv)
    ? appBaseFromEnv
    : DEFAULT_APP_BASE
);