import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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

  const leadSummary = selectedLead ? buildLeadSummary(selectedLead) : null;

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
    let quoteText: string | null = null;
    if (action === "quote") {
      const input = window.prompt(
        "Enter the quote to send to the customer (e.g. £14,500 supply and fit):"
      );
      const trimmed = input?.trim();
      if (!trimmed) {
        return;
      }
      quoteText = trimmed;
    }

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
            ? JSON.stringify({ quote: quoteText })
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

  async function handleLogout() {
    localStorage.removeItem("trademate_token");
    await router.push("/login");
  }

  function getFieldValue(lead: Lead, key: string) {
    return lead.fields?.[key]?.value ?? "—";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader currentPath={safeSlug ? `/dashboard/${safeSlug}` : undefined} dashboardSlug={safeSlug} />

      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                TradeMate Dashboard
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {tradesman?.businessName || "Tradesman Dashboard"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Review incoming leads, check project details, and take action quickly while you&apos;re on the move.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
              {tradesman ? (
                <Link
                  href={`/chat/${tradesman.slug}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Open customer link
                </Link>
              ) : null}

              <button
                onClick={() => void reloadLeads(true)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={() => void handleLogout()}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review and triage incoming leads.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {loading ? "Loading..." : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
              </span>
            </div>

            <div className="-mx-1 mb-4 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2 px-1">
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
                      className={[
                        "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition whitespace-nowrap",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span>{tab.label}</span>
                      <span className={active ? "text-white/80" : "text-slate-500"}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <EmptyState>Loading leads…</EmptyState>
            ) : leads.length === 0 ? (
              <EmptyState>No leads in this view.</EmptyState>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => {
                  const isSelected = lead.leadId === selectedLeadId;

                  return (
                    <button
                      key={lead.leadId}
                      onClick={() => setSelectedLeadId(lead.leadId)}
                      className={[
                        "block w-full rounded-2xl border p-4 text-left transition",
                        isSelected
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
                      ].join(" ")}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">
                            {humanizeEnum(lead.tradeKind) || "Unknown trade"}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            {lead.leadId}
                          </div>
                        </div>
                        <StatusBadge status={lead.status || "NEW"} />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <LeadMetaRow
                          label="Customer"
                          value={String(getFieldValue(lead, "firstName"))}
                        />
                        <LeadMetaRow
                          label="Postcode"
                          value={formatValue(getFieldValue(lead, "postcode"))}
                        />
                        <LeadMetaRow
                          label="Timeline"
                          value={formatValue(getFieldValue(lead, "timeline"))}
                        />
                        <LeadMetaRow
                          label="Created"
                          value={formatDateTime(lead.createdAt)}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:min-h-[620px] lg:p-6">
            {!selectedLead ? (
              <EmptyState>Select a lead to view its details.</EmptyState>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                          {humanizeEnum(selectedLead.tradeKind) || "Lead detail"}
                        </h2>
                        <StatusBadge status={selectedLead.status || "NEW"} />
                      </div>
                      <div className="break-all text-sm text-slate-500">
                        {selectedLead.leadId}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[360px]">
                      <ActionButton
                        onClick={() => void runLeadAction("approve", selectedLead.leadId)}
                        disabled={actionLoading !== null}
                        variant="success"
                      >
                        {actionLoading === "approve" ? "Approving..." : "Approve"}
                      </ActionButton>

                      <ActionButton
                        onClick={() => void runLeadAction("reject", selectedLead.leadId)}
                        disabled={actionLoading !== null}
                        variant="danger"
                      >
                        {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                      </ActionButton>

                      <ActionButton
                        onClick={() => void runLeadAction("quote", selectedLead.leadId)}
                        disabled={actionLoading !== null}
                        variant="primary"
                      >
                        {actionLoading === "quote" ? "Quoting..." : "Quote"}
                      </ActionButton>
                    </div>
                  </div>

                  {leadSummary ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        Lead summary
                      </div>
                      <p className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                        {leadSummary}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <SummaryCard
                    label="Phase"
                    value={humanizeEnum(selectedLead.phase || "—")}
                  />
                  <SummaryCard
                    label="Status"
                    value={humanizeEnum(selectedLead.status || "NEW")}
                  />
                  <SummaryCard
                    label="Postcode"
                    value={getFieldValue(selectedLead, "postcode")}
                  />
                  <SummaryCard
                    label="Email"
                    value={getFieldValue(selectedLead, "email")}
                  />
                  <SummaryCard
                    label="Phone"
                    value={getFieldValue(selectedLead, "phone")}
                  />
                  <SummaryCard
                    label="Quote"
                    value={selectedLead.quote || "—"}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <PanelCard title="Project details">
                    <DetailRow
                      label="Job type"
                      value={humanizeEnum(getFieldValue(selectedLead, "jobType"))}
                    />
                    <DetailRow
                      label="Kitchen size"
                      value={humanizeEnum(getFieldValue(selectedLead, "kitchenSize"))}
                    />
                    <DetailRow
                      label="Layout change"
                      value={humanizeEnum(getFieldValue(selectedLead, "layoutChange"))}
                    />
                    <DetailRow
                      label="Units supply"
                      value={humanizeEnum(getFieldValue(selectedLead, "unitsSupply"))}
                    />
                    <DetailRow
                      label="Timeline"
                      value={humanizeEnum(getFieldValue(selectedLead, "timeline"))}
                    />
                    <DetailRow
                      label="Budget disclosure"
                      value={humanizeEnum((selectedLead.budget as any)?.disclosure || "—")}
                      last
                    />
                  </PanelCard>

                  <PanelCard title="Timeline & activity">
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
                      last
                    />
                  </PanelCard>
                </div>

                <PanelCard title="Conversation transcript">
                  {selectedLead.conversationMessages?.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                      <div className="space-y-2">
                        {selectedLead.conversationMessages.map((message, index) => {
                          const isCustomer = message.role === "user";
                          const isSystem = message.role === "system";

                          if (isSystem) {
                            return (
                              <div
                                key={`${message.role}-${index}`}
                                className="flex justify-center px-1 py-1"
                              >
                                <div className="max-w-md rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                  {message.text}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`${message.role}-${index}`}
                              className={`flex ${
                                isCustomer ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={[
                                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm",
                                  isCustomer
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                                    : "bg-slate-50 text-slate-900 ring-1 ring-slate-200",
                                ].join(" ")}
                              >
                                {message.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-200 pt-3 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600" />
                          Customer
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-slate-300" />
                          Bot
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No transcript available for this lead yet.
                    </p>
                  )}
                </PanelCard>

                <PanelCard
                  title="Technical detail"
                  action={
                    <button
                      onClick={() => setShowJson((current) => !current)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {showJson ? "Hide raw JSON" : "Show raw JSON"}
                    </button>
                  }
                >
                  {showJson ? (
                    <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200 sm:text-[13px]">
                      {JSON.stringify(selectedLead, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Expand this section to inspect the full raw payload for debugging or support.
                    </p>
                  )}
                </PanelCard>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "border-slate-300 bg-slate-100 text-slate-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    QUOTED: "border-blue-200 bg-blue-50 text-blue-700",
  };

  const className =
    map[status] || "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${className}`}
    >
      {humanizeEnum(status)}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "success" | "danger" | "primary";
}) {
  const variants: Record<string, string> = {
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    danger: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
    primary: "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function PanelCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="break-words text-sm font-semibold text-slate-900 sm:text-[15px]">
        {formatValue(value)}
      </div>
    </div>
  );
}

function LeadMetaRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-900">
        {formatValue(value)}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: unknown;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 py-3",
        last ? "" : "border-b border-slate-200",
      ].join(" ")}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-slate-900">
        {formatValue(value)}
      </span>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
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
    firstName
      ? `${firstName} is enquiring about ${jobType.toLowerCase()}`
      : `Customer is enquiring about ${jobType.toLowerCase()}`,
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