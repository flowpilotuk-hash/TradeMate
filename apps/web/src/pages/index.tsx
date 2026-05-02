import Link from "next/link";
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <AppHeader currentPath="/" />
      <Hero />
      <TradesShowcase />
      <HowItWorks />
      <FeatureDeepDive />
      <TrustPillars />
      <PricingTeaser />
      <FAQ />
      <FinalCta />
      <Footer />
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * HERO
 * ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] bg-gradient-to-b from-blue-50 via-slate-50 to-white" />
      <div className="pointer-events-none absolute -left-32 top-32 -z-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-56 -z-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600" />
              </span>
              AI lead qualification for trades
            </span>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tighter text-slate-900 sm:text-6xl lg:text-[64px]">
              Stop chasing.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Start quoting.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              TradeMate qualifies every customer enquiry — capturing the job
              type, location, timeline and budget — and delivers structured
              leads to your dashboard, ready to quote.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Get started
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <TrustItem>5-minute setup</TrustItem>
              <TrustItem>Cancel anytime</TrustItem>
              <TrustItem>UK-built and supported</TrustItem>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-2xl" />
            <BrowserFrame url="trademate.co.uk/chat/leeds-kitchen-co">
              <ChatMock />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-emerald-600"
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

function BrowserFrame({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:px-4">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-2 flex flex-1 items-center justify-center">
          <div className="flex max-w-xs items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3 text-emerald-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{url}</span>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 p-3 sm:p-4">{children}</div>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white shadow-sm ring-2 ring-white">
          LK
        </div>
        <div className="min-w-0 flex-1">
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
        <Bubble side="left">Thanks — your enquiry is ready to submit.</Bubble>
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
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm ${
          isRight
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
            : "bg-white text-slate-900 ring-1 ring-slate-200"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * TRADES SHOWCASE
 * ────────────────────────────────────────────────────────────────────────── */

function TradesShowcase() {
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
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Built for trades
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            One platform. Every trade.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            TradeMate adapts to how each trade qualifies a job — asking the
            questions that actually matter for your work.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
    <div className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconText} transition-transform group-hover:scale-110`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-slate-900">{name}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      title: "Share your link",
      text: "Send your TradeMate link anywhere your customers already are — WhatsApp, text, email, or your own website.",
      icon: <ShareIcon />,
    },
    {
      title: "AI qualifies the job",
      text: "Customers answer a few questions in chat. TradeMate captures the details — trade, location, timeline, budget — automatically.",
      icon: <SparklesIcon />,
    },
    {
      title: "Quote and win",
      text: "Qualified leads land in your dashboard with the customer's full story. Approve, reject, or quote in seconds.",
      icon: <CheckIcon />,
    },
  ];

  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            From enquiry to quote, in three steps.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            One link, one conversation, one qualified lead. No app to install,
            no integrations to wire up.
          </p>
        </div>

        <div className="relative mt-16">
          <div
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[44px] hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            {steps.map((step, index) => (
              <StepCard
                key={step.title}
                number={index + 1}
                title={step.title}
                text={step.text}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  text,
  icon,
}: {
  number: number;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative inline-flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          {icon}
        </div>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-blue-700">
        STEP {String(number).padStart(2, "0")}
      </div>

      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * FEATURE DEEP-DIVE
 * ────────────────────────────────────────────────────────────────────────── */

function FeatureDeepDive() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20 sm:space-y-32 sm:py-28 lg:px-8">
        <FeatureRow
          eyebrow="Trade-aware"
          title="Knows what to ask, for any trade."
          text="TradeMate recognises whether you're a kitchen fitter, an electrician, a tiler, a bathroom fitter, or a joiner — and adapts its questions to capture what actually matters for your work."
          imageSide="right"
          visual={<TradeAwareVisual />}
        />

        <FeatureRow
          eyebrow="Fully qualified"
          title="Every detail captured. Before you quote."
          text="Postcode validation, timeline parsing, budget detection, contact info — TradeMate handles the awkward bits so the lead arrives clean. No more chasing customers to fill in the gaps."
          imageSide="left"
          visual={<DetailsCapturedVisual />}
        />

        <FeatureRow
          eyebrow="Action-ready"
          title="Lands in your dashboard, ready to action."
          text="Every lead comes with the customer's full story — what they want, where, when, and how much they're prepared to spend. Approve, reject, or quote in seconds."
          imageSide="right"
          visual={<DashboardActionsVisual />}
        />
      </div>
    </section>
  );
}

function FeatureRow({
  eyebrow,
  title,
  text,
  imageSide,
  visual,
}: {
  eyebrow: string;
  title: string;
  text: string;
  imageSide: "left" | "right";
  visual: ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div className={imageSide === "right" ? "lg:order-1" : "lg:order-2"}>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          {text}
        </p>
      </div>
      <div className={imageSide === "right" ? "lg:order-2" : "lg:order-1"}>
        {visual}
      </div>
    </div>
  );
}

function TradeAwareVisual() {
  const trades = [
    { name: "Kitchen", active: true, color: "emerald" },
    { name: "Electrical", active: false, color: "amber" },
    { name: "Tiling", active: false, color: "indigo" },
    { name: "Bathroom", active: false, color: "cyan" },
    { name: "Joinery", active: false, color: "orange" },
  ];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Customer message
      </div>
      <div className="mt-3 inline-flex max-w-full rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-sm leading-snug text-white shadow-sm">
        I want a new kitchen in LS15 next month.
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <span>Trade detected</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {trades.map((trade) => (
          <span
            key={trade.name}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              trade.active
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-500",
            ].join(" ")}
          >
            {trade.active ? (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.295a1 1 0 0 1 .001 1.414l-7.5 7.5a1 1 0 0 1-1.414 0L3.295 9.71a1 1 0 1 1 1.414-1.414l3.789 3.789 6.793-6.79a1 1 0 0 1 1.413 0Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
            {trade.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailsCapturedVisual() {
  const fields = [
    { label: "Trade", value: "Kitchen fit" },
    { label: "Postcode", value: "LS15 8ZZ" },
    { label: "Timeline", value: "Within 1–3 months" },
    { label: "Budget", value: "£10k–£15k" },
    { label: "Contact", value: "Sarah · sarah@email.com" },
  ];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Captured fields
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          5 of 5 complete
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.295a1 1 0 0 1 .001 1.414l-7.5 7.5a1 1 0 0 1-1.414 0L3.295 9.71a1 1 0 1 1 1.414-1.414l3.789 3.789 6.793-6.79a1 1 0 0 1 1.413 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {field.label}
              </span>
            </div>
            <span className="truncate text-sm font-semibold text-slate-900">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardActionsVisual() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
            New
          </span>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Kitchen fit · LS15
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Sarah · medium kitchen · within 1–3 months · £10k–£15k
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Approve
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reject
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
        >
          Quote
        </button>
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-700">Lead summary.</span>{" "}
        Sarah is enquiring about a kitchen fit in LS15 for a medium kitchen,
        with timeline within 1–3 months and budget £10k–£15k.
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * TRUST PILLARS
 * ────────────────────────────────────────────────────────────────────────── */

function TrustPillars() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Why TradeMate
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Built to be trusted with your business.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
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
            text="Monthly subscription. Cancel anytime. Pay only for the months you actually use."
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
    <div className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-slate-300 hover:shadow-md">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * PRICING TEASER
 * ────────────────────────────────────────────────────────────────────────── */

function PricingTeaser() {
  const features = [
    "Unlimited customer enquiries",
    "AI lead qualification across all supported trades",
    "Mobile-first dashboard",
    "Email lead notifications",
    "Conversational, human-feeling chat",
    "Cancel anytime",
  ];

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            One plan. All features. No hidden fees, no setup costs, no
            contracts.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Everything you need
              </span>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                The TradeMate plan
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                One subscription, every feature. Built for solo tradesmen and
                small teams who want to win more work without chasing.
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.295a1 1 0 0 1 .001 1.414l-7.5 7.5a1 1 0 0 1-1.414 0L3.295 9.71a1 1 0 1 1 1.414-1.414l3.789 3.789 6.793-6.79a1 1 0 0 1 1.413 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 sm:items-end sm:text-right">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Get started
              </Link>
              <p className="text-xs text-slate-500">
                Pricing shown at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * FAQ
 * ────────────────────────────────────────────────────────────────────────── */

function FAQ() {
  const faqs = [
    {
      q: "How long does setup take?",
      a: "About 5 minutes. Sign up, set your business name, complete checkout, and start sharing your enquiry link.",
    },
    {
      q: "Will it work for my trade?",
      a: "TradeMate currently supports kitchen fitters, electricians, tilers, bathroom fitters, and joiners — with smart fallbacks for anything else. New trades are added based on demand.",
    },
    {
      q: "What does the customer experience look like?",
      a: "Customers click your link and answer a handful of questions in a chat-style conversation. No app to download, works on any phone or computer, with quick-reply chips so they're rarely typing more than a few words.",
    },
    {
      q: "Where does my data live?",
      a: "Account and lead data is stored on managed databases. Payments are handled by Stripe. We don't sell customer data, and we don't share enquiries with anyone other than the tradesman receiving them.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Subscriptions are monthly. Cancellation takes effect at the end of your current billing period — no termination fees, no minimum commitment.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. TradeMate runs entirely in your browser. The dashboard is mobile-first, so you can review and quote leads from a job site without switching devices.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Frequently asked
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-6 transition hover:bg-slate-50">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <p className="mt-3 text-sm leading-7 text-slate-600">{a}</p>
    </details>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * FINAL CTA
 * ────────────────────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-14 text-center text-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Start capturing better enquiries.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
              Set up your link in minutes. Cancel anytime. No setup fees, no
              long contracts, no surprises.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Get started
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * FOOTER
 * ────────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="text-xl font-extrabold tracking-tight text-slate-900">
              TradeMate
            </div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
              AI lead qualification for trades. Turn customer enquiries into
              quote-ready leads — without chasing.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Made in the UK
            </div>
          </div>

          <FooterColumn title="Product">
            <FooterLink href="/signup">Get started</FooterLink>
            <FooterLink href="/login">Sign in</FooterLink>
            <FooterLink href="#how-it-works">How it works</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/cookies">Cookies</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} TradeMate. All rights reserved.</div>
          <div className="text-xs text-slate-400">
            Email{" "}
            <a
              href="mailto:hello@flowpilotuk.com"
              className="font-semibold text-slate-600 transition hover:text-blue-600"
            >
              hello@flowpilotuk.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </div>
      <div className="mt-4 grid gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-slate-600 transition hover:text-blue-600"
    >
      {children}
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * ICONS
 * ────────────────────────────────────────────────────────────────────────── */

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

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M5 12l4.5 4.5L20 6" />
    </svg>
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
