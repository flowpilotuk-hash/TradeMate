import Link from "next/link";
import AppHeader from "../components/AppHeader";
import { APP_BASE } from "../lib/config";

export default function HomePage() {
  const demoChatUrl = `${APP_BASE}/chat/leeds-kitchen-co`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader currentPath="/" />

      <section className="mx-auto w-full max-w-[1100px] px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600">
            AI lead qualification for trades
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Turn customer enquiries into qualified leads.
          </h1>

          <p className="mt-5 text-base text-slate-600 sm:text-lg">
            Give every customer a simple chat experience. TradeMate captures the
            details, qualifies the job, and delivers structured leads to your inbox.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="h-12 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white flex items-center justify-center hover:bg-slate-800 transition"
            >
              Get started
            </Link>

            <Link
              href="/chat/leeds-kitchen-co"
              className="h-12 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 flex items-center justify-center hover:bg-slate-50 transition"
            >
              View demo
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>No signup required</span>
            <span>•</span>
            <span>Instant lead capture</span>
            <span>•</span>
            <span>Approve / Reject / Quote</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* CHAT SIDE */}
            <div className="bg-slate-50 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Leeds Kitchen Co
                    </div>
                    <div className="text-xs text-slate-500">
                      Customer chat
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    Live
                  </span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 h-[420px] flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
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
                      text="Roughly what size is the kitchen?"
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

                  <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
                        Type your message...
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm">
                        →
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500 break-all">
                  {demoChatUrl}
                </div>
              </div>
            </div>

            {/* INFO SIDE */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-slate-900">
                Built for trades
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Every enquiry is structured and ready to work, so you spend less
                time qualifying and more time quoting.
              </p>

              <div className="mt-6 space-y-3">
                <StatCard
                  label="Status"
                  value="New"
                  description="New enquiries appear instantly."
                />
                <StatCard
                  label="Trade"
                  value="Kitchen"
                  description="Structured job data captured."
                />
                <StatCard
                  label="Timeline"
                  value="1–3 months"
                  description="See urgency immediately."
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
                <p>• Share via WhatsApp, text, or email</p>
                <p>• Capture postcode, timeline & budget</p>
                <p>• Clean mobile-first dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            A simple flow from enquiry to lead
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Remove the back-and-forth and focus on the right jobs.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            step="01"
            title="Share your link"
            text="Send it anywhere your customers already are."
          />
          <FeatureCard
            step="02"
            title="AI qualifies"
            text="Captures all key job details automatically."
          />
          <FeatureCard
            step="03"
            title="Work leads"
            text="Approve, reject, and quote in one place."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Start capturing better enquiries
          </h2>

          <p className="mt-3 text-sm text-slate-300">
            Create your link and start qualifying leads instantly.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="h-12 rounded-xl bg-white text-slate-900 px-6 text-sm font-semibold flex items-center justify-center"
            >
              Get started
            </Link>

            <Link
              href="/chat/leeds-kitchen-co"
              className="h-12 rounded-xl border border-white/30 px-6 text-sm font-semibold flex items-center justify-center"
            >
              View demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 text-sm text-slate-500 py-6">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div>© TradeMate</div>

          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="text-xs font-semibold text-slate-400">{step}</div>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
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
        className={`max-w-[80%] px-4 py-2 text-sm rounded-2xl ${
          isRight
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-900"
        }`}
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
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  );
}