import { useEffect } from "react";
import { useRouter } from "next/router";
import AppHeader from "../components/AppHeader";
import { API_BASE } from "../lib/config";

export default function LeadsLegacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("trademate_token");

    if (!token) {
      void router.replace("/login");
      return;
    }

    void fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem("trademate_token");
          await router.replace("/login");
          return;
        }

        const me = await response.json();
        if (me?.slug) {
          await router.replace(`/dashboard/${encodeURIComponent(me.slug)}`);
          return;
        }

        localStorage.removeItem("trademate_token");
        await router.replace("/login");
      })
      .catch(async () => {
        localStorage.removeItem("trademate_token");
        await router.replace("/login");
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-md px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v6h-6" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Redirecting…
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            TradeMate now uses your protected dashboard instead of the old leads
            page.
          </p>
        </div>
      </div>
    </main>
  );
}
