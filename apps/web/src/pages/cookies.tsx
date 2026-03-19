import Link from "next/link";
import AppHeader from "../components/AppHeader";

export default function CookiesPage() {
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
      <AppHeader currentPath="/cookies" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0 24px" }}>
        <LegalCard
          title="Cookie Policy"
          intro="This page explains how TradeMate may use cookies and similar technologies."
        >
          <Section
            title="Essential cookies"
            text="TradeMate may use essential cookies or browser storage to support login state, security checks, and core application functionality."
          />
          <Section
            title="Performance and analytics"
            text="TradeMate may in future use analytics tools to understand product usage, page performance, and conversion flow. Before launch, update this section to reflect the exact analytics tools in use."
          />
          <Section
            title="Managing cookies"
            text="Most browsers allow users to manage or disable cookies through browser settings. Disabling certain cookies may affect the performance or availability of parts of the service."
          />
          <Section
            title="Updates"
            text="This cookie policy may be updated as the product evolves. Replace this content with your final policy and any required consent language before public launch if you add analytics or advertising cookies."
          />
        </LegalCard>

        <LegalFooter />
      </div>
    </main>
  );
}

function LegalCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 28,
        boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: 34 }}>{title}</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 16 }}>{intro}</p>
      <div style={{ display: "grid", gap: 18 }}>{children}</div>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 style={{ marginBottom: 8, fontSize: 20 }}>{title}</h2>
      <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.7 }}>{text}</p>
    </section>
  );
}

function LegalFooter() {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginTop: 18,
        color: "#6b7280",
        fontSize: 14,
      }}
    >
      <Link href="/privacy" style={footerLinkStyle}>
        Privacy
      </Link>
      <Link href="/terms" style={footerLinkStyle}>
        Terms
      </Link>
      <Link href="/" style={footerLinkStyle}>
        Back home
      </Link>
    </div>
  );
}

const footerLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#4b5563",
  fontWeight: 600,
};