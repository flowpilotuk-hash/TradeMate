import Link from "next/link";
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/privacy" />

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
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

        <LegalFooter exclude="privacy" />
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
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-7 text-slate-600">{intro}</p>
      <div className="mt-8 grid gap-6">{children}</div>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </section>
  );
}

function LegalFooter({
  exclude,
}: {
  exclude?: "privacy" | "terms" | "cookies";
}) {
  const links = [
    { href: "/privacy", label: "Privacy", key: "privacy" as const },
    { href: "/terms", label: "Terms", key: "terms" as const },
    { href: "/cookies", label: "Cookies", key: "cookies" as const },
  ].filter((link) => link.key !== exclude);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className="font-semibold transition hover:text-blue-600"
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/"
        className="font-semibold transition hover:text-blue-600"
      >
        Back home
      </Link>
    </div>
  );
}
