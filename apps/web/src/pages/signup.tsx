import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppHeader from "../components/AppHeader";
import { API_BASE } from "../lib/config";

type CreatedTradesman = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
  publicChatLink: string;
  subscriptionStatus?: string;
};

type AuthMeResponse = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
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
      const signupResponse = await fetch(`${API_BASE}/tradesmen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          email,
          password,
        }),
      });

      const signupData = (await signupResponse.json()) as Partial<CreatedTradesman> & {
        error?: string;
      };

      if (!signupResponse.ok) {
        throw new Error(signupData?.error || `Request failed: ${signupResponse.status}`);
      }

      if (!signupData.tradesmanId) {
        throw new Error("Tradesman account was created without an ID.");
      }

      const checkoutResponse = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradesmanId: signupData.tradesmanId,
        }),
      });

      const checkoutData = (await checkoutResponse.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData?.error || `Checkout failed: ${checkoutResponse.status}`);
      }

      if (!checkoutData.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = checkoutData.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 40,
        color: "#111827",
      }}
    >
      <AppHeader currentPath="/signup" />

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "28px 24px 0 24px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            TradeMate
          </div>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
            Create your tradesman profile
          </h1>
          <p style={{ marginTop: 10, color: "#6b7280", fontSize: 16 }}>
            Set up your business, then continue to secure checkout to activate your account.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          {checkingSession ? (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f9fafb",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
              }}
            >
              Checking your session…
            </div>
          ) : (
            <>
              {error ? (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 14,
                    borderRadius: 12,
                    background: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                  }}
                >
                  {error}
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "grid",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    Business name
                  </label>
                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Leeds Kitchen Co"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@yourbusiness.co.uk"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    required
                    minLength={8}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    border: "1px solid #111827",
                    background: "#111827",
                    color: "#ffffff",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  {loading ? "Continuing to checkout..." : "Create account and continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
};