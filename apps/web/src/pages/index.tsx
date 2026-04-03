import Link from "next/link";
import AppHeader from "../components/AppHeader";
import { APP_BASE } from "../lib/config";

export default function HomePage() {
  const demoChatUrl = `${APP_BASE}/chat/leeds-kitchen-co`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#111827",
      }}
    >
      <AppHeader currentPath="/" />

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "72px 24px 40px 24px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #dbe3ef",
              background: "#ffffff",
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              marginBottom: 18,
            }}
          >
            AI lead qualification for trades
          </div>

          <h1
            style={{
              fontSize: 56,
              lineHeight: 1.02,
              margin: "0 0 18px 0",
              letterSpacing: "-0.03em",
              maxWidth: 700,
            }}
          >
            Turn customer enquiries into qualified leads automatically.
          </h1>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.6,
              color: "#4b5563",
              maxWidth: 700,
              margin: 0,
            }}
          >
            TradeMate gives every tradesman a customer enquiry link. Your customers
            chat, the AI qualifies the job, and the lead lands in your inbox ready
            to approve, reject, or quote.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <Link href="/signup" style={primaryButtonStyle}>
              Create your tradesman link
            </Link>
            <Link href="/chat/leeds-kitchen-co" style={secondaryButtonStyle}>
              Try the customer demo
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 28,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            <span>No customer signup required</span>
            <span>Instant lead capture</span>
            <span>Approve / Reject / Quote workflow</span>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Leeds Kitchen Co</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                Public enquiry link
              </div>
            </div>
            <div style={badgeStyle}>Live</div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 14,
              background: "#f8fafc",
              fontSize: 14,
              color: "#334155",
              marginBottom: 18,
              wordBreak: "break-all",
            }}
          >
            {demoChatUrl}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <DemoBubble
              align="left"
              text="Hi — tell us a bit about the job you need help with."
            />
            <DemoBubble
              align="right"
              text="I need a new kitchen in LS15 8ZZ next month."
            />
            <DemoBubble
              align="left"
              text="Roughly what size is the kitchen — small, medium, or large?"
            />
            <DemoBubble
              align="right"
              text="Medium. I will supply the units."
            />
            <DemoBubble
              align="left"
              text="Thanks — your enquiry is ready to submit."
            />
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <StatCard label="Status" value="NEW" />
            <StatCard label="Trade" value="KITCHEN" />
            <StatCard label="Timeline" value="1–3 months" />
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 24px 80px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
            marginBottom: 28,
          }}
        >
          <FeatureCard
            title="Share your enquiry link"
            text="Every tradesman gets a customer-facing page they can send by text, email, WhatsApp, or add to their website."
          />
          <FeatureCard
            title="AI qualifies the job"
            text="TradeMate captures postcode, timeline, budget signals, contact details, and job specifics in a structured conversation."
          />
          <FeatureCard
            title="Work leads in one inbox"
            text="Review enquiries, approve good fits, reject poor fits, and send quotes from a clean tradesman dashboard."
          />
        </div>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid #e5e7eb",
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          <div>© TradeMate</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/privacy" style={footerLinkStyle}>
              Privacy
            </Link>
            <Link href="/terms" style={footerLinkStyle}>
              Terms
            </Link>
            <Link href="/cookies" style={footerLinkStyle}>
              Cookies
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 22,
        boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: 20 }}>{title}</h3>
      <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function DemoBubble({
  align,
  text,
}: {
  align: "left" | "right";
  text: string;
}) {
  const isRight = align === "right";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isRight ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          borderRadius: 16,
          padding: "12px 14px",
          background: isRight ? "#111827" : "#ffffff",
          color: isRight ? "#ffffff" : "#111827",
          border: isRight ? "1px solid #111827" : "1px solid #e5e7eb",
          lineHeight: 1.45,
          fontSize: 14,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#6b7280",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{value}</div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  color: "#ffffff",
  background: "#111827",
  fontWeight: 700,
  padding: "14px 18px",
  borderRadius: 14,
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  color: "#111827",
  background: "#ffffff",
  border: "1px solid #d1d5db",
  fontWeight: 700,
  padding: "14px 18px",
  borderRadius: 14,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  background: "#ecfdf5",
  color: "#166534",
  border: "1px solid #86efac",
};

const footerLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#4b5563",
  fontWeight: 600,
};