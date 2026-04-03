import Link from "next/link";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { API_BASE } from "../lib/config";

type ChatMessage = {
  id: string;
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
      try {
        const res = await fetch(`${API_BASE}/conversation/start`);
        const data: ConversationResponse = await res.json();

        setConversationId(data.conversationId || null);
        setPhase(data.state?.phase);

        const firstMessage =
          data.reply ||
          data.question ||
          "Hi — tell us a bit about the job you need help with.";

        setMessages([
          {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: firstMessage,
          },
        ]);
      } catch (err) {
        setError("Failed to start conversation");
      } finally {
        setStarting(false);
      }
    }

    startConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !conversationId) return;

    const userText = input.trim();

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: userText },
    ]);

    setInput("");
    setSending(true);
    setHasSentMessage(true);

    try {
      const res = await fetch(`${API_BASE}/conversation/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: userText,
        }),
      });

      const data: ConversationResponse = await res.json();

      const reply =
        data.reply || data.question || "Thanks — I've noted that.";

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, role: "bot", text: reply },
      ]);

      setPhase(data.state?.phase);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          text: "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateLead() {
    if (!conversationId) return;

    setLeadCreating(true);

    try {
      await fetch(`${API_BASE}/leads/from-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId }),
      });

      setLeadCreated(true);

      setMessages((prev) => [
        ...prev,
        {
          id: `lead-${Date.now()}`,
          role: "system",
          text: "Your enquiry has been submitted.",
        },
      ]);
    } catch {
      setError("Failed to create lead");
    } finally {
      setLeadCreating(false);
    }
  }

  const showCreateLead =
    hasSentMessage &&
    !leadCreated &&
    (phase === "READY_FOR_HANDOFF" ||
      phase === "AWAITING_CONTACT" ||
      phase === "COLLECTING");

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1>TradeMate Assistant</h1>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={chatBoxStyle}>
          {starting ? (
            <div style={infoBubbleStyle}>Starting conversation…</div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...bubbleStyle,
                      background: isUser ? "#111827" : "#ffffff",
                      color: isUser ? "#fff" : "#111827",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}

          {sending && <div style={infoBubbleStyle}>Typing…</div>}

          <div ref={messagesEndRef} />
        </div>

        {showCreateLead && (
          <button onClick={handleCreateLead} style={buttonStyle}>
            {leadCreating ? "Submitting..." : "Submit enquiry"}
          </button>
        )}

        {leadCreated && (
          <Link href="/dashboard" style={{ marginTop: 10 }}>
            Go to dashboard
          </Link>
        )}

        <form onSubmit={handleSend} style={formStyle}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={inputStyle}
            placeholder="Type message..."
          />
          <button type="submit" style={buttonStyle}>
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

/* ---------- styles ---------- */

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f5f7fb",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "0 auto",
};

const chatBoxStyle: React.CSSProperties = {
  height: 400,
  overflowY: "auto",
  background: "#fafafa",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 12,
};

const bubbleStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  marginBottom: 10,
  maxWidth: "70%",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#111827",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  color: "red",
  marginBottom: 10,
};

const infoBubbleStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
};