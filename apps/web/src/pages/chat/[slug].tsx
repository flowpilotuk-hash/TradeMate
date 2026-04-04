import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../../components/AppHeader";
import { API_BASE } from "../../lib/config";

type ChatMessage = {
  id: string;
  role: "bot" | "user" | "system";
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
  messages?: { role: "bot" | "user" | "system"; text: string }[];
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

  const safeSlug = useMemo(
    () => (typeof slug === "string" && slug.trim() ? slug : null),
    [slug]
  );

  useEffect(() => {
    if (!router.isReady || !safeSlug) {
      return;
    }

    const currentSlug = safeSlug;

    async function initializeChat() {
      setStarting(true);
      setError(null);
      setLeadCreated(false);
      setCreatedLeadId(null);
      setMessages([]);
      setConversationId(null);
      setPhase(undefined);
      setInput("");

      try {
        const tradesmanResponse = await fetch(
          `${API_BASE}/tradesman/${encodeURIComponent(currentSlug)}`
        );

        if (!tradesmanResponse.ok) {
          throw new Error(
            tradesmanResponse.status === 404
              ? "This enquiry link is not valid."
              : `Failed to load tradesman: ${tradesmanResponse.status}`
          );
        }

        const tradesmanData = (await tradesmanResponse.json()) as Tradesman;
        setTradesman(tradesmanData);

        const conversationResponse = await fetch(
          `${API_BASE}/conversation/start?tradesmanSlug=${encodeURIComponent(currentSlug)}`
        );

        const conversationData =
          (await conversationResponse.json().catch(() => null)) as
            | ConversationResponse
            | null;

        if (!conversationResponse.ok || !conversationData) {
          throw new Error(
            conversationData?.error ||
              `Failed to start conversation: ${conversationResponse.status}`
          );
        }

        if (conversationData.conversationId) {
          setConversationId(conversationData.conversationId);
        }

        if (conversationData.state?.phase) {
          setPhase(conversationData.state.phase);
        }

        const initialMessages =
          Array.isArray(conversationData.messages) &&
          conversationData.messages.length > 0
            ? conversationData.messages.map((message) => ({
                id: createMessageId(),
                role: message.role,
                text: message.text,
              }))
            : [
                {
                  id: createMessageId(),
                  role: "bot" as const,
                  text:
                    conversationData.reply ||
                    conversationData.question ||
                    `Hi — tell ${tradesmanData.businessName} a bit about the job you need help with.`,
                },
              ];

        setMessages(initialMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setStarting(false);
      }
    }

    void initializeChat();
  }, [router.isReady, safeSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, leadCreating]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || !conversationId || sending || leadCreated) {
      return;
    }

    setSending(true);
    setError(null);

    const userMessage = trimmed;
    setInput("");

    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: "user",
        text: userMessage,
      },
    ]);

    try {
      const response = await fetch(`${API_BASE}/conversation/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ConversationResponse
        | null;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "system",
          text: "Sorry — something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateLead() {
    if (!conversationId || leadCreating || leadCreated) {
      return;
    }

    setLeadCreating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/leads/from-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | LeadResponse
        | null;

      if (!response.ok || !data) {
        throw new Error(data?.error || `Failed to create lead: ${response.status}`);
      }

      setLeadCreated(true);
      setCreatedLeadId(data.leadId || null);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "system",
          text: data.leadId
            ? `Thanks — your enquiry has been submitted. Reference: ${data.leadId}`
            : "Thanks — your enquiry has been submitted.",
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
      setLeadCreating(false);
    }
  }

  const showCreateLeadButton =
    !leadCreated &&
    (phase === "READY_FOR_HANDOFF" || phase === "AWAITING_CONTACT");

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
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {starting ? "Starting conversation..." : "Live qualification"}
              </div>
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
                    Ready to submit this enquiry?
                  </div>

                  {!leadCreated ? (
                    <button
                      onClick={() => void handleCreateLead()}
                      disabled={leadCreating}
                      style={{
                        border: "1px solid #2563eb",
                        background: "#2563eb",
                        color: "#ffffff",
                        borderRadius: 10,
                        padding: "10px 14px",
                        cursor: "pointer",
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
                    starting || sending || !input.trim() || leadCreated || leadCreating
                  }
                  style={{
                    border: "1px solid #111827",
                    background: "#111827",
                    color: "#ffffff",
                    borderRadius: 14,
                    padding: "13px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
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

function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}