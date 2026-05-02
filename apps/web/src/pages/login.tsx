import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppHeader from "../components/AppHeader";
import { API_BASE } from "../lib/config";

type LoginResponse = {
  token: string;
  tradesman: {
    tradesmanId: string;
    businessName: string;
    slug: string;
    email: string;
    createdAt: string;
  };
};

type AuthMeResponse = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkExistingSession() {
      const token = localStorage.getItem("trademate_token");

      if (!token) {
        setCheckingSession(false);
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
          setCheckingSession(false);
          return;
        }

        const me = (await response.json()) as AuthMeResponse;

        if (me?.slug) {
          await router.replace(`/dashboard/${encodeURIComponent(me.slug)}`);
          return;
        }

        localStorage.removeItem("trademate_token");
        setCheckingSession(false);
      } catch {
        localStorage.removeItem("trademate_token");
        setCheckingSession(false);
      }
    }

    void checkExistingSession();
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as Partial<LoginResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data?.error || `Request failed: ${response.status}`);
      }

      if (!data.token || !data.tradesman?.slug) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("trademate_token", data.token);

      await router.push(`/dashboard/${encodeURIComponent(data.tradesman.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/login" />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-blue-50 via-slate-50 to-white" />

        <div className="mx-auto max-w-md px-6 py-12 sm:py-16">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              TradeMate
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Tradesman login
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in to manage your leads and dashboard.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {checkingSession ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Checking your session…
              </div>
            ) : (
              <>
                {error ? (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
