import Link from "next/link";
import AppHeader from "../components/AppHeader";

export default function PrivacyPage() {
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
      <AppHeader currentPath="/privacy" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0 24px" }}>
        <LegalCard
          title="Privacy Policy"
          intro="This policy explains how TradeMate collects, uses, and stores personal information."
        >
          <Section
            title="What we collect"
            text="TradeMate may collect business account information from tradesmen, including business name, email address, and login credentials. TradeMate may also collect customer enquiry information, including name, email address, phone number, postcode, project details, and conversation content entered into the chat flow."
          />
          <Section
            title="How we use information"
            text="We use this information to operate the platform, route enquiries to the correct tradesman, show leads in the dashboard, send notifications, support quoting workflows, improve lead qualification, and maintain service security."
          />
          <Section
            title="Who receives enquiry data"
            text="Customer enquiry data is shared with the relevant tradesman connected to the enquiry link used by the customer. TradeMate acts as the platform facilitating that transfer."
          />
          <Section
            title="Retention"
            text="We retain account and enquiry data for as long as necessary to operate the service, comply with legal obligations, resolve disputes, and maintain business records."
          />
          <Section
            title="Security"
            text="We take reasonable technical and organisational measures to protect account and lead data, including authentication controls, database-backed storage, and request protections."
          />
          <Section
            title="Your rights"
            text="Depending on your location, you may have rights to request access, correction, deletion, or restriction of your personal data. Privacy-related requests can be directed to the contact address provided by the business using TradeMate, or to the TradeMate operator where applicable."
          />
          <Section
            title="Contact"
            text="Before launch, replace this section with your real company name, registered address, and privacy contact email."
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
      <Link href="/terms" style={footerLinkStyle}>
        Terms
      </Link>
      <Link href="/cookies" style={footerLinkStyle}>
        Cookies
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