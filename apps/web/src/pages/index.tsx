import Link from "next/link";
import AppHeader from "../components/AppHeader";
import { APP_BASE } from "../lib/config";

export default function HomePage() {
  const demoChatUrl = `${APP_BASE}/chat/leeds-kitchen-co`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader currentPath="/" />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-600 shadow-sm sm:text-sm">
            AI lead qualification for trades
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
            Turn customer enquiries into qualified leads automatically.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            TradeMate gives every tradesman a customer enquiry link. Your customers
            chat, the AI qualifies the job, and the lead lands in your inbox ready
            to approve, reject, or quote.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:h-11"
            >
              Create your tradesman link
            </Link>
            <Link
              href="/chat/leeds-kitchen-co"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:h-11"
            >
              Try the customer demo
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            <span>No customer signup required</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>Instant lead capture</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>Approve / Reject / Quote workflow</span>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-14">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900 sm:text-xl">
                      Customer enquiry experience
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                      A simple chat flow for customers that captures the information
                      you need without forcing them through a clunky form.
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                    Live
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        Leeds Kitchen Co
                      </div>
                      <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Public enquiry link
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 sm:text-sm break-all">
                    {demoChatUrl}
                  </div>

                  <div className="space-y-3">
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
                </div>
              </div>

              <div className="p-5 sm:p-6 lg:p-8">
                <div className="text-lg font-semibold text-slate-900 sm:text-xl">
                  What TradeMate gives you
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Every enquiry arrives structured and ready to work, so you can
                  spend less time qualifying and more time quoting the right jobs.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <StatCard
                    label="Status"
                    value="New"
                    description="Fresh enquiries appear instantly in your dashboard."
                  />
                  <StatCard
                    label="Trade"
                    value="Kitchen"
                    description="Lead details are captured in a structured format."
                  />
                  <StatCard
                    label="Timeline"
                    value="1–3 months"
                    description="See urgency and intent before you spend time replying."
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Designed for real trades workflows
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <li>Share your link in text messages, WhatsApp, email, or on your site.</li>
                    <li>Capture postcode, timeline, contact details, and budget signals.</li>
                    <li>Review leads quickly from a clean mobile-friendly dashboard.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-6 max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
            How it works
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            A simple flow from enquiry to qualified lead.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            TradeMate removes the back-and-forth at the top of the funnel so you
            can focus on the enquiries worth quoting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <FeatureCard
            step="01"
            title="Share your enquiry link"
            text="Every tradesman gets a customer-facing page they can send by text, email, WhatsApp, or add to their website."
          />
          <FeatureCard
            step="02"
            title="AI qualifies the job"
            text="TradeMate captures postcode, timeline, budget signals, contact details, and job specifics in a structured conversation."
          />
          <FeatureCard
            step="03"
            title="Work leads in one inbox"
            text="Review enquiries, approve good fits, reject poor fits, and send quotes from a clean tradesman dashboard."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-2 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
              Get started
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Start capturing better enquiries today.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Create your tradesman link, share it with customers, and let TradeMate
              qualify the job before it reaches your inbox.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:h-11"
            >
              Create your tradesman link
            </Link>
            <Link
              href="/chat/leeds-kitchen-co"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:h-11"
            >
              Try the customer demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 border-t border-slate-200 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>© TradeMate</div>
        <div className="flex flex-wrap gap-4 sm:gap-5">
          <Link href="/privacy" className="font-medium text-slate-600 hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="font-medium text-slate-600 hover:text-slate-900">
            Terms
          </Link>
          <Link href="/cookies" className="font-medium text-slate-600 hover:text-slate-900">
            Cookies
          </Link>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {step}
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
        {text}
      </p>
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
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isRight
            ? "border border-slate-900 bg-slate-900 text-white"
            : "border border-slate-200 bg-white text-slate-900",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}