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
    };
  };
  messages?: { role: ChatRole; text: string }[];
  reply?: string | null;
  question?: string | null;
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initRequestRef = useRef(0);
  const sendLockRef = useRef(false);
  const leadLockRef = useRef(false);
  const mountedRef = useRef(false);

  const safeSlug = useMemo(
    () => (typeof slug === "string" && slug.trim() ? slug.trim() : null),
    [slug]
  );

  const quickReplies = useMemo(() => {
    if (leadCreated || starting || sending || leadCreating) {
      return [];
    }

    switch (phase) {
      case "COLLECTING":
        return [
          "Small",
          "Medium",
          "Large",
          "Current layout",
          "Minor changes",
          "Supply and fit",
        ];
      case "AWAITING_CONTACT":
        return [
          "My name is John",
          "john@example.com",
          "ASAP",
          "Next month",
        ];
      case "READY_FOR_HANDOFF":
        return [];
      default:
        return ["Medium", "Current layout", "Supply and fit"];
    }
  }, [leadCreated, starting, sending, leadCreating, phase]);

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
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#111827",
        paddingBottom: 40,
      }}
    >
      <AppHeader dashboardSlug={safeSlug ?? undefined} />

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "28px 24px 0 24px",
        }}
      >
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 8,
              }}
            >
              {tradesman?.businessName || "TradeMate"}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.08,
              }}
            >
              Request a Quote
            </h1>
            <p
              style={{
                margin: "10px 0 0 0",
                color: "#6b7280",
                fontSize: 16,
                lineHeight: 1.6,
                maxWidth: 700,
              }}
            >
              Tell us about your job and we&apos;ll qualify your enquiry for{" "}
              <strong>{tradesman?.businessName || "this business"}</strong>.
            </p>
          </div>

          {tradesman ? (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 14,
                minWidth: 240,
                boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Enquiry link
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  wordBreak: "break-word",
                }}
              >
                {`/chat/${tradesman.slug}`}
              </div>
            </div>
          ) : null}
        </header>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 12,
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 280px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 22,
              boxShadow: "0 16px 40px rgba(15,23,42,0.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {tradesman?.businessName || "Customer Chat"}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: starting
                      ? "#9ca3af"
                      : phase === "READY_FOR_HANDOFF"
                      ? "#16a34a"
                      : "#2563eb",
                    display: "inline-block",
                  }}
                />
                {starting ? "Starting conversation..." : progressLabel}
              </div>
            </div>

            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #f3f4f6",
                background: "#fcfcfd",
                color: "#6b7280",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {helperCopy}
            </div>

            <div
              style={{
                height: 520,
                overflowY: "auto",
                padding: 18,
                background: "#fafafa",
              }}
            >
              {starting ? (
                <InfoBubble text="Starting conversation…" />
              ) : messages.length === 0 ? (
                <InfoBubble text="No messages yet." />
              ) : (
                <>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    const isSystem = message.role === "system";

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          justifyContent: isUser ? "flex-end" : "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "78%",
                            padding: "12px 14px",
                            borderRadius: 18,
                            lineHeight: 1.5,
                            fontSize: 15,
                            whiteSpace: "pre-wrap",
                            background: isUser
                              ? "#111827"
                              : isSystem
                              ? "#ecfdf5"
                              : "#ffffff",
                            color: isUser ? "#ffffff" : "#111827",
                            border: isUser
                              ? "1px solid #111827"
                              : isSystem
                              ? "1px solid #a7f3d0"
                              : "1px solid #e5e7eb",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                          }}
                        >
                          {message.text}
                        </div>
                      </div>
                    );
                  })}

                  {sending ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "12px 14px",
                          borderRadius: 18,
                          lineHeight: 1.5,
                          fontSize: 15,
                          background: "#ffffff",
                          color: "#6b7280",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        Typing…
                      </div>
                    </div>
                  ) : null}

                  {leadCreating ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "12px 14px",
                          borderRadius: 18,
                          lineHeight: 1.5,
                          fontSize: 15,
                          background: "#ffffff",
                          color: "#6b7280",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        Submitting your enquiry…
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #f3f4f6",
                padding: 16,
                background: "#ffffff",
              }}
            >
              {quickReplies.length > 0 && !showCreateLeadButton ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => void handleQuickReply(reply)}
                      disabled={starting || sending || leadCreated || leadCreating}
                      style={{
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        color: "#111827",
                        borderRadius: 999,
                        padding: "8px 12px",
                        cursor:
                          starting || sending || leadCreated || leadCreating
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}

              {showCreateLeadButton ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: "wrap",
                    padding: 14,
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ color: "#374151", fontSize: 14 }}>
                    {phase === "READY_FOR_HANDOFF"
                      ? "Everything looks ready. Submit this enquiry to the tradesman."
                      : "You’re almost there. If the details look right, submit this enquiry now."}
                  </div>

                  {!leadCreated ? (
                    <button
                      type="button"
                      onClick={() => void handleCreateLead()}
                      disabled={leadCreating || sending}
                      style={{
                        border: "1px solid #2563eb",
                        background:
                          leadCreating || sending ? "#93c5fd" : "#2563eb",
                        color: "#ffffff",
                        borderRadius: 10,
                        padding: "10px 14px",
                        cursor:
                          leadCreating || sending ? "not-allowed" : "pointer",
                        fontWeight: 700,
                      }}
                    >
                      {leadCreating ? "Submitting..." : "Submit enquiry"}
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/${tradesman?.slug || safeSlug || ""}`}
                      style={{
                        color: "#2563eb",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {createdLeadId ? "Open dashboard" : "Back to dashboard"}
                    </Link>
                  )}
                </div>
              ) : null}

              <form
                onSubmit={handleSend}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message…"
                  disabled={starting || sending || leadCreated || leadCreating}
                  style={{
                    flex: 1,
                    border: "1px solid #d1d5db",
                    borderRadius: 14,
                    padding: "13px 14px",
                    fontSize: 15,
                    outline: "none",
                    background: leadCreated ? "#f9fafb" : "#ffffff",
                  }}
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
                  style={{
                    border: "1px solid #111827",
                    background:
                      starting ||
                      sending ||
                      !input.trim() ||
                      leadCreated ||
                      leadCreating
                        ? "#9ca3af"
                        : "#111827",
                    color: "#ffffff",
                    borderRadius: 14,
                    padding: "13px 16px",
                    fontWeight: 700,
                    cursor:
                      starting ||
                      sending ||
                      !input.trim() ||
                      leadCreated ||
                      leadCreating
                        ? "not-allowed"
                        : "pointer",
                    minWidth: 94,
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </section>

          <aside
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 18,
                }}
              >
                How it works
              </h2>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  color: "#4b5563",
                  fontSize: 14,
                }}
              >
                <Step text="Tell us about the job." />
                <Step text="We qualify the enquiry." />
                <Step text="Submit it to the tradesman." />
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 18,
                }}
              >
                Business
              </h2>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {tradesman?.businessName || "Loading..."}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
                Your enquiry goes directly into this business&apos;s TradeMate
                dashboard.
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 18,
                }}
              >
                Progress
              </h2>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  color: "#4b5563",
                  fontSize: 14,
                }}
              >
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
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Step({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          marginTop: 6,
          borderRadius: 999,
          background: "#111827",
          flexShrink: 0,
        }}
      />
      <div>{text}</div>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "1px solid #f3f4f6",
        paddingBottom: 8,
      }}
    >
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function InfoBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        color: "#6b7280",
        display: "inline-block",
      }}
    >
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