import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader";
import { API_BASE } from "../../lib/config";

type ConversationMessage = {
  role: "bot" | "user" | "system";
  text: string;
};

type Lead = {
  leadId: string;
  tradesmanId?: string;
  tradesmanSlug?: string;
  tradesmanBusinessName?: string;
  tradeKind?: string;
  status?: string;
  phase?: string;
  classification?: {
    completion?: string;
    actionable?: boolean;
    flags?: string[];
  };
  fields?: Record<string, { value?: unknown; updatedAt?: string; source?: string }>;
  meta?: Record<string, unknown>;
  budget?: Record<string, unknown>;
  audit?: Record<string, unknown>;
  conversationMessages?: ConversationMessage[];
  createdAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  quotedAt?: string;
  quote?: string;
};

type Tradesman = {
  tradesmanId: string;
  businessName: string;
  slug: string;
  email: string;
  createdAt: string;
};

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "APPROVED", label: "Approved" },
  { key: "QUOTED", label: "Quoted" },
  { key: "REJECTED", label: "Rejected" },
] as const;

export default function TradesmanDashboardPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [tradesman, setTradesman] = useState<Tradesman | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const safeSlug = useMemo(
    () => (typeof slug === "string" && slug.trim() ? slug : null),
    [slug]
  );

  useEffect(() => {
    if (!router.isReady || !safeSlug) {
      return;
    }

    async function loadDashboard(
      preserveSelected = false,
      nextStatusFilter = statusFilter
    ) {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("trademate_token");
        if (!token) {
          await router.push("/login");
          return;
        }

        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meResponse.ok) {
          localStorage.removeItem("trademate_token");
          await router.push("/login");
          return;
        }

        const meData = (await meResponse.json()) as Tradesman;

        if (meData.slug !== safeSlug) {
          await router.push(`/dashboard/${encodeURIComponent(meData.slug)}`);
          return;
        }

        setTradesman(meData);

        const leadsUrl =
          nextStatusFilter && nextStatusFilter !== "ALL"
            ? `${API_BASE}/leads?status=${encodeURIComponent(nextStatusFilter)}`
            : `${API_BASE}/leads`;

        const leadsResponse = await fetch(leadsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!leadsResponse.ok) {
          const problem = await leadsResponse.json().catch(() => null);
          throw new Error(
            problem?.error || `Failed to fetch leads: ${leadsResponse.status}`
          );
        }

        const leadData = (await leadsResponse.json()) as Lead[];
        const nextLeads = Array.isArray(leadData) ? leadData : [];
        setLeads(nextLeads);

        if (!preserveSelected) {
          setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
        } else if (selectedLeadId) {
          const stillExists = nextLeads.some(
            (lead) => lead.leadId === selectedLeadId
          );
          if (!stillExists) {
            setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
          }
        } else {
          setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard(false, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, safeSlug, statusFilter]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.leadId === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: leads.length,
      NEW: 0,
      APPROVED: 0,
      QUOTED: 0,
      REJECTED: 0,
    };

    for (const lead of leads) {
      const key = String(lead.status || "").toUpperCase();
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    }

    return counts;
  }, [leads]);

  async function reloadLeads(
    preserveSelected = true,
    nextStatusFilter = statusFilter
  ) {
    const token = localStorage.getItem("trademate_token");
    if (!token) {
      await router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url =
        nextStatusFilter && nextStatusFilter !== "ALL"
          ? `${API_BASE}/leads?status=${encodeURIComponent(nextStatusFilter)}`
          : `${API_BASE}/leads`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Failed to fetch leads: ${response.status}`);
      }

      const nextLeads = Array.isArray(data) ? data : [];
      setLeads(nextLeads);

      if (!preserveSelected) {
        setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
      } else if (selectedLeadId) {
        const stillExists = nextLeads.some(
          (lead) => lead.leadId === selectedLeadId
        );
        if (!stillExists) {
          setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
        }
      } else {
        setSelectedLeadId(nextLeads.length > 0 ? nextLeads[0].leadId : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSelectedLead(leadId: string) {
    const token = localStorage.getItem("trademate_token");
    if (!token) {
      await router.push("/login");
      return;
    }

    const response = await fetch(`${API_BASE}/leads/${leadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `Failed to fetch lead: ${response.status}`);
    }

    const updatedLead = data as Lead;

    setLeads((current) =>
      current.map((lead) =>
        lead.leadId === updatedLead.leadId ? updatedLead : lead
      )
    );
  }

  async function runLeadAction(
    action: "approve" | "reject" | "quote",
    leadId: string
  ) {
    setActionLoading(action);
    setError(null);

    try {
      const token = localStorage.getItem("trademate_token");
      if (!token) {
        await router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/leads/${leadId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action === "quote" ? { "Content-Type": "application/json" } : {}),
        },
        body:
          action === "quote"
            ? JSON.stringify({ quote: "GBP 14,500 supply and fit" })
            : undefined,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Action failed: ${response.status}`);
      }

      await reloadLeads(true);
      await refreshSelectedLead(leadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  }

  function getFieldValue(lead: Lead, key: string) {
    return lead.fields?.[key]?.value ?? "—";
  }

  function renderField(label: string, value: unknown) {
    return (
      <div style={summaryCardStyle}>
        <div style={summaryLabelStyle}>{label}</div>
        <div style={summaryValueStyle}>{formatValue(value)}</div>
      </div>
    );
  }

  async function handleLogout() {
    localStorage.removeItem("trademate_token");
    await router.push("/login");
  }

  const leadSummary = selectedLead ? buildLeadSummary(selectedLead) : null;

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
      <AppHeader dashboardSlug={safeSlug} />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 0 24px" }}>
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
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
              TradeMate Dashboard
            </div>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>
              {tradesman?.businessName || "Tradesman Dashboard"}
            </h1>
            <p style={{ margin: "10px 0 0 0", color: "#6b7280", fontSize: 15 }}>
              Review and manage leads for your business.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {tradesman ? (
              <Link
                href={`/chat/${tradesman.slug}`}
                style={{
                  textDecoration: "none",
                  color: "#111827",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 700,
                }}
              >
                Open customer link
              </Link>
            ) : null}
            <button
              onClick={() => void reloadLeads(true)}
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                borderRadius: 12,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => void handleLogout()}
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                borderRadius: 12,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Log out
            </button>
          </div>
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
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Inbox</h2>
              <span
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  background: "#f3f4f6",
                  borderRadius: 999,
                  padding: "6px 10px",
                }}
              >
                {loading ? "Loading..." : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.key;
                const count = statusCounts[tab.key] ?? 0;

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setSelectedLeadId(null);
                    }}
                    style={{
                      border: active ? "1px solid #111827" : "1px solid #d1d5db",
                      background: active ? "#111827" : "#ffffff",
                      color: active ? "#ffffff" : "#111827",
                      borderRadius: 999,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        opacity: active ? 0.9 : 0.7,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Loading leads…</div>
            ) : leads.length === 0 ? (
              <div style={emptyStateStyle}>No leads in this view.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {leads.map((lead) => {
                  const isSelected = lead.leadId === selectedLeadId;
                  return (
                    <button
                      key={lead.leadId}
                      onClick={() => setSelectedLeadId(lead.leadId)}
                      style={{
                        textAlign: "left",
                        border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
                        background: isSelected ? "#f9fafb" : "#ffffff",
                        borderRadius: 14,
                        padding: 14,
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 6px 20px rgba(17,24,39,0.08)"
                          : "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {humanizeEnum(lead.tradeKind) || "Unknown trade"}
                        </div>
                        <StatusBadge status={lead.status || "NEW"} />
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 10,
                          wordBreak: "break-all",
                        }}
                      >
                        {lead.leadId}
                      </div>

                      <div style={cardMetaRowStyle}>
                        <span style={cardMetaLabelStyle}>Customer</span>
                        <span style={cardMetaValueStyle}>
                          {String(getFieldValue(lead, "firstName"))}
                        </span>
                      </div>
                      <div style={cardMetaRowStyle}>
                        <span style={cardMetaLabelStyle}>Postcode</span>
                        <span style={cardMetaValueStyle}>
                          {formatValue(getFieldValue(lead, "postcode"))}
                        </span>
                      </div>
                      <div style={cardMetaRowStyle}>
                        <span style={cardMetaLabelStyle}>Timeline</span>
                        <span style={cardMetaValueStyle}>
                          {formatValue(getFieldValue(lead, "timeline"))}
                        </span>
                      </div>
                      <div style={cardMetaRowStyle}>
                        <span style={cardMetaLabelStyle}>Created</span>
                        <span style={cardMetaValueStyle}>
                          {formatDateTime(lead.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 20,
              minHeight: 520,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            {!selectedLead ? (
              <div style={emptyStateStyle}>Select a lead to view its details.</div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: 28 }}>
                        {humanizeEnum(selectedLead.tradeKind) || "Lead detail"}
                      </h2>
                      <StatusBadge status={selectedLead.status || "NEW"} />
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 14, wordBreak: "break-all" }}>
                      {selectedLead.leadId}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => void runLeadAction("approve", selectedLead.leadId)}
                      disabled={actionLoading !== null}
                      style={actionButtonStyle("#16a34a", "#f0fdf4")}
                    >
                      {actionLoading === "approve" ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => void runLeadAction("reject", selectedLead.leadId)}
                      disabled={actionLoading !== null}
                      style={actionButtonStyle("#dc2626", "#fef2f2")}
                    >
                      {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                    </button>
                    <button
                      onClick={() => void runLeadAction("quote", selectedLead.leadId)}
                      disabled={actionLoading !== null}
                      style={actionButtonStyle("#2563eb", "#eff6ff")}
                    >
                      {actionLoading === "quote" ? "Quoting..." : "Quote"}
                    </button>
                  </div>
                </div>

                {leadSummary ? (
                  <div
                    style={{
                      marginBottom: 20,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: 8,
                      }}
                    >
                      Lead summary
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.7, color: "#111827" }}>
                      {leadSummary}
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {renderField("Phase", humanizeEnum(selectedLead.phase || "—"))}
                  {renderField("Status", humanizeEnum(selectedLead.status || "NEW"))}
                  {renderField("Postcode", getFieldValue(selectedLead, "postcode"))}
                  {renderField("Email", getFieldValue(selectedLead, "email"))}
                  {renderField("Phone", getFieldValue(selectedLead, "phone"))}
                  {renderField("Quote", selectedLead.quote || "—")}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={panelCardStyle}>
                    <h3 style={panelTitleStyle}>Project details</h3>
                    <DetailRow label="Job type" value={humanizeEnum(getFieldValue(selectedLead, "jobType"))} />
                    <DetailRow label="Kitchen size" value={humanizeEnum(getFieldValue(selectedLead, "kitchenSize"))} />
                    <DetailRow label="Layout change" value={humanizeEnum(getFieldValue(selectedLead, "layoutChange"))} />
                    <DetailRow label="Units supply" value={humanizeEnum(getFieldValue(selectedLead, "unitsSupply"))} />
                    <DetailRow label="Timeline" value={humanizeEnum(getFieldValue(selectedLead, "timeline"))} />
                    <DetailRow
                      label="Budget disclosure"
                      value={humanizeEnum((selectedLead.budget as any)?.disclosure || "—")}
                    />
                  </div>

                  <div style={panelCardStyle}>
                    <h3 style={panelTitleStyle}>Timeline & activity</h3>
                    <DetailRow label="Created" value={formatDateTime(selectedLead.createdAt)} />
                    <DetailRow label="Approved" value={formatDateTime(selectedLead.approvedAt)} />
                    <DetailRow label="Rejected" value={formatDateTime(selectedLead.rejectedAt)} />
                    <DetailRow label="Quoted" value={formatDateTime(selectedLead.quotedAt)} />
                    <DetailRow
                      label="Last message"
                      value={formatDateTime((selectedLead.audit as any)?.lastUserMessageAt)}
                    />
                    <DetailRow
                      label="Turn count"
                      value={(selectedLead.audit as any)?.turnCount ?? "—"}
                    />
                  </div>
                </div>

                <div style={panelCardStyle}>
                  <h3 style={panelTitleStyle}>Conversation transcript</h3>

                  {selectedLead.conversationMessages?.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {selectedLead.conversationMessages.map((message, index) => {
                        const isUser = message.role === "user";
                        const isSystem = message.role === "system";

                        return (
                          <div
                            key={`${message.role}-${index}`}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              background: isUser
                                ? "#eef2ff"
                                : isSystem
                                ? "#ecfdf5"
                                : "#f9fafb",
                              border: isUser
                                ? "1px solid #c7d2fe"
                                : isSystem
                                ? "1px solid #a7f3d0"
                                : "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                color: "#6b7280",
                                marginBottom: 6,
                              }}
                            >
                              {isUser ? "Customer" : isSystem ? "System" : "Bot"}
                            </div>
                            <div style={{ lineHeight: 1.6 }}>{message.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                      No transcript available for this lead yet.
                    </p>
                  )}
                </div>

                <div style={{ height: 20 }} />

                <div style={panelCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <h3 style={panelTitleStyle}>Technical detail</h3>
                    <button
                      onClick={() => setShowJson((current) => !current)}
                      style={{
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        borderRadius: 10,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {showJson ? "Hide raw JSON" : "Show raw JSON"}
                    </button>
                  </div>

                  {showJson ? (
                    <pre
                      style={{
                        background: "#0f172a",
                        color: "#e5e7eb",
                        padding: 16,
                        borderRadius: 12,
                        overflowX: "auto",
                        fontSize: 13,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(selectedLead, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                      Expand this section to inspect the full raw payload for debugging or support.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    NEW: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
    APPROVED: { bg: "#ecfdf5", text: "#166534", border: "#86efac" },
    REJECTED: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
    QUOTED: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  };

  const style = map[status] || {
    bg: "#f3f4f6",
    text: "#111827",
    border: "#d1d5db",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {humanizeEnum(status)}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>
        {formatValue(value)}
      </span>
    </div>
  );
}

function humanizeEnum(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  const text = String(value).trim();
  if (!text) {
    return "—";
  }

  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDateTime(value: unknown) {
  if (!value) {
    return "—";
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return humanizeEnum(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildLeadSummary(lead: Lead) {
  const firstName = String(lead.fields?.firstName?.value || "").trim();
  const postcode = String(lead.fields?.postcode?.value || "").trim();
  const jobType = humanizeEnum(lead.fields?.jobType?.value || lead.tradeKind || "job");
  const kitchenSize = humanizeEnum(lead.fields?.kitchenSize?.value || "");
  const layoutChange = humanizeEnum(lead.fields?.layoutChange?.value || "");
  const unitsSupply = humanizeEnum(lead.fields?.unitsSupply?.value || "");
  const timeline = humanizeEnum(lead.fields?.timeline?.value || "");
  const budgetNotes =
    (lead.fields?.budget?.value as any)?.indicators?.notes ||
    (lead.budget as any)?.indicators?.notes ||
    "";

  const parts = [
    firstName ? `${firstName} is enquiring about ${jobType.toLowerCase()}` : `Customer is enquiring about ${jobType.toLowerCase()}`,
    postcode ? `in ${postcode}` : "",
    kitchenSize && kitchenSize !== "—" ? `for a ${kitchenSize.toLowerCase()} kitchen` : "",
    layoutChange && layoutChange !== "—" ? `with ${layoutChange.toLowerCase()} planned` : "",
    unitsSupply && unitsSupply !== "—" ? `and ${unitsSupply.toLowerCase()}` : "",
    timeline && timeline !== "—" ? `The target timeline is ${timeline.toLowerCase()}.` : "",
    budgetNotes ? `Budget signal captured: ${budgetNotes}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return parts || null;
}

const emptyStateStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 14,
  background: "#f9fafb",
  color: "#6b7280",
  textAlign: "center",
  border: "1px dashed #d1d5db",
};

const cardMetaRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 4,
};

const cardMetaLabelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 13,
};

const cardMetaValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "right",
  maxWidth: 180,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const panelCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eceff3",
  borderRadius: 14,
  padding: 16,
};

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: 16,
};

const summaryCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eceff3",
  borderRadius: 14,
  padding: 14,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontWeight: 700,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

function actionButtonStyle(borderColor: string, background: string) {
  return {
    border: `1px solid ${borderColor}`,
    background,
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    color: "#111827",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  } as const;
}