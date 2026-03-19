import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "bot" | "user" | "system";
  text: string;
};

type ConversationResponse = {
  conversationId?: string;
  state?: {
    phase?: string;
  };
  reply?: string | null;
  question?: string | null;
};

const API_BASE = "http://localhost:4000";

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [starting, setStarting] = useState(true);
  const [sending, setSending] = useState(false);
  const [leadCreating, setLeadCreating] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [phase, setPhase] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function startConversation() {
      setStarting(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/conversation/start`);
        if (!response.ok) {
          throw new Error(`Failed to start conversation: ${response.status}`);
        }

        const data = (await response.json()) as ConversationResponse;

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        if (data.state?.phase) {
          setPhase(data.state.phase);
        }

        const firstBotMessage =
          data.reply ||
          data.question ||
          "Hi — tell us a bit about the job you need help with.";

        setMessages([{ role: "bot", text: firstBotMessage }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setStarting(false);
      }
    }

    void startConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || !conversationId || sending) {
      return;
    }

    setSending(true);
    setError(null);

    const userMessage = trimmed;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: userMessage }]);
    setHasSentMessage(true);

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

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = (await response.json()) as ConversationResponse;

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.state?.phase) {
        setPhase(data.state.phase);
      }

      const botReply =
        data.reply ||
        data.question ||
        "Thanks — I've noted that.";

      setMessages((current) => [...current, { role: "bot", text: botReply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMessages((current) => [
        ...current,
        { role: "system", text: "Sorry — something went wrong. Please try again." },
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

      if (!response.ok) {
        throw new Error(`Failed to create lead: ${response.status}`);
      }

      await response.json();

      setLeadCreated(true);
      setMessages((current) => [
        ...current,
        { role: "system", text: "Thanks — your enquiry has been submitted." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLeadCreating(false);
    }
  }

  const showCreateLeadButton =
    hasSentMessage &&
    !leadCreated &&
    (phase === "READY_FOR_HANDOFF" ||
      phase === "AWAITING_CONTACT" ||
      phase === "COLLECTING");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 24,
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 20 }}>
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
            TradeMate
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.1,
            }}
          >
            TradeMate Assistant
          </h1>
          <p
            style={{
              marginTop: 10,
              color: "#6b7280",
              fontSize: 16,
            }}
          >
            Tell us about your job and we’ll qualify your enquiry.
          </p>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 12,
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
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
            <div style={{ fontWeight: 700 }}>Customer Chat</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {starting ? "Starting conversation..." : "Live qualification"}
            </div>
          </div>

          <div
            style={{
              height: 460,
              overflowY: "auto",
              padding: 18,
              background: "#fafafa",
            }}
          >
            {starting ? (
              <div style={infoBubbleStyle}>Starting conversation…</div>
            ) : messages.length === 0 ? (
              <div style={infoBubbleStyle}>No messages yet.</div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.role === "user";
                const isSystem = message.role === "system";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "12px 14px",
                        borderRadius: 16,
                        lineHeight: 1.45,
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
              })
            )}
            <div ref={messagesEndRef} />
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
                    {leadCreating ? "Creating lead..." : "Create lead"}
                  </button>
                ) : (
                  <Link
                    href="/leads"
                    style={{
                      color: "#2563eb",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    View leads inbox
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
                disabled={starting || sending || leadCreated}
                style={{
                  flex: 1,
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 15,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={starting || sending || !input.trim() || leadCreated}
                style={{
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#ffffff",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  minWidth: 92,
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

const infoBubbleStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
  display: "inline-block",
};