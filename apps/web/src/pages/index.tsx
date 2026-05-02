import Link from "next/link";
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/" />
      <Hero />
      <TradesGrid />
      <ProductVisual />
      <HowItWorks />
      <TrustPillars />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-blue-50 via-slate-50 to-white" />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3.5 py-1 text-xs font-medium text-blue-700 shadow-sm">
          AI lead qualification for trades
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Turn customer enquiries
          <br className="hidden sm:block" /> into{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            qualified leads
          </span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          TradeMate captures the details, qualifies the job, and delivers
          structured leads to your inbox — so you spend less time chasing and
          more time quoting.
        </p>

        <div className="mt-9 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Get started
          </Link>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <TrustPill>5-minute setup</TrustPill>
          <TrustPill>Cancel anytime</TrustPill>
          <TrustPill>Made in the UK</TrustPill>
        </div>
      </div>
    </section>
  );
}

function TrustPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        className="h-4 w-4 text-emerald-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.295a1 1 0 0 1 .001 1.414l-7.5 7.5a1 1 0 0 1-1.414 0L3.295 9.71a1 1 0 1 1 1.414-1.414l3.789 3.789 6.793-6.79a1 1 0 0 1 1.413 0Z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </span>
  );
}

function TradesGrid() {
  const trades: {
    name: string;
    icon: ReactNode;
    iconBg: string;
    iconText: string;
  }[] = [
    {
      name: "Kitchen Fitters",
      icon: <KitchenIcon />,
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
    },
    {
      name: "Electricians",
      icon: <ElectricianIcon />,
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
    },
    {
      name: "Tilers",
      icon: <TilerIcon />,
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-600",
    },
    {
      name: "Bathroom Fitters",
      icon: <BathroomIcon />,
      iconBg: "bg-cyan-50",
      iconText: "text-cyan-600",
    },
    {
      name: "Joiners",
      icon: <JoinerIcon />,
      iconBg: "bg-orange-50",
      iconText: "text-orange-600",
    },
  ];

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Built for trades
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            One platform. Every trade.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            TradeMate captures the right details for the job — whether you fit
            kitchens, lay tiles, or rewire homes.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {trades.map((trade) => (
            <TradeTile
              key={trade.name}
              name={trade.name}
              icon={trade.icon}
              iconBg={trade.iconBg}
              iconText={trade.iconText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TradeTile({
  name,
  icon,
  iconBg,
  iconText,
}: {
  name: string;
  icon: ReactNode;
  iconBg: string;
  iconText: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconText}`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-slate-900">{name}</span>
    </div>
  );
}

function KitchenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M3 11h18" />
      <path d="M8 6.5v1M16 6.5v1M8 14.5v1M16 14.5v1" />
    </svg>
  );
}

function ElectricianIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M13 2L4 13h6l-2 9 10-13h-6l1-7z" />
    </svg>
  );
}

function TilerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="0.5" />
      <rect x="13" y="3" width="8" height="8" rx="0.5" />
      <rect x="3" y="13" width="8" height="8" rx="0.5" />
      <rect x="13" y="13" width="8" height="8" rx="0.5" />
    </svg>
  );
}

function BathroomIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M3 13h18" />
      <path d="M5 13v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
      <path d="M8 8a2 2 0 1 1 4 0v5" />
    </svg>
  );
}

function JoinerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M15 3l6 6-3 3-6-6z" />
      <path d="M12 6l-9 9v3h3l9-9" />
    </svg>
  );
}

function ProductVisual() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            How it feels
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            A chat your customers will actually finish.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            One link. A simple conversation. Every detail you need to quote —
            without the back-and-forth.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            <FeatureBullet>
              Captures postcode, timeline, and budget
            </FeatureBullet>
            <FeatureBullet>
              Works on WhatsApp, email, or your website
            </FeatureBullet>
            <FeatureBullet>
              Sends a clean lead straight to your dashboard
            </FeatureBullet>
          </ul>
        </div>

        <ChatMock />
      </div>
    </section>
  );
}

function FeatureBullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
      <span>{children}</span>
    </li>
  );
}

function ChatMock() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
      <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Leeds Kitchen Co
            </div>
            <div className="text-xs text-slate-500">Customer enquiry</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="space-y-2.5">
          <Bubble side="left">
            Hi — tell us a bit about the job you need help with.
          </Bubble>
          <Bubble side="right">New kitchen in LS15 next month.</Bubble>
          <Bubble side="left">
            Roughly what size — small, medium, or large?
          </Bubble>
          <Bubble side="right">Medium. I&apos;ll supply the units.</Bubble>
          <Bubble side="left">
            Thanks — your enquiry is ready to submit.
          </Bubble>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  side,
  children,
}: {
  side: "left" | "right";
  children: ReactNode;
}) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
          isRight
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            : "bg-white text-slate-900 ring-1 ring-slate-200"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Share your link",
      text: "Send it anywhere your customers already are — WhatsApp, text, or your website.",
      icon: (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M8.5 11.5a3 3 0 0 0 4.24 0l3-3a3 3 0 0 0-4.24-4.24l-1 1" />
          <path d="M11.5 8.5a3 3 0 0 0-4.24 0l-3 3a3 3 0 0 0 4.24 4.24l1-1" />
        </svg>
      ),
    },
    {
      title: "AI qualifies",
      text: "Captures the job type, location, timeline, and budget — automatically.",
      icon: (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
          <circle cx="10" cy="10" r="2.5" />
        </svg>
      ),
    },
    {
      title: "Work the lead",
      text: "Approve, reject, or quote in one place. Every enquiry comes ready to action.",
      icon: (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 10.5l3.5 3.5L16 5.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            From enquiry to quote — in three steps.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Step
              key={step.title}
              number={index + 1}
              icon={step.icon}
              title={step.title}
              text={step.text}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  icon,
  title,
  text,
}: {
  number: number;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
          {icon}
        </span>
        <span className="text-xs font-semibold tracking-[0.14em] text-blue-600">
          STEP {String(number).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function TrustPillars() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Why TradeMate
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Built to be trusted with your business.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <TrustCard
            icon={<LocationIcon />}
            title="UK-built and supported"
            text="Designed and supported in the UK. Email us at hello@flowpilotuk.com and a person reads it."
          />
          <TrustCard
            icon={<ShieldIcon />}
            title="Secured by Stripe"
            text="Subscriptions are handled by Stripe — the same payments infrastructure your bank uses."
          />
          <TrustCard
            icon={<RefreshIcon />}
            title="No lock-in"
            text="Monthly subscription, cancel anytime. Pay only for the months you actually use."
          />
        </div>
      </div>
    </section>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 2l8 3v7c0 5-3.5 9-8 10-4.5-1-8-5-8-10V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
      <div className="rounded-3xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Start capturing better enquiries.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
          Set up your link in minutes. Cancel anytime.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <div>© TradeMate</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="transition hover:text-blue-600">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-blue-600">
            Terms
          </Link>
          <Link href="/cookies" className="transition hover:text-blue-600">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
