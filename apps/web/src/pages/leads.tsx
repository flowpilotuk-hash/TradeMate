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

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "28px 24px 0 24px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 30 }}>Redirecting…</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 16, lineHeight: 1.6 }}>
            TradeMate now uses your protected dashboard instead of the old leads page.
          </p>
        </div>
      </div>
    </main>
  );
}