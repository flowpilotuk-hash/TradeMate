import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import AppHeader from "../components/AppHeader";
import { APP_BASE } from "../lib/config";

export default function SignupSuccessPage() {
  const router = useRouter();

  const slug = useMemo(() => {
    return typeof router.query.slug === "string" ? router.query.slug : "";
  }, [router.query.slug]);

  const publicLink = slug ? `${APP_BASE}/chat/${slug}` : "";

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
            Profile created
          </div>

          <h1 style={{ marginTop: 0, fontSize: 34 }}>Your TradeMate link is ready</h1>

          <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 16 }}>
            Customers do not need an account. They simply use your link, answer the
            AI questions, and their enquiry lands in your dashboard.
          </p>

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
              {publicLink || "Your link will appear here once the slug is available."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/login" style={primaryButtonStyle}>
              Go to login
            </Link>
            {slug ? (
              <Link href={`/chat/${slug}`} style={secondaryButtonStyle}>
                Open your customer page
              </Link>
            ) : null}
          </div>
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