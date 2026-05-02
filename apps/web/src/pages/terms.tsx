import Link from "next/link";
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/terms" />

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <strong>Placeholder content.</strong> The sections below are stubs to
          give the page structure. Replace with your final, legally-reviewed
          terms before public launch.
        </div>

        <LegalCard
          title="Terms of Service"
          intro="These terms govern your use of TradeMate. By creating an account or sending an enquiry through the service, you agree to these terms."
        >
          <Section
            title="The service"
            text="TradeMate is a platform that helps tradesmen capture, qualify, and manage customer enquiries. Tradesmen receive an enquiry link they can share with customers. Customers use that link to describe a job; TradeMate captures the details and delivers a structured lead to the tradesman's dashboard."
          />
          <Section
            title="Accounts"
            text="Tradesmen create an account using a business name, email address, and password. You are responsible for keeping your login credentials secure and for any activity that occurs under your account. Notify us if you believe your account has been compromised."
          />
          <Section
            title="Subscription and billing"
            text="Access to the tradesman dashboard requires an active subscription. Subscriptions are processed by Stripe and renew on the cadence shown at checkout. You can cancel at any time; access continues until the end of the current billing period."
          />
          <Section
            title="Acceptable use"
            text="Don't use the service to send unlawful, harmful, or abusive content; don't attempt to circumvent security controls, scrape data outside what your account is entitled to, or interfere with other users' access. We may suspend or close accounts that breach these rules."
          />
          <Section
            title="Customer enquiry data"
            text="When a customer submits an enquiry through your link, the captured details (name, contact info, project info) are made available to you in your dashboard. You're responsible for handling that information lawfully and in line with the privacy expectations communicated to your customers."
          />
          <Section
            title="Service availability"
            text="We aim to keep the service running reliably but don't guarantee uninterrupted availability. The service is provided on an as-is basis, and we may change features, pricing, or these terms with reasonable notice."
          />
          <Section
            title="Liability"
            text="To the maximum extent permitted by law, TradeMate is not liable for indirect or consequential losses arising from use of the service. Our total liability for any direct losses is limited to the amount you paid in subscription fees in the 12 months preceding the claim."
          />
          <Section
            title="Termination"
            text="You can close your account at any time from the dashboard or by contacting support. We may suspend or terminate accounts for breach of these terms; we'll typically give notice unless an immediate action is required to protect the service or other users."
          />
          <Section
            title="Governing law"
            text="These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales unless local consumer protection law requires otherwise."
          />
          <Section
            title="Contact"
            text="Before launch, replace this section with your real company name, registered address, and a contact email for terms-related queries."
          />
        </LegalCard>

        <LegalFooter exclude="terms" />
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
