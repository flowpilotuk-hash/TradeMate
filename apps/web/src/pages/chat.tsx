import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'READY_FOR_HANDOFF' | 'AWAITING_CONTACT' | 'COLLECTING' | string;

type ConversationState = {
  phase?: Phase;
  [key: string]: unknown;
};

type StartResponse = {
  conversationId?: string;
  state?: ConversationState;
  reply?: string;
  question?: string;
};

type MessageResponse = {
  conversationId?: string;
  state?: ConversationState;
  reply?: string;
  question?: string;
};

type ChatMessage = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};

const API_BASE = 'http://localhost:4000';
const HANDOFF_PHASES = new Set<Phase>(['READY_FOR_HANDOFF', 'AWAITING_CONTACT', 'COLLECTING']);

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string>('');
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasSentUserMessage, setHasSentUserMessage] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const appendMessage = (role: 'bot' | 'user', text: string) => {
    if (!text?.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        text,
      },
    ]);
  };

  useEffect(() => {
    let active = true;

    const startConversation = async () => {
      setIsStarting(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}/conversation/start`);
        if (!res.ok) {
          throw new Error(`Failed to start conversation (${res.status})`);
        }

        const data: StartResponse = await res.json();
        if (!active) return;

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        if (data.state) {
          setConversationState(data.state);
        }

        const firstBotMessage =
          data.reply || data.question || 'Hi — tell us a bit about the job you need help with.';

        appendMessage('bot', firstBotMessage);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Unable to connect to TradeMate API.');
        appendMessage('bot', 'Hi — tell us a bit about the job you need help with.');
      } finally {
        if (active) {
          setIsStarting(false);
        }
      }
    };

    startConversation();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const canShowCreateLead = useMemo(() => {
    return (
      hasSentUserMessage &&
      !leadCreated &&
      Boolean(conversationState?.phase && HANDOFF_PHASES.has(conversationState.phase))
    );
  }, [conversationState, hasSentUserMessage, leadCreated]);

  const onSend = async (event: FormEvent) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || isSending || isStarting || !conversationId) return;

    setInput('');
    setError('');
    setHasSentUserMessage(true);
    appendMessage('user', message);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/conversation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message (${res.status})`);
      }

      const data: MessageResponse = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.state) {
        setConversationState(data.state);
      }

      const botReply = data.reply || data.question;
      if (botReply) {
        appendMessage('bot', botReply);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send message right now.');
      appendMessage('bot', 'Sorry — something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const onCreateLead = async () => {
    if (!conversationId || isCreatingLead) return;

    setIsCreatingLead(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/leads/from-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create lead (${res.status})`);
      }

      setLeadCreated(true);
      appendMessage('bot', 'Thanks — your enquiry has been submitted.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create lead right now.');
    } finally {
      setIsCreatingLead(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        background: 'linear-gradient(180deg, #f6f8ff 0%, #eef2f9 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          height: '80vh',
          minHeight: 520,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(20, 32, 70, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e7ebf3',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ecf0f6', background: '#fcfdff' }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#1d2b45' }}>TradeMate Assistant</h1>
          <p style={{ margin: '8px 0 0', color: '#5d6b87', fontSize: 14 }}>
            Tell us about your job and we’ll qualify your enquiry.
          </p>
        </div>

        {error ? (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '10px 12px',
              borderRadius: 10,
              background: '#fff2f2',
              border: '1px solid #ffc9c9',
              color: '#9f2230',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            paddingBottom: 94,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#f9fbfe',
          }}
        >
          {isStarting && messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                color: '#5c6780',
                fontSize: 14,
                background: '#f0f4fb',
                border: '1px solid #e2e8f4',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              Starting your conversation…
            </div>
          ) : null}

          {!isStarting && messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                color: '#5c6780',
                fontSize: 14,
                textAlign: 'center',
                maxWidth: 360,
              }}
            >
              No messages yet. Tell us what you need done and we’ll guide you.
            </div>
          ) : null}

          {messages.map((msg) => {
            const isBot = msg.role === 'bot';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                  background: isBot ? '#edf3ff' : '#1f6fff',
                  color: isBot ? '#153056' : '#fff',
                  borderRadius: 14,
                  padding: '10px 12px',
                  fontSize: 14,
                  lineHeight: 1.4,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </div>
            );
          })}

          {isSending ? (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#edf3ff',
                color: '#153056',
                borderRadius: 14,
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
              Typing…
            </div>
          ) : null}

          {leadCreated ? (
            <a
              href="/leads"
              style={{
                alignSelf: 'flex-start',
                display: 'inline-block',
                marginTop: 6,
                color: '#1754cf',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View your leads →
            </a>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            borderTop: '1px solid #ecf0f6',
            background: '#fff',
            padding: '12px 14px',
          }}
        >
          {canShowCreateLead ? (
            <button
              onClick={onCreateLead}
              disabled={isCreatingLead}
              style={{
                marginBottom: 10,
                border: '1px solid #6f9cff',
                color: '#1646b3',
                background: '#eef4ff',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: isCreatingLead ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {isCreatingLead ? 'Creating lead…' : 'Create lead'}
            </button>
          ) : null}

          <form onSubmit={onSend} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStarting || isSending || !conversationId}
              style={{
                flex: 1,
                border: '1px solid #d5ddeb',
                borderRadius: 10,
                padding: '11px 12px',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStarting || isSending || !conversationId}
              style={{
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                background: !input.trim() || isStarting || isSending || !conversationId ? '#afbdd9' : '#1f6fff',
                color: '#fff',
                fontWeight: 600,
                cursor:
                  !input.trim() || isStarting || isSending || !conversationId ? 'not-allowed' : 'pointer',
              }}
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
