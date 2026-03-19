import { FormEvent, useEffect, useState } from "react";
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
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 40,
        color: "#111827",
      }}
    >
      <AppHeader currentPath="/login" />

      <div
        style={{
          maxWidth: 520,
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
            Tradesman login
          </h1>
          <p style={{ marginTop: 10, color: "#6b7280", fontSize: 16 }}>
            Sign in to manage your leads and dashboard.
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    required
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
                  {loading ? "Signing in..." : "Sign in"}
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