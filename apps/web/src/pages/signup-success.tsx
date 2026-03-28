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
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#111827",
        paddingBottom: 40,
      }}
    >
      <AppHeader />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0 24px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 800,
              background: "#ecfdf5",
              color: "#166534",
              border: "1px solid #86efac",
              marginBottom: 12,
            }}
          >
            Payment successful
          </div>

          <h1 style={{ marginTop: 0, fontSize: 34 }}>
            Your subscription is active
          </h1>

          <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 16 }}>
            Your TradeMate account has been created and your Stripe checkout has completed.
            You can now access your dashboard and start receiving leads.
          </p>

          {loading ? (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                color: "#6b7280",
              }}
            >
              Confirming your account…
            </div>
          ) : hasSession ? (
            <>
              <div
                style={{
                  marginTop: 20,
                  marginBottom: 20,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#6b7280",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Account
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {businessName || "Your TradeMate account"}
                </div>
                <div style={{ color: "#6b7280" }}>
                  Dashboard access is now unlocked.
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  marginBottom: 20,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#6b7280",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Customer enquiry link
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    wordBreak: "break-all",
                  }}
                >
                  {publicLink || "Your link will appear once your profile slug is available."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href={dashboardLink} style={primaryButtonStyle}>
                  Go to dashboard
                </Link>
                {slug ? (
                  <Link href={`/chat/${slug}`} style={secondaryButtonStyle}>
                    Open your customer page
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  marginTop: 20,
                  marginBottom: 20,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  borderRadius: 16,
                  padding: 16,
                  color: "#9a3412",
                }}
              >
                Your payment completed, but you are not currently logged in on this device.
                Please log in to access your dashboard.
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/login" style={primaryButtonStyle}>
                  Go to login
                </Link>
                <Link href="/signup" style={secondaryButtonStyle}>
                  Back to signup
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  color: "#ffffff",
  background: "#111827",
  fontWeight: 700,
  padding: "12px 16px",
  borderRadius: 12,
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  color: "#111827",
  background: "#ffffff",
  border: "1px solid #d1d5db",
  fontWeight: 700,
  padding: "12px 16px",
  borderRadius: 12,
};