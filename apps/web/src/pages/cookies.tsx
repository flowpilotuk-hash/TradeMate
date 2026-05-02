import Link from "next/link";
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/cookies" />

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
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

        <LegalFooter exclude="cookies" />
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
