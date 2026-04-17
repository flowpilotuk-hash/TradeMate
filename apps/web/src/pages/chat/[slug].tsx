import Link from "next/link";
import { useRouter } from "next/router";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AppHeader from "../../components/AppHeader";
import { API_BASE } from "../../lib/config";

type ChatRole = "bot" | "user" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type Tradesman = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
};

type ConversationResponse = {
  conversationId?: string;
  state?: {
    phase?: string;
    meta?: {
      tradesmanId?: string | null;
      tradesmanSlug?: string | null;
      tradesmanBusinessName?: string | null;
      quickSelects?: string[];
    };
  };
  messages?: { role: ChatRole; text: string }[];
  reply?: string | null;
  question?: string | null;
  nextField?: string | null;
  quickSelects?: string[];
  error?: string;
};

type LeadResponse = {
  leadId?: string;
  error?: string;
};

export default function TradesmanChatPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [tradesman, setTradesman] = useState<Tradesman | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [starting, setStarting] = useState(true);
  const [sending, setSending] = useState(false);
  const [leadCreating, setLeadCreating] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | undefined>(undefined);
  const [quickSelects, setQuickSelects] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initRequestRef = useRef(0);
  const sendLockRef = useRef(false);
  const leadLockRef = useRef(false);
  const mountedRef = useRef(false);

  const safeSlug = useMemo(
    () => (typeof slug === "string" && slug.trim() ? slug.trim() : null),
    [slug]
  );

  const visibleQuickReplies = useMemo(() => {
    if (leadCreated || starting || sending || leadCreating) {
      return [];
    }

    if (!Array.isArray(quickSelects)) {
      return [];
    }

    return quickSelects
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 6);
  }, [leadCreated, starting, sending, leadCreating, quickSelects]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!router.isReady || !safeSlug) {
      return;
    }

    const requestId = ++initRequestRef.current;
    const currentSlug = safeSlug;
    const tradesmanAbortController = new AbortController();
    const conversationAbortController = new AbortController();

    async function initializeChat() {
      setStarting(true);
      setError(null);
      setLeadCreated(false);
      setCreatedLeadId(null);
      setMessages([]);
      setConversationId(null);
      setPhase(undefined);
      setQuickSelects([]);
      setInput("");
      setTradesman(null);

      try {
        const tradesmanResponse = await fetch(
          `${API_BASE}/tradesman/${encodeURIComponent(currentSlug)}`,
          {
            signal: tradesmanAbortController.signal,
            cache: "no-store",
          }
        );

        const tradesmanData = (await parseJson<Tradesman>(tradesmanResponse)) ?? null;

        if (!tradesmanResponse.ok || !tradesmanData) {
          throw new Error(
            tradesmanResponse.status === 404
              ? "This enquiry link is not valid."
              : `Failed to load tradesman: ${tradesmanResponse.status}`
          );
        }

        if (!isLatestInitRequest(requestId)) {
          return;
        }

        setTradesman(tradesmanData);

        const conversationResponse = await fetch(
          `${API_BASE}/conversation/start?tradesmanSlug=${encodeURIComponent(
            currentSlug
          )}`,
          {
            signal: conversationAbortController.signal,
            cache: "no-store",
          }
        );

        const conversationData =
          (await parseJson<ConversationResponse>(conversationResponse)) ?? null;

        if (!conversationResponse.ok || !conversationData) {
          throw new Error(
            conversationData?.error ||
              `Failed to start conversation: ${conversationResponse.status}`
          );
        }

        if (!isLatestInitRequest(requestId)) {
          return;
        }

        if (conversationData.conversationId) {
          setConversationId(conversationData.conversationId);
        }

        if (conversationData.state?.phase) {
          setPhase(conversationData.state.phase);
        }

        setQuickSelects(
          normalizeQuickSelects(
            conversationData.quickSelects,
            conversationData.state?.meta?.quickSelects
          )
        );

        const initialMessages = normalizeConversationMessages(
          conversationData.messages,
          conversationData.reply || conversationData.question,
          `Hi — tell ${tradesmanData.businessName} a bit about the job you need help with.`
        );

        setMessages(initialMessages);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        if (!isLatestInitRequest(requestId)) {
          return;
        }

        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isLatestInitRequest(requestId) && mountedRef.current) {
          setStarting(false);
        }
      }
    }

    void initializeChat();

    return () => {
      tradesmanAbortController.abort();
      conversationAbortController.abort();
    };
  }, [router.isReady, safeSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, leadCreating]);

  function isLatestInitRequest(requestId: number) {
    return mountedRef.current && initRequestRef.current === requestId;
  }

  async function submitMessage(rawMessage: string) {
    const trimmed = rawMessage.trim();

    if (
      !trimmed ||
      !conversationId ||
      sending ||
      leadCreated ||
      leadCreating ||
      sendLockRef.current
    ) {
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    setError(null);

    const userMessage = trimmed;
    setInput("");

    const optimisticUserMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text: userMessage,
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setQuickSelects([]);

    try {
      const response = await fetch(`${API_BASE}/conversation/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      });

      const data =
        (await parseJson<ConversationResponse>(response)) ?? null;

      if (!response.ok || !data) {
        throw new Error(
          data?.error || `Failed to send message: ${response.status}`
        );
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.state?.phase) {
        setPhase(data.state.phase);
      }

      setQuickSelects(
        normalizeQuickSelects(data.quickSelects, data.state?.meta?.quickSelects)
      );

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(normalizeConversationMessages(data.messages));
      } else {
        const botReply =
          data.reply || data.question || "Thanks — I've noted that.";

        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "bot",
            text: botReply,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setInput(userMessage);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "system",
          text: "Sorry — something went wrong sending that. Please review your message and try again.",
        },
      ]);
    } finally {
      sendLockRef.current = false;
      if (mountedRef.current) {
        setSending(false);
      }
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(input);
  }

  async function handleQuickReply(text: string) {
    await submitMessage(text);
  }

  async function handleCreateLead() {
    if (
      !conversationId ||
      leadCreating ||
      leadCreated ||
      sending ||
      leadLockRef.current
    ) {
      return;
    }

    leadLockRef.current = true;
    setLeadCreating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/leads/from-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          conversationId,
        }),
      });

      const data = (await parseJson<LeadResponse>(response)) ?? null;

      if (!response.ok || !data) {
        throw new Error(
          data?.error || `Failed to create lead: ${response.status}`
        );
      }

      if (!data.leadId) {
        throw new Error(
          "Lead creation did not return a lead reference. Enquiry has not been confirmed as submitted."
        );
      }

      setLeadCreated(true);
      setCreatedLeadId(data.leadId);
      setQuickSelects([]);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "system",
          text: `Thanks — your enquiry has been submitted. Reference: ${data.leadId}`,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "system",
          text: "We couldn't submit your enquiry yet. Please check your details and try again.",
        },
      ]);
    } finally {
      leadLockRef.current = false;
      if (mountedRef.current) {
        setLeadCreating(false);
      }
    }
  }

  const showCreateLeadButton =
    !leadCreated &&
    !!conversationId &&
    (phase === "READY_FOR_HANDOFF" || phase === "AWAITING_CONTACT");

  const progressLabel = getProgressLabel(phase);
  const helperCopy = getHelperCopy(phase);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader dashboardSlug={safeSlug ?? undefined} />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:pb-10">
        <div className="mb-4 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
          <div className="min-w-0">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
              {tradesman?.businessName || "TradeMate"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Request a Quote
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Tell us about your job and we&apos;ll qualify your enquiry for{" "}
              <strong>{tradesman?.businessName || "this business"}</strong>.
            </p>
          </div>

          {tradesman ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-[240px]">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Enquiry link
              </div>
              <div className="break-words font-semibold text-slate-900">
                {`/chat/${tradesman.slug}`}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                    {tradesman?.businessName || "Customer Chat"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {progressLabel}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <span
                    className={[
                      "inline-block h-2.5 w-2.5 rounded-full",
                      starting
                        ? "bg-slate-400"
                        : phase === "READY_FOR_HANDOFF"
                        ? "bg-emerald-500"
                        : "bg-blue-500",
                    ].join(" ")}
                  />
                  {starting ? "Starting conversation..." : progressLabel}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {helperCopy}
              </div>
            </div>

            <div className="flex flex-col lg:h-[calc(100vh-270px)]">
              <div className="min-h-[340px] flex-1 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5 sm:py-5">
                {starting ? (
                  <InfoBubble text="Starting conversation…" />
                ) : messages.length === 0 ? (
                  <InfoBubble text="No messages yet." />
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      const isSystem = message.role === "system";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={[
                              "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-6 shadow-sm sm:max-w-[78%]",
                              isUser
                                ? "border border-slate-900 bg-slate-900 text-white"
                                : isSystem
                                ? "border border-emerald-200 bg-emerald-50 text-slate-900"
                                : "border border-slate-200 bg-white text-slate-900",
                            ].join(" ")}
                          >
                            {message.text}
                          </div>
                        </div>
                      );
                    })}

                    {sending ? (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-6 text-slate-500 shadow-sm sm:max-w-[78%]">
                          Typing…
                        </div>
                      </div>
                    ) : null}

                    {leadCreating ? (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-6 text-slate-500 shadow-sm sm:max-w-[78%]">
                          Submitting your enquiry…
                        </div>
                      </div>
                    ) : null}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                {visibleQuickReplies.length > 0 && !showCreateLeadButton ? (
                  <div className="-mx-1 mb-3 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-2 px-1">
                      {visibleQuickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => void handleQuickReply(reply)}
                          disabled={starting || sending || leadCreated || leadCreating}
                          className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {showCreateLeadButton ? (
                  <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm leading-6 text-slate-700">
                        {phase === "READY_FOR_HANDOFF"
                          ? "Everything looks ready. Submit this enquiry to the tradesman."
                          : "You’re almost there. If the details look right, submit this enquiry now."}
                      </div>

                      {!leadCreated ? (
                        <button
                          type="button"
                          onClick={() => void handleCreateLead()}
                          disabled={leadCreating || sending}
                          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {leadCreating ? "Submitting..." : "Submit enquiry"}
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/${tradesman?.slug || safeSlug || ""}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {createdLeadId ? "Open dashboard" : "Back to dashboard"}
                        </Link>
                      )}
                    </div>
                  </div>
                ) : null}

                <form
                  onSubmit={handleSend}
                  className="flex items-end gap-2 sm:gap-3"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type your message…"
                    disabled={starting || sending || leadCreated || leadCreating}
                    className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={
                      starting ||
                      sending ||
                      !input.trim() ||
                      leadCreated ||
                      leadCreating
                    }
                    className="inline-flex h-12 min-w-[88px] items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <aside className="grid gap-4">
            <SideCard title="How it works">
              <div className="grid gap-3 text-sm text-slate-600">
                <Step text="Tell us about the job." />
                <Step text="We qualify the enquiry." />
                <Step text="Submit it to the tradesman." />
              </div>
            </SideCard>

            <SideCard title="Business">
              <div className="mb-2 font-semibold text-slate-900">
                {tradesman?.businessName || "Loading..."}
              </div>
              <div className="text-sm leading-6 text-slate-600">
                Your enquiry goes directly into this business&apos;s TradeMate
                dashboard.
              </div>
            </SideCard>

            <SideCard title="Progress">
              <div className="grid gap-3">
                <ProgressRow
                  label="Qualification stage"
                  value={progressLabel}
                />
                <ProgressRow
                  label="Enquiry status"
                  value={leadCreated ? "Submitted" : "In progress"}
                />
                <ProgressRow
                  label="Reference"
                  value={createdLeadId || "Not submitted yet"}
                  last
                />
              </div>
            </SideCard>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SideCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function Step({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-900" />
      <div>{text}</div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4",
        last ? "" : "border-b border-slate-200 pb-3",
      ].join(" ")}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[55%] text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function InfoBubble({ text }: { text: string }) {
  return (
    <div className="inline-block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function normalizeConversationMessages(
  messages?: { role: ChatRole; text: string }[],
  fallbackReply?: string | null,
  defaultReply?: string
): ChatMessage[] {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .filter(
        (message) =>
          message &&
          typeof message.text === "string" &&
          message.text.trim().length > 0
      )
      .map((message) => ({
        id: createMessageId(),
        role: message.role,
        text: message.text,
      }));
  }

  const text =
    fallbackReply?.trim() ||
    defaultReply?.trim() ||
    "Hi — tell us a bit about the job you need help with.";

  return [
    {
      id: createMessageId(),
      role: "bot",
      text,
    },
  ];
}

function normalizeQuickSelects(
  primary?: string[] | null,
  fallback?: string[] | null
) {
  const source = Array.isArray(primary)
    ? primary
    : Array.isArray(fallback)
      ? fallback
      : [];

  return source
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function getProgressLabel(phase?: string) {
  switch (phase) {
    case "COLLECTING":
      return "Gathering project details";
    case "AWAITING_CONTACT":
      return "Collecting contact details";
    case "READY_FOR_HANDOFF":
      return "Ready to submit";
    default:
      return "Starting";
  }
}

function getHelperCopy(phase?: string) {
  switch (phase) {
    case "COLLECTING":
      return "Share as much detail as you can about the job. The more specific you are, the better the quote request will be.";
    case "AWAITING_CONTACT":
      return "We’ve got the project basics. We just need your contact details so the tradesman can follow up properly.";
    case "READY_FOR_HANDOFF":
      return "The enquiry looks complete and can now be submitted to the tradesman.";
    default:
      return "Tell us about the work you need done and we’ll guide you through the key details.";
  }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}