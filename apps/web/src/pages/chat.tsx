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
      } catch {
        setError("Failed to start conversation");
      } finally {
        setStarting(false);
      }
    }

    void startConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !conversationId || sending) return;

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
    if (!conversationId || leadCreating) return;

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
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white shadow-sm">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                TradeMate Assistant
              </div>
              <h1 className="mt-1 truncate text-lg font-semibold text-slate-900 sm:text-xl">
                Customer enquiry chat
              </h1>
            </div>

            <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {starting ? "Starting" : sending ? "Typing..." : "Live"}
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
              {starting ? (
                <InfoBubble>Starting conversation…</InfoBubble>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%]",
                          isUser
                            ? "border border-slate-900 bg-slate-900 text-white"
                            : isSystem
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border border-slate-200 bg-white text-slate-900",
                        ].join(" ")}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}

              {sending ? <InfoBubble>Typing…</InfoBubble> : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
              {showCreateLead ? (
                <button
                  onClick={handleCreateLead}
                  disabled={leadCreating}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadCreating ? "Submitting..." : "Submit enquiry"}
                </button>
              ) : null}

              {leadCreated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Go to dashboard
                </Link>
              ) : null}

              <form onSubmit={handleSend} className="flex items-end gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Type your message
                </label>

                <div className="flex-1">
                  <textarea
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="min-h-[48px] w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                    disabled={starting || sending || leadCreated}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend(e as unknown as FormEvent);
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || !conversationId || sending || starting || leadCreated}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </form>

              <p className="text-xs leading-5 text-slate-500">
                Tell us about the job, timing, and location. We’ll guide you through the rest.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </div>
  );
}