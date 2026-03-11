import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react';

type ChatRole = 'user' | 'bot';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type StartConversationResponse = {
  conversationId: string;
  state?: unknown;
  reply?: string;
  question?: string;
};

type ConversationMessageResponse = {
  reply?: string;
  question?: string;
};

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  backgroundColor: '#f5f7fb',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const wrapperStyle: CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e1e7ef',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '520px',
  maxHeight: '70vh',
  overflow: 'hidden',
};

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string>('');
  const [conversationState, setConversationState] = useState<unknown>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sentCount, setSentCount] = useState<number>(0);
  const [creatingLead, setCreatingLead] = useState<boolean>(false);
  const [leadCreated, setLeadCreated] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const startConversation = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:4000/conversation/start', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Could not start conversation.');
        }

        const data = (await response.json()) as StartConversationResponse;
        const firstBotText = data.reply ?? data.question ?? '';

        setConversationId(data.conversationId ?? '');
        setConversationState(data.state ?? null);

        if (firstBotText) {
          setMessages([
            {
              id: `bot-initial-${Date.now()}`,
              role: 'bot',
              text: firstBotText,
            },
          ]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void startConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || !conversationId || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message.');
      }

      const data = (await response.json()) as ConversationMessageResponse;
      const botText = data.reply ?? data.question ?? '';

      if (botText) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: botText,
          },
        ]);
      }

      setSentCount((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleCreateLead = async () => {
    if (!conversationId || creatingLead || leadCreated) {
      return;
    }

    setCreatingLead(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/leads/from-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead.');
      }

      setLeadCreated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      setError(message);
    } finally {
      setCreatingLead(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <header>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#122340' }}>TradeMate Assistant</h1>
          <p style={{ margin: '8px 0 0', color: '#4b5d79' }}>
            Tell us about your job and we’ll qualify your enquiry.
          </p>
          {conversationState ? (
            <p style={{ margin: '8px 0 0', color: '#7a879a', fontSize: '12px' }}>
              Conversation ready.
            </p>
          ) : null}
        </header>

        {error ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffe8e8',
              border: '1px solid #ffc8c8',
              color: '#9d1c1c',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={cardStyle}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#f9fbff',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {loading ? <p style={{ margin: 0, color: '#5c6f8e' }}>Loading conversation...</p> : null}

            {!loading && messages.length === 0 ? (
              <p style={{ margin: 0, color: '#5c6f8e' }}>No messages yet.</p>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      borderRadius: '14px',
                      padding: '10px 12px',
                      lineHeight: 1.4,
                      fontSize: '14px',
                      backgroundColor: isUser ? '#1f6feb' : '#e8eef8',
                      color: isUser ? '#ffffff' : '#1f2f46',
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            style={{
              borderTop: '1px solid #e1e7ef',
              padding: '12px',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#ffffff',
            }}
          >
            <input
              type="text"
              placeholder="Type your message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading || sending || !conversationId}
              style={{
                flex: 1,
                border: '1px solid #cbd6e5',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || sending || !input.trim() || !conversationId}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                backgroundColor: sending ? '#88a6d8' : '#1f6feb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        {sentCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCreateLead}
              disabled={creatingLead || leadCreated}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                backgroundColor: leadCreated ? '#31a46a' : '#1f6feb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: creatingLead || leadCreated ? 'not-allowed' : 'pointer',
              }}
            >
              {creatingLead ? 'Creating...' : leadCreated ? 'Lead Created' : 'Create Lead'}
            </button>

            {leadCreated ? (
              <div style={{ color: '#245a39', fontSize: '14px' }}>
                Your enquiry has been submitted. <a href="/leads">Go to leads</a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
