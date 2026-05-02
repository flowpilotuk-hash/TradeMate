import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import { API_BASE, APP_BASE } from "../lib/config";

type AuthMeResponse = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
  subscriptionStatus?: string;
};

export default function SignupSuccessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("trademate_token")
          : null;

      if (!token) {
        setHasSession(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("trademate_token");
          setHasSession(false);
          setLoading(false);
          return;
        }

        const me = (await response.json()) as AuthMeResponse;

        setHasSession(true);
        setBusinessName(me.businessName || "");
        setSlug(me.slug || "");
        setLoading(false);
      } catch {
        localStorage.removeItem("trademate_token");
        setHasSession(false);
        setLoading(false);
      }
    }

    void loadSession();
  }, []);

  const publicLink = slug ? `${APP_BASE}/chat/${slug}` : "";
  const dashboardLink = slug ? `/dashboard/${encodeURIComponent(slug)}` : "/login";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-gradient-to-b from-blue-50 via-slate-50 to-white" />

        <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.295a1 1 0 0 1 .001 1.414l-7.5 7.5a1 1 0 0 1-1.414 0L3.295 9.71a1 1 0 1 1 1.414-1.414l3.789 3.789 6.793-6.79a1 1 0 0 1 1.413 0Z"
                  clipRule="evenodd"
                />
              </svg>
              Payment successful
            </span>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Your subscription is active
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Your TradeMate account has been created and your Stripe checkout has
              completed. You can now access your dashboard and start receiving leads.
            </p>

            {loading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Confirming your account…
              </div>
            ) : hasSession ? (
              <>
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Account
                  </div>
                  <div className="mt-1.5 text-lg font-semibold text-slate-900">
                    {businessName || "Your TradeMate account"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Dashboard access is now unlocked.
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Customer enquiry link
                  </div>
                  <div className="mt-1.5 break-all text-sm font-semibold text-slate-900">
                    {publicLink ||
                      "Your link will appear once your profile slug is available."}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={dashboardLink}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  >
                    Go to dashboard
                  </Link>
                  {slug ? (
                    <Link
                      href={`/chat/${slug}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Open your customer page
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Your payment completed, but you are not currently logged in on this
                  device. Please log in to access your dashboard.
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  >
                    Go to login
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Back to signup
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
