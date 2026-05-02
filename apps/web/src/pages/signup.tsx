import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppHeader from "../components/AppHeader";
import { API_BASE } from "../lib/config";

type Tradesman = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
  subscriptionStatus?: string;
};

type SignupResponse = {
  token?: string;
  tradesman?: Tradesman;
  publicChatLink?: string;
  error?: string;
};

type AuthMeResponse = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
  subscriptionStatus?: string;
};

type CheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
};

const SESSION_CHECK_TIMEOUT_MS = 4000;

async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    const compactBody = rawText.replace(/\s+/g, " ").trim().slice(0, 220);

    throw new Error(
      `API returned non-JSON response (${response.status} ${response.statusText}). URL: ${response.url}. Body preview: ${compactBody || "[empty]"}`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(
      `API returned invalid JSON (${response.status} ${response.statusText}). URL: ${response.url}`
    );
  }
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export default function SignupPage() {
  const router = useRouter();
  const sessionCheckCompletedRef = useRef(false);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      const finish = () => {
        if (!active || sessionCheckCompletedRef.current) {
          return;
        }

        sessionCheckCompletedRef.current = true;
        setCheckingSession(false);
      };

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("trademate_token")
          : null;

      if (!token) {
        finish();
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: createTimeoutSignal(SESSION_CHECK_TIMEOUT_MS),
        });

        if (!response.ok) {
          localStorage.removeItem("trademate_token");
          finish();
          return;
        }

        const me = await readApiResponse<AuthMeResponse>(response);

        if (me?.slug) {
          sessionCheckCompletedRef.current = true;
          await router.replace(`/dashboard/${encodeURIComponent(me.slug)}`);
          return;
        }

        localStorage.removeItem("trademate_token");
        finish();
      } catch {
        localStorage.removeItem("trademate_token");
        finish();
      }
    }

    const hardStopTimer = window.setTimeout(() => {
      if (!sessionCheckCompletedRef.current && active) {
        sessionCheckCompletedRef.current = true;
        setCheckingSession(false);
      }
    }, SESSION_CHECK_TIMEOUT_MS + 1000);

    void checkExistingSession();

    return () => {
      active = false;
      window.clearTimeout(hardStopTimer);
    };
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const normalizedBusinessName = businessName.trim();
      const normalizedEmail = email.trim().toLowerCase();

      const signupResponse = await fetch(`${API_BASE}/tradesmen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: normalizedBusinessName,
          email: normalizedEmail,
          password,
        }),
      });

      let signupData: SignupResponse;

      try {
        signupData = await readApiResponse<SignupResponse>(signupResponse);
      } catch {
        throw new Error("Signup failed. Please try again.");
      }

      if (!signupResponse.ok) {
        throw new Error(signupData?.error || "Signup failed. Please try again.");
      }

      if (!signupData?.tradesman?.tradesmanId) {
        throw new Error("Tradesman account was created without a valid tradesman record.");
      }

      if (!signupData?.token) {
        throw new Error("Signup succeeded but token was not returned.");
      }

      localStorage.setItem("trademate_token", signupData.token);

      const checkoutResponse = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${signupData.token}`,
        },
      });

      let checkoutData: CheckoutResponse;

      try {
        checkoutData = await readApiResponse<CheckoutResponse>(checkoutResponse);
      } catch {
        throw new Error("Payment setup failed. Please try again.");
      }

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData?.error || "Failed to start secure checkout.");
      }

      if (!checkoutData?.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.assign(checkoutData.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/signup" />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-blue-50 via-slate-50 to-white" />

        <div className="mx-auto max-w-md px-6 py-12 sm:py-16">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              TradeMate
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Create your tradesman profile
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Set up your business, then continue to secure checkout to activate your account.
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
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 whitespace-pre-wrap break-words">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="signup-business-name"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Business name
                    </label>
                    <input
                      id="signup-business-name"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Leeds Kitchen Co"
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="owner@yourbusiness.co.uk"
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Continuing to checkout..." : "Create account and continue"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
