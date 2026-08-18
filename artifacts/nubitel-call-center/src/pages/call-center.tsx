import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Pencil,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  Plus,
  RefreshCw,
  Save,
  ServerCog,
  Trash2,
  UsersRound,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAgents,
  useCdr,
  useCdrSummary,
  useDeleteAgent,
  useDeleteQueue,
  useOverview,
  useQueues,
  useSelectionScores,
  useSaveAgent,
  useSaveQueue,
  useSync,
  useTiers,
  useUpdateTier,
} from "@/hooks/use-call-center";
import { mockAgents, callVolumes } from "@/lib/mock-data";
import type { Agent, Queue } from "@/lib/types";
import {
  EmptyState,
  SearchBox,
  Skeleton,
  Spinner,
  StatusPill,
} from "@/components/ui-primitives";
import { availableDomains, getSelectedDomain } from "@/lib/domains";

const domain = getSelectedDomain;
const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
function PageFrame({
  eyebrow,
  title,
  detail,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow text-primary">{eyebrow}</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-foreground sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {detail}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
function Card({
  children,
  className = "",
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      className={`surface rounded-2xl ${className}`}
      data-testid={testId}
    >
      {children}
    </section>
  );
}
function Metric({
  label,
  value,
  trend,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="fade-up p-5">
      <div className="flex items-start justify-between">
        <span className="eyebrow text-muted-foreground">{label}</span>
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${accent === "lime" ? "bg-accent/30 text-[hsl(155,50%,28%)]" : "bg-primary/12 text-primary"}`}
        >
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <strong className="mono text-2xl font-medium tracking-[-.06em]">
          {value}
        </strong>
        <span
          className={`flex items-center gap-1 text-[11px] font-bold ${trend.startsWith("-") ? "text-destructive" : "text-[hsl(155,50%,28%)]"}`}
        >
          {trend.startsWith("-") ? (
            <ArrowDownRight size={13} />
          ) : trend.startsWith("+") ? (
            <ArrowUpRight size={13} />
          ) : null}
          {trend}
        </span>
      </div>
    </Card>
  );
}
function CallsInFlightMetric({ queues }: { queues: Queue[] }) {
  const states = [
    {
      label: "Waiting",
      value: queues.reduce((total, queue) => total + queue.waiting, 0),
    },
    {
      label: "Trying",
      value: queues.reduce((total, queue) => total + queue.trying, 0),
    },
    {
      label: "Receiving",
      value: queues.reduce((total, queue) => total + queue.receiving, 0),
    },
    {
      label: "Answered",
      value: queues.reduce((total, queue) => total + queue.answered, 0),
    },
  ];

  return (
    <Card className="fade-up p-5" testId="metric-calls-in-flight">
      <div className="flex items-start justify-between">
        <span className="eyebrow text-muted-foreground">Calls in flight</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/30 text-[hsl(155,50%,28%)]">
          <Zap size={16} />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
        {states.map((state) => (
          <div key={state.label}>
            <strong className="mono block text-xl font-medium tracking-[-.06em]">
              {state.value}
            </strong>
            <span className="text-[10px] font-bold text-muted-foreground">
              {state.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
function Topbar({
  onRefresh,
  stale = false,
}: {
  onRefresh: () => void;
  stale?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`h-2 w-2 rounded-full ${stale ? "bg-amber-400" : "live-dot bg-accent"}`}
        />
        {stale ? "Data may be stale" : "Live data"}{" "}
        <span className="mono text-[10px]">updated just now</span>
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary"
        data-testid="button-refresh"
      >
        <RefreshCw size={14} /> Refresh
      </button>
    </div>
  );
}

export function OverviewPage() {
  const { data, isLoading, isError, refetch } = useOverview(domain());
  const agents = data?.agents || [];
  const queues = data?.queues || [];
  const statusData = [
    {
      name: "Available",
      value: agents.filter((a) => a.call_status === "available").length,
      color: "#b9df51",
    },
    {
      name: "On call",
      value: agents.filter((a) =>
        ["talking", "receiving"].includes(a.call_status),
      ).length,
      color: "#f2775e",
    },
    {
      name: "Wrap-up",
      value: agents.filter((a) => a.call_status === "wrap-up").length,
      color: "#f1b14b",
    },
    {
      name: "Offline",
      value: agents.filter((a) => a.call_status === "offline").length,
      color: "#bdc6d2",
    },
  ];
  if (isError)
    return (
      <PageFrame
        eyebrow="Control room"
        title="Overview unavailable"
        detail="The API did not respond. Your local session is still safe."
      >
        <EmptyState
          title="Could not connect to the operations API"
          detail="Check the API base URL in Settings, then try again."
          action={
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
              data-testid="button-retry-overview"
            >
              Try again
            </button>
          }
        />
      </PageFrame>
    );
  return (
    <PageFrame
      eyebrow="Monday · 09:42 local"
      title="Good morning, Muneeb."
      detail={`Here is the pulse of ${domain()}'s call floor.`}
      action={
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">
          <Wifi size={14} className="text-[hsl(155,50%,28%)]" /> Connection
          healthy
        </div>
      }
    >
      <Topbar onRefresh={() => refetch()} />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[126px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Metric
            label="Agents online"
            value={`${agents.filter((a) => a.status === "active").length} / ${agents.length}`}
            trend="+2.4%"
            icon={UsersRound}
          />
          <CallsInFlightMetric queues={queues} />
        </div>
      )}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow text-muted-foreground">
                Live call activity
              </div>
              <h2 className="mt-1 text-base font-extrabold">
                Calls moving through the floor
              </h2>
            </div>
            <span className="mono rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              last 60 min
            </span>
          </div>
          <div className="mt-5 h-[235px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={callVolumes.map((value, i) => ({
                  time: `${i * 5}m`,
                  value,
                }))}
              >
                <defs>
                  <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2775e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f2775e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e5e8ed" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tick={{ fill: "#7b8492" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e8ed",
                    boxShadow: "0 8px 20px rgba(34,48,78,.10)",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f2775e"
                  strokeWidth={3}
                  fill="url(#signalFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-primary" />
              Inbound calls
            </span>
            <span className="mono text-foreground">92 peak</span>
            <span className="mono text-foreground">63 avg.</span>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="eyebrow text-muted-foreground">Agent status</div>
          <h2 className="mt-1 text-base font-extrabold">
            Where attention is now
          </h2>
          <div className="mt-4 h-[175px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={53}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e8ed",
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5">
            {statusData.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.name}
                </span>
                <span className="mono font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <div className="eyebrow text-muted-foreground">
                Campaign performance
              </div>
              <h2 className="mt-1 text-base font-extrabold">
                Queues needing a look
              </h2>
            </div>
            <Link
              href="/campaigns"
              className="text-xs font-extrabold text-primary hover:underline"
              data-testid="link-view-campaigns"
            >
              View directory <ChevronRight size={14} className="inline" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {queues.map((q) => (
              <Link
                href={`/campaigns/${q.extension}`}
                key={q.extension}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50"
                data-testid={`row-campaign-${q.extension}`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary">
                  <Zap size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold">
                    {q.name}
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                    <span>{q.receiving} receiving</span>
                    <span>{q.waiting} waiting</span>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="mono text-sm font-medium">{q.answered}</div>
                  <div className="text-[10px] text-muted-foreground">
                    answered
                  </div>
                </div>
                <StatusPill status={q.status} />
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b border-border p-5">
            <div className="eyebrow text-muted-foreground">
              Operational events
            </div>
            <h2 className="mt-1 text-base font-extrabold">Recent signals</h2>
          </div>
          <div className="divide-y divide-border">
            {(data?.events || []).map((event) => (
              <div
                className="flex gap-3 p-4"
                key={event.id}
                data-testid={`event-${event.id}`}
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.tone === "red" ? "bg-destructive" : event.tone === "orange" ? "bg-primary" : event.tone === "lime" ? "bg-accent" : "bg-teal-500"}`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold">{event.title}</div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">
                    {event.detail}
                  </div>
                  <div className="mono mt-1.5 text-[10px] text-muted-foreground/70">
                    {event.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}
export function LiveOperationsPage() {
  const { data, isLoading, refetch } = useOverview(domain());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Agent | null>(null);
  const agents = (data?.agents || []).filter(
    (a) =>
      `${a.name} ${a.agent_id}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || a.call_status === filter),
  );
  return (
    <PageFrame
      eyebrow="Real-time board"
      title="Live operations"
      detail="A low-noise view of the people and queues carrying the load."
      action={
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm hover:-translate-y-0.5"
          data-testid="button-refresh-live"
        >
          <RefreshCw size={14} className="mr-2 inline" />
          Refresh board
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="grid-paper p-4">
          <div className="eyebrow text-muted-foreground">Calls in flight</div>
          <div className="mono mt-2 text-2xl">14</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Across 4 campaigns
          </div>
        </Card>
        <Card className="p-4">
          <div className="eyebrow text-muted-foreground">Longest wait</div>
          <div className="mono mt-2 text-2xl text-primary">01:42</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Renewals — West
          </div>
        </Card>
        <Card className="p-4">
          <div className="eyebrow text-muted-foreground">Floor state</div>
          <div className="mt-2 flex items-center gap-2 text-lg font-extrabold">
            <span className="live-dot h-2 w-2 rounded-full bg-accent" />
            Stable
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            No active incidents
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-base font-extrabold">Agent floor</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {agents.length} visible agents · click a row for details
              </p>
            </div>
            <div className="w-full sm:w-[250px]">
              <SearchBox
                value={query}
                onChange={setQuery}
                testId="input-live-search"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold"
              data-testid="select-live-status"
            >
              <option value="all">All states</option>
              <option value="available">Available</option>
              <option value="talking">Talking</option>
              <option value="receiving">Receiving</option>
              <option value="wrap-up">Wrap-up</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          {isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {agents.map((agent) => (
                <button
                  key={agent.uuid}
                  onClick={() => setSelected(agent)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/50"
                  data-testid={`row-live-agent-${agent.uuid}`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">
                    {agent.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold">{agent.name}</div>
                    <div className="mono mt-1 text-[10px] text-muted-foreground">
                      {agent.agent_id} · pos {agent.position}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs font-bold">{agent.last_active}</div>
                    <div className="text-[10px] text-muted-foreground">
                      last signal
                    </div>
                  </div>
                  <StatusPill status={agent.call_status} />
                  <ChevronRight size={15} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="eyebrow text-muted-foreground">Campaign activity</div>
          <h2 className="mt-1 text-base font-extrabold">Load by queue</h2>
          <div className="mt-5 space-y-5">
            {(data?.queues || []).map((q) => (
              <div key={q.extension}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-bold">{q.name}</span>
                  <span className="mono text-muted-foreground">
                    {q.receiving} / {q.inQueue}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, Math.max(12, (q.receiving / Math.max(q.inQueue, 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/campaigns"
            className="mt-7 block border-t border-border pt-4 text-xs font-extrabold text-primary"
            data-testid="link-live-campaigns"
          >
            Manage campaigns <ChevronRight size={14} className="inline" />
          </Link>
        </Card>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-sidebar/30 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 signal-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary font-extrabold text-secondary-foreground">
                  {selected.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </div>
                <div>
                  <h2 className="font-extrabold">{selected.name}</h2>
                  <div className="mono mt-1 text-[10px] text-muted-foreground">
                    {selected.agent_id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 hover:bg-muted"
                data-testid="button-close-agent-detail"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Current state", selected.call_status],
                ["Agent status", selected.status],
                ["Position", `#${selected.position}`],
                ["Last signal", selected.last_active],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-muted/60 p-3" key={label}>
                  <div className="eyebrow text-muted-foreground">{label}</div>
                  <div className="mt-2 text-sm font-extrabold">{value}</div>
                </div>
              ))}
            </div>
            <Link
              href={`/agents/${selected.uuid}`}
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-extrabold text-primary-foreground"
              data-testid="link-open-agent-detail"
            >
              Open agent profile <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function QueueForm({
  initial,
  onDone,
}: {
  initial?: Queue;
  onDone: () => void;
}) {
  const save = useSaveQueue(domain());
  const [name, setName] = useState(initial?.name || "");
  const [extension, setExtension] = useState(initial?.extension || "");
  const [strategy, setStrategy] = useState(initial?.strategy || "round-robin");
  const [record, setRecord] = useState(initial?.record ?? true);
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="eyebrow text-primary">
            {initial ? "Edit campaign" : "New campaign"}
          </div>
          <h2 className="mt-1 text-lg font-extrabold">
            {initial ? initial.name : "Create a campaign"}
          </h2>
        </div>
        <button
          onClick={onDone}
          className="rounded-lg p-2 hover:bg-muted"
          data-testid="button-close-queue-form"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold">
          Campaign name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="input-campaign-name"
          />
        </label>
        <label className="text-xs font-bold">
          Extension
          <input
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            className="mono mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="input-campaign-extension"
          />
        </label>
        <label className="text-xs font-bold">
          Distribution strategy
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="select-campaign-strategy"
          >
            <option>round-robin</option>
            <option>longest-idle-agent</option>
            <option>fewest-calls</option>
            <option>top-down</option>
          </select>
        </label>
        <label className="flex items-center gap-3 text-xs font-bold sm:pt-7">
          <input
            type="checkbox"
            checked={record}
            onChange={(e) => setRecord(e.target.checked)}
            className="h-4 w-4 accent-primary"
            data-testid="input-campaign-record"
          />{" "}
          Record calls in this queue
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onDone}
          className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          data-testid="button-cancel-queue"
        >
          Cancel
        </button>
        <button
          disabled={!name || !extension || save.isPending}
          onClick={() =>
            save.mutate(
              {
                ...(initial || {}),
                name,
                extension,
                strategy,
                record,
                domain_name: domain(),
              },
              { onSuccess: onDone },
            )
          }
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
          data-testid="button-save-queue"
        >
          {save.isPending ? (
            <Spinner label="Saving" />
          ) : (
            <>
              <Save size={14} className="mr-2 inline" />
              Save campaign
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
export function CampaignsPage() {
  const { data, isLoading, isError, refetch } = useQueues(domain());
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Queue | "new" | null>(null);
  const remove = useDeleteQueue(domain());
  const [notice, setNotice] = useState("");
  const queues = (data || []).filter((q) =>
    `${q.name} ${q.extension}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (editing)
    return (
      <PageFrame
        eyebrow="Campaign directory"
        title={editing === "new" ? "Create campaign" : "Edit campaign"}
        detail="Queue behavior is explicit, versionable, and safe to change."
        action={
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary"
            data-testid="link-back-campaigns"
          >
            <ArrowLeft size={15} /> Back to campaigns
          </Link>
        }
      >
        <QueueForm
          initial={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      </PageFrame>
    );
  if (isError)
    return (
      <PageFrame
        eyebrow="Campaign directory"
        title="Campaigns unavailable"
        detail="The local campaigns API did not respond."
      >
        <EmptyState
          title="Could not connect to the campaigns API"
          detail="Start the local API server on port 5050, then try again."
          action={
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
              data-testid="button-retry-campaigns"
            >
              Try again
            </button>
          }
        />
      </PageFrame>
    );
  const deleteQueue = (q: Queue) => {
    if (
      window.prompt(
        `Type extension ${q.extension} to permanently delete this campaign.`,
      ) === q.extension
    ) {
      remove.mutate(
        { extension: q.extension },
        { onSuccess: () => setNotice(`${q.name} deleted`) },
      );
    }
  };
  return (
    <PageFrame
      eyebrow="Campaign directory"
      title="Campaigns"
      detail="Queues are the operating surface. Keep routing rules legible."
      action={
        <button
          onClick={() => setEditing("new")}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground"
          data-testid="button-create-campaign"
        >
          <Plus size={15} className="mr-2 inline" />
          New campaign
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-sm">
          <SearchBox value={query} onChange={setQuery} />
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-primary"
          data-testid="button-refresh-campaigns"
        >
          <RefreshCw size={15} />
        </button>
      </div>
      {notice && (
        <div
          className="mb-4 rounded-xl bg-accent/25 px-4 py-3 text-xs font-bold text-[hsl(155,50%,28%)]"
          data-testid="status-campaign-notice"
        >
          <Check size={14} className="mr-2 inline" />
          {notice}
        </div>
      )}
      {isLoading ? (
        <Card className="space-y-3 p-5">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </Card>
      ) : queues.length === 0 ? (
        <EmptyState
          title="No matching campaigns"
          detail="Try another search or create the first queue for this workspace."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.5fr_100px_1fr_100px_130px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground sm:grid">
            <span>Campaign</span>
            <span>Ext.</span>
            <span>Routing</span>
            <span>Volume</span>
            <span />
          </div>
          {queues.map((q) => (
            <div
              key={q.extension}
              className="grid gap-3 border-b border-border px-5 py-4 last:border-0 sm:grid-cols-[1.5fr_100px_1fr_100px_130px] sm:items-center sm:gap-4"
              data-testid={`row-campaign-directory-${q.extension}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary">
                  <Zap size={15} />
                </div>
                <div>
                  <Link
                    href={`/campaigns/${q.extension}`}
                    className="text-sm font-extrabold hover:text-primary"
                    data-testid={`link-campaign-${q.extension}`}
                  >
                    {q.name}
                  </Link>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {q.tierCount} tiers ·{" "}
                    {q.record ? "recording on" : "recording off"}
                  </div>
                </div>
              </div>
              <div className="mono text-xs text-muted-foreground">
                {q.extension}
              </div>
              <div className="text-xs text-muted-foreground">{q.strategy}</div>
              <div className="mono text-xs font-medium">
                {q.answered}{" "}
                <span className="font-sans text-[10px] text-muted-foreground">
                  answered
                </span>
              </div>
              <div className="flex items-center gap-1 sm:justify-end">
                <Link
                  href={`/campaigns/${q.extension}`}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                  aria-label="Edit campaign"
                  data-testid={`button-edit-campaign-${q.extension}`}
                >
                  <Pencil size={14} />
                </Link>
                <button
                  onClick={() => deleteQueue(q)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete campaign"
                  data-testid={`button-delete-campaign-${q.extension}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </PageFrame>
  );
}

export function CampaignDetailPage() {
  const { extension } = useParams<{ extension: string }>();
  const { data } = useQueues(domain());
  const queue = data?.find((q) => q.extension === extension);
  return (
    <PageFrame
      eyebrow="Campaign / queue detail"
      title={queue?.name || `Campaign ${extension}`}
      detail="Review the queue contract before changing how calls move."
      action={
        <Link
          href="/campaigns"
          className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary"
          data-testid="link-back-campaign-detail"
        >
          <ArrowLeft size={15} /> All campaigns
        </Link>
      }
    >
      {queue ? (
        <QueueForm initial={queue} onDone={() => window.history.back()} />
      ) : (
        <EmptyState
          title="Campaign not found"
          detail="This extension may have been removed or belongs to another workspace."
        />
      )}
    </PageFrame>
  );
}

function AgentForm({
  initial,
  onDone,
}: {
  initial?: Agent;
  onDone: () => void;
}) {
  const save = useSaveAgent(domain());
  const [name, setName] = useState(initial?.name || "");
  const [id, setId] = useState(initial?.agent_id || "");
  const [status, setStatus] = useState(initial?.status || "active");
  const [timeout, setTimeoutValue] = useState(
    String(initial?.call_timeout || 30),
  );
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="eyebrow text-primary">
            {initial ? "Edit agent" : "Add agent"}
          </div>
          <h2 className="mt-1 text-lg font-extrabold">
            {initial?.name || "New floor agent"}
          </h2>
        </div>
        <button
          onClick={onDone}
          className="rounded-lg p-2 hover:bg-muted"
          data-testid="button-close-agent-form"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold">
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="input-agent-name"
          />
        </label>
        <label className="text-xs font-bold">
          Agent ID
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mono mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="input-agent-id"
          />
        </label>
        <label className="text-xs font-bold">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="select-agent-status"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="offline">Offline</option>
          </select>
        </label>
        <label className="text-xs font-bold">
          Call timeout (seconds)
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeoutValue(e.target.value)}
            className="mono mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            data-testid="input-agent-timeout"
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onDone}
          className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          data-testid="button-cancel-agent"
        >
          Cancel
        </button>
        <button
          disabled={!name || !id || save.isPending}
          onClick={() =>
            save.mutate(
              {
                ...(initial || {}),
                name,
                agent_id: id,
                status,
                call_timeout: Number(timeout),
                domain_name: domain(),
                uuid: initial?.uuid || `a-${Date.now()}`,
              },
              { onSuccess: onDone },
            )
          }
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
          data-testid="button-save-agent"
        >
          {save.isPending ? (
            <Spinner label="Saving" />
          ) : (
            <>
              <Save size={14} className="mr-2 inline" />
              Save agent
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
export function AgentsPage() {
  const { data, isLoading, refetch } = useAgents(domain());
  const remove = useDeleteAgent(domain());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [editing, setEditing] = useState<Agent | "new" | null>(null);
  const agents = (data || []).filter(
    (a) =>
      `${a.name} ${a.agent_id}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || a.status === filter),
  );
  if (editing)
    return (
      <PageFrame
        eyebrow="Agent directory"
        title={editing === "new" ? "Add agent" : `Edit ${editing.name}`}
        detail="Keep identity and floor behavior aligned with the carrier contract."
        action={
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary"
            data-testid="button-back-agent-list"
          >
            <ArrowLeft size={15} /> Back to agents
          </button>
        }
      >
        <AgentForm
          initial={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      </PageFrame>
    );
  return (
    <PageFrame
      eyebrow="People on the floor"
      title="Agents"
      detail="Search the roster, inspect presence, and safely update operating status."
      action={
        <button
          onClick={() => setEditing("new")}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground"
          data-testid="button-create-agent"
        >
          <Plus size={15} className="mr-2 inline" />
          Add agent
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full max-w-sm">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search agents"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold"
          data-testid="select-agent-filter"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="offline">Offline</option>
        </select>
        <div className="ml-auto flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setView("table")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${view === "table" ? "bg-secondary text-primary" : "text-muted-foreground"}`}
            data-testid="button-agent-table-view"
          >
            Table
          </button>
          <button
            onClick={() => setView("cards")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${view === "cards" ? "bg-secondary text-primary" : "text-muted-foreground"}`}
            data-testid="button-agent-card-view"
          >
            Cards
          </button>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-primary"
          data-testid="button-refresh-agents"
        >
          <RefreshCw size={15} />
        </button>
      </div>
      {isLoading ? (
        <Card className="space-y-3 p-5">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </Card>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agents match"
          detail="Try a different status or add a new floor agent."
        />
      ) : view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <Card className="p-5" key={a.uuid} testId={`card-agent-${a.uuid}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">
                    {a.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div>
                    <Link
                      href={`/agents/${a.uuid}`}
                      className="text-sm font-extrabold hover:text-primary"
                      data-testid={`link-agent-card-${a.uuid}`}
                    >
                      {a.name}
                    </Link>
                    <div className="mono mt-1 text-[10px] text-muted-foreground">
                      {a.agent_id}
                    </div>
                  </div>
                </div>
                <StatusPill status={a.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/70 p-2.5">
                  <div className="eyebrow text-muted-foreground">Presence</div>
                  <div className="mt-1 font-bold">{a.call_status}</div>
                </div>
                <div className="rounded-lg bg-muted/70 p-2.5">
                  <div className="eyebrow text-muted-foreground">Position</div>
                  <div className="mono mt-1 font-medium">#{a.position}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-1">
                <button
                  onClick={() => setEditing(a)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                  data-testid={`button-edit-agent-${a.uuid}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() =>
                    window.confirm(`Delete ${a.name}?`) &&
                    remove.mutate({ uuid: a.uuid })
                  }
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  data-testid={`button-delete-agent-${a.uuid}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.5fr_125px_110px_110px_105px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground sm:grid">
            <span>Agent</span>
            <span>Presence</span>
            <span>Position</span>
            <span>Status</span>
            <span />
          </div>
          {agents.map((a) => (
            <div
              key={a.uuid}
              className="grid gap-3 border-b border-border px-5 py-4 last:border-0 sm:grid-cols-[1.5fr_125px_110px_110px_105px] sm:items-center sm:gap-4"
              data-testid={`row-agent-${a.uuid}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[10px] font-extrabold text-secondary-foreground">
                  {a.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </div>
                <div>
                  <Link
                    href={`/agents/${a.uuid}`}
                    className="text-sm font-extrabold hover:text-primary"
                    data-testid={`link-agent-${a.uuid}`}
                  >
                    {a.name}
                  </Link>
                  <div className="mono mt-1 text-[10px] text-muted-foreground">
                    {a.agent_id}
                  </div>
                </div>
              </div>
              <StatusPill status={a.call_status} />
              <div className="mono text-xs text-muted-foreground">
                #{a.position}
              </div>
              <StatusPill status={a.status} />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditing(a)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                  data-testid={`button-edit-agent-row-${a.uuid}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() =>
                    window.confirm(`Delete ${a.name}?`) &&
                    remove.mutate({ uuid: a.uuid })
                  }
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  data-testid={`button-delete-agent-row-${a.uuid}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </PageFrame>
  );
}

export function AgentDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { data } = useAgents(domain());
  const agent = data?.find((a) => a.uuid === uuid);
  if (!agent)
    return (
      <PageFrame
        eyebrow="Agent profile"
        title="Agent not found"
        detail="The agent may have moved to another workspace."
      >
        <EmptyState
          title="No profile available"
          detail="Return to the directory to choose another agent."
          action={
            <Link
              href="/agents"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
              data-testid="link-return-agents"
            >
              Return to agents
            </Link>
          }
        />
      </PageFrame>
    );
  return (
    <PageFrame
      eyebrow="Agent profile"
      title={agent.name}
      detail={`${agent.agent_id} · ${domain()}`}
      action={
        <Link
          href="/agents"
          className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary"
          data-testid="link-back-agent-detail"
        >
          <ArrowLeft size={15} /> All agents
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[.82fr_1.4fr]">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-lg font-extrabold text-secondary-foreground">
              {agent.name
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </div>
            <div>
              <StatusPill status={agent.status} />
              <h2 className="mt-2 text-xl font-extrabold">{agent.name}</h2>
              <div className="mono mt-1 text-[11px] text-muted-foreground">
                {agent.agent_id}
              </div>
            </div>
          </div>
          <div className="mt-7 space-y-3 border-t border-border pt-5">
            {[
              ["Current presence", agent.call_status],
              ["Last signal", agent.last_active],
              ["Floor position", `#${agent.position}`],
              ["Agent type", agent.type],
            ].map(([label, value]) => (
              <div className="flex justify-between text-xs" key={label}>
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
          <Link
            href="/agents"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-extrabold hover:border-primary hover:text-primary"
            data-testid="link-edit-agent-profile"
          >
            <Pencil size={14} /> Edit in directory
          </Link>
        </Card>
        <Card className="p-6">
          <div className="eyebrow text-muted-foreground">Configuration</div>
          <h2 className="mt-1 text-base font-extrabold">
            Call handling defaults
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Call timeout", `${agent.call_timeout || 30}s`],
              ["Wrap-up window", `${agent.wrap_up_time || 45}s`],
              ["No-answer limit", "3 tries"],
            ].map(([label, value]) => (
              <div className="rounded-xl bg-muted/65 p-4" key={label}>
                <div className="eyebrow text-muted-foreground">{label}</div>
                <div className="mono mt-2 text-lg">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-accent/50 bg-accent/15 p-4 text-xs leading-5 text-[hsl(155,50%,28%)]">
            <Check size={15} className="mr-2 inline" />
            This agent is currently assigned to the standard rotation and can
            receive calls.
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}

export function TiersPage() {
  const { data: queues } = useQueues(domain());
  const { data: agents } = useAgents(domain());
  const [queue, setQueue] = useState("");
  const { data: tiers } = useTiers(domain(), queue);
  const { data: selectionScores } = useSelectionScores(domain(), queue);
  const selectionByAgent = new Map(
    (selectionScores || []).map((entry) => [entry.agentUuid, entry]),
  );
  const tierAgentByUuid = new Map(
    (tiers || []).flatMap((tier) => Object.entries(tier.agentDetails || {})),
  );
  const isEligible = (uuid: string) => {
    const tierAgent = tierAgentByUuid.get(uuid);
    if (!tierAgent) return false;
    return ["available", "ready"].includes(tierAgent.status.toLowerCase()) && tierAgent.call_status.toLowerCase() === "idle";
  };
  const eligibleCandidateNumber = new Map(
    (selectionScores || [])
      .filter((entry) => isEligible(entry.agentUuid))
      .map((entry, index) => [entry.agentUuid, index + 1]),
  );
  const update = useUpdateTier(domain());
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!queue && queues?.[0]?.extension) setQueue(queues[0].extension);
  }, [queue, queues]);
  const toggle = (uuid: string) =>
    setSelected((current) =>
      current.includes(uuid)
        ? current.filter((x) => x !== uuid)
        : [...current, uuid],
    );
  return (
    <PageFrame
      eyebrow="Routing control"
      title="Tiers & routing"
      detail="Decide who receives the next call, without losing the shape of the queue."
      action={
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-accent" /> Changes are staged
          locally
        </div>
      }
    >
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="eyebrow text-muted-foreground">Campaign scope</div>
            <h2 className="mt-1 text-base font-extrabold">
              Choose a campaign to route
            </h2>
          </div>
          <select
            value={queue}
            onChange={(e) => setQueue(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold sm:w-64"
            data-testid="select-tier-campaign"
          >
            {(queues || []).map((q) => (
              <option key={q.extension} value={q.extension}>
                {q.name} · {q.extension}
              </option>
            ))}
          </select>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="eyebrow text-muted-foreground">Priority ladder</div>
            <h2 className="mt-1 text-base font-extrabold">Agent membership</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag-and-drop is ready for the routing API; use arrows to adjust
              position for now.
            </p>
            <p className="mt-2 text-[11px] font-semibold text-primary">
              Candidate order: lower scores are checked first. Selection still requires tier membership, Available/Ready status, Idle call status, and a successful reservation.
            </p>
          </div>
          <div className="divide-y divide-border">
            {(tiers || []).map((tier) => (
              <div
                className="p-5"
                key={tier.id}
                data-testid={`tier-${tier.id}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground">
                      {tier.level}
                    </span>
                    <div>
                      <div className="text-sm font-extrabold">{tier.name}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {tier.agents.length} members ·{" "}
                        <span className="capitalize">{tier.state}</span>
                      </div>
                    </div>
                  </div>
                  <StatusPill
                    status={tier.state === "active" ? "active" : "standby"}
                  />
                </div>
                <div className="space-y-2">
                  {tier.agents.map((uuid, index) => {
                    const agent = agents?.find((a) => a.uuid === uuid);
                    const tierAgent = tier.agentDetails?.[uuid];
                    const selection = selectionByAgent.get(uuid);
                    const candidateNumber = eligibleCandidateNumber.get(uuid);
                    return agent ? (
                      <div
                        className={`flex items-center gap-3 rounded-xl border p-3 ${selected.includes(uuid) ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
                        key={uuid}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(uuid)}
                          onChange={() => toggle(uuid)}
                          className="h-4 w-4 accent-primary"
                          data-testid={`checkbox-tier-agent-${uuid}`}
                        />
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-[9px] font-extrabold">
                          {agent.name
                            .split(" ")
                            .map((x) => x[0])
                            .join("")}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold">{agent.name}</div>
                          <div className="mono text-[10px] text-muted-foreground">
                            {agent.agent_id}
                          </div>
                          {tierAgent && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <StatusPill status={tierAgent.status} />
                              <StatusPill status={tierAgent.call_status} />
                            </div>
                          )}
                        </div>
                        <span className="mono text-[10px] text-muted-foreground">
                          pos {tierAgent?.position ?? index + 1}
                        </span>
                        {selection && (
                          <div className="min-w-[118px] text-right">
                            <div className={`text-[10px] font-extrabold ${selection.rank === 1 ? "text-[hsl(155,50%,28%)]" : "text-primary"}`}>
                              {candidateNumber ? `Candidate #${candidateNumber}` : "Not eligible"}
                            </div>
                            <div className="mono mt-1 text-[9px] text-muted-foreground" title={String(selection.score)}>
                              score {selection.score.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className={`mt-1 text-[9px] font-bold ${isEligible(uuid) ? "text-[hsl(155,50%,28%)]" : "text-destructive"}`}>
                              {isEligible(uuid) ? "Eligible now" : "Not eligible now"}
                            </div>
                          </div>
                        )}
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                          data-testid={`button-tier-up-${uuid}`}
                          aria-label="Move agent up"
                        >
                          <ChevronDown size={14} className="rotate-180" />
                        </button>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                          data-testid={`button-tier-down-${uuid}`}
                          aria-label="Move agent down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="eyebrow text-muted-foreground">Queue candidates</div>
            <h2 className="mt-1 text-base font-extrabold">Candidate order</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              All {(selectionScores || []).length} Redis members in score order. Only currently eligible agents are numbered; reservation state is checked when a call is assigned.
            </p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {(selectionScores || []).map((selection) => {
                const rankedAgent = agents?.find((agent) => agent.uuid === selection.agentUuid);
                const candidateNumber = eligibleCandidateNumber.get(selection.agentUuid);
                return (
                  <div key={selection.agentUuid} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold ${selection.rank === 1 ? "bg-accent/30 text-[hsl(155,50%,28%)]" : "bg-muted text-muted-foreground"}`}>
                      {candidateNumber || "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold">{rankedAgent?.name || "Agent not in directory"}</div>
                      <div className="mono mt-1 truncate text-[9px] text-muted-foreground" title={selection.agentUuid}>{rankedAgent?.agent_id || selection.agentUuid}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[9px] font-extrabold ${selection.rank === 1 ? "text-[hsl(155,50%,28%)]" : "text-primary"}`}>
                        {candidateNumber ? `Candidate #${candidateNumber}` : "Not numbered"}
                      </div>
                      <div className="mono mt-1 text-[8px] text-muted-foreground" title={String(selection.score)}>
                        {selection.score.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className={`mt-1 text-[8px] font-bold ${isEligible(selection.agentUuid) ? "text-[hsl(155,50%,28%)]" : "text-destructive"}`}>
                        {tierAgentByUuid.has(selection.agentUuid) ? (isEligible(selection.agentUuid) ? "Eligible" : "Not eligible") : "Not in tiers"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <div className="eyebrow text-muted-foreground">Add members</div>
            <h2 className="mt-1 text-base font-extrabold">Available agents</h2>
            <div className="mt-4 space-y-2">
              {(agents || [])
                .filter((a) => !selected.includes(a.uuid))
                .slice(0, 5)
                .map((a) => (
                  <button
                    onClick={() => toggle(a.uuid)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-primary"
                    key={a.uuid}
                    data-testid={`button-add-tier-agent-${a.uuid}`}
                  >
                    <Plus size={14} className="text-primary" />
                    <span className="flex-1 text-xs font-bold">{a.name}</span>
                    <span className="mono text-[10px] text-muted-foreground">
                      {a.position}
                    </span>
                  </button>
                ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="eyebrow text-muted-foreground">Change review</div>
            <div className="mt-2 text-sm font-extrabold">
              {selected.length} agents selected
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Changes apply to{" "}
              {queues?.find((q) => q.extension === queue)?.name ||
                "selected campaign"}{" "}
              only.
            </p>
            {notice && (
              <div
                className="mt-3 rounded-lg bg-accent/20 p-2 text-xs font-bold text-[hsl(155,50%,28%)]"
                data-testid="status-tier-notice"
              >
                {notice}
              </div>
            )}
            <button
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { campaign_id: queue, agent_uuids: selected },
                  { onSuccess: () => setNotice("Routing membership saved") },
                )
              }
              className="mt-5 w-full rounded-xl bg-primary py-3 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
              data-testid="button-save-tier-changes"
            >
              {update.isPending ? (
                <Spinner label="Saving" />
              ) : (
                <>
                  <Save size={14} className="mr-2 inline" />
                  Save routing changes
                </>
              )}
            </button>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

const ABANDONED_GROUP = "__ABANDONED_GROUP__";
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function CallRecordsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState(() =>
    toLocalInputValue(new Date(Date.now() - 30 * 86400000)),
  );
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const toIso = (value: string) => (value ? new Date(value).toISOString() : "");
  const dateFromIso = toIso(dateFrom);
  const dateToIso = toIso(dateTo);
  const { data, isLoading, isError, refetch } = useCdr({
    domain: domain(),
    search: query,
    status,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
    page,
  });
  const { data: summary } = useCdrSummary({
    domain: domain(),
    search: query,
    status: "",
    dateFrom: dateFromIso,
    dateTo: dateToIso,
  });
  const records = data?.records || [];
  const byStatus = summary?.byStatus || [];
  const total = summary?.total || 0;
  const withAgent = summary?.withAgent || 0;
  const connectedCount = byStatus
    .filter((s) => s.status.toLowerCase().includes("connect"))
    .reduce((sum, s) => sum + s.count, 0);
  const abandonedCount = byStatus
    .filter((s) => s.status.toLowerCase().includes("abandon"))
    .reduce((sum, s) => sum + s.count, 0);
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}% of total` : "—");
  const applyPreset = (presetDays: number | null) => {
    setPage(1);
    if (presetDays === null) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const from =
      presetDays === 0
        ? (() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
          })()
        : new Date(Date.now() - presetDays * 86400000);
    setDateFrom(toLocalInputValue(from));
    setDateTo("");
  };
  const exportCsv = () => {
    const quote = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = records.map((record) =>
      [
        record.id,
        record.customer_number,
        record.queue_extension,
        record.queue_name,
        record.connected_agent_id,
        record.final_status,
        record.final_reason,
        record.entered_queue_at,
        record.completed_at,
      ]
        .map(quote)
        .join(","),
    );
    const csv = [
      "id,customer_number,queue_extension,queue_name,agent_id,status,reason,entered_at,completed_at",
      ...rows,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nubitel-call-records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  if (isError)
    return (
      <PageFrame
        eyebrow="Call reporting"
        title="Call records unavailable"
        detail="The local reporting API did not respond."
      >
        <EmptyState
          title="Could not load PostgreSQL CDR data"
          detail="Start the local API server with the DB environment variables, then try again."
          action={
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
            >
              Try again
            </button>
          }
        />
      </PageFrame>
    );
  return (
    <PageFrame
      eyebrow="Call reporting"
      title="Call records"
      detail={`${data?.total || 0} completed queue sessions for ${domain()}.`}
      action={
        <button
          disabled={!records.length}
          onClick={exportCsv}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold hover:border-primary disabled:opacity-50"
          data-testid="button-export-csv"
        >
          <Download size={14} className="mr-2 inline" />
          Export page
        </button>
      }
    >
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="max-w-sm flex-1">
            <SearchBox
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Number, queue, agent or call UUID"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-input bg-card px-3 text-xs font-bold"
          >
            <option value="">All statuses</option>
            <option value={ABANDONED_GROUP}>Abandoned (any reason)</option>
            {byStatus.length > 0 ? (
              byStatus.map((s) => (
                <option key={s.status} value={s.status}>
                  {humanize(s.status)} ({s.count})
                </option>
              ))
            ) : (
              <>
                <option value="CONNECTED">Connected</option>
                <option value="ABANDONED">Abandoned</option>
                <option value="FAILED">Failed</option>
              </>
            )}
          </select>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex gap-1.5">
            {[
              { label: "Today", days: 0 },
              { label: "7 days", days: 7 },
              { label: "30 days", days: 30 },
              { label: "All time", days: null },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary"
                data-testid={`button-preset-${preset.label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            From
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground"
              data-testid="input-record-date-from"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            To
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground"
              data-testid="input-record-date-to"
            />
          </label>
        </div>
      </Card>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total calls" value={fmt(total)} trend="in range" icon={Phone} />
        <Metric
          label="With agent"
          value={fmt(withAgent)}
          trend={pct(withAgent)}
          icon={UsersRound}
          accent="lime"
        />
        <Metric
          label="Connected"
          value={fmt(connectedCount)}
          trend={pct(connectedCount)}
          icon={PhoneCall}
          accent="lime"
        />
        <Metric
          label="Abandoned"
          value={fmt(abandonedCount)}
          trend={pct(abandonedCount)}
          icon={PhoneOff}
        />
      </div>
      {summary && summary.byReason.length > 0 && (
        <Card className="mb-5 overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="eyebrow text-muted-foreground">
              Disposition detail
            </div>
            <h2 className="mt-1 text-base font-extrabold">
              Reasons behind these outcomes
            </h2>
          </div>
          <div className="divide-y divide-border">
            {summary.byReason.map((r) => (
              <div
                key={r.reason}
                className="flex items-center justify-between px-5 py-3 text-xs"
                data-testid={`row-reason-${r.reason}`}
              >
                <span className="text-muted-foreground">{humanize(r.reason)}</span>
                <span className="mono font-bold">
                  {fmt(r.count)}{" "}
                  <span className="font-sans text-[10px] text-muted-foreground">
                    ({pct(r.count)})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {isLoading ? (
        <Card className="space-y-3 p-5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </Card>
      ) : records.length === 0 ? (
        <EmptyState
          title="No call records found"
          detail="Try a wider date range or remove the current filters."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_100px_1fr_110px_150px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground md:grid">
            <span>Customer / queue</span>
            <span>Extension</span>
            <span>Agent</span>
            <span>Status</span>
            <span>Completed</span>
          </div>
          {records.map((record) => (
            <div
              key={record.queue_session_uuid}
              className="border-b border-border last:border-0"
            >
              <button
                onClick={() =>
                  setExpanded(
                    expanded === record.queue_session_uuid
                      ? null
                      : record.queue_session_uuid,
                  )
                }
                className="grid w-full gap-2 px-5 py-4 text-left md:grid-cols-[1fr_100px_1fr_110px_150px] md:items-center md:gap-4"
              >
                <div>
                  <div className="text-sm font-extrabold">
                    {record.customer_number || "Unknown caller"}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {record.queue_name || `Queue ${record.queue_extension}`}
                  </div>
                </div>
                <span className="mono text-xs">{record.queue_extension}</span>
                <span className="mono text-xs text-muted-foreground">
                  {record.connected_agent_id || "Unassigned"}
                </span>
                <StatusPill status={record.final_status.toLowerCase()} />
                <span className="text-xs text-muted-foreground">
                  {new Date(record.completed_at).toLocaleString()}
                </span>
              </button>
              {expanded === record.queue_session_uuid && (
                <div className="grid gap-3 border-t border-border bg-muted/30 px-5 py-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <div className="mt-1 font-bold">
                      {record.final_reason || "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attempts</span>
                    <div className="mt-1 font-bold">
                      {record.total_attempts}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Call UUID</span>
                    <div className="mono mt-1 break-all">
                      {record.call_uuid}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {data?.page || 1} of {data?.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-border px-3 py-2 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= (data?.totalPages || 1)}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-border px-3 py-2 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </PageFrame>
  );
}

export function SystemSyncPage() {
  const sync = useSync();
  const [history, setHistory] = useState<
    { direction: string; at: string; result: string }[]
  >([]);
  const [running, setRunning] = useState("");
  const run = (direction: "db-to-redis" | "redis-to-db") => {
    if (
      !window.confirm(
        `Run ${direction} now? This can update shared operational state.`,
      )
    )
      return;
    setRunning(direction);
    sync.mutate(direction, {
      onSuccess: (result) => {
        setHistory((h) => [
          {
            direction,
            at: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            result: (result as { result?: string }).result || "completed",
          },
          ...h,
        ]);
        setRunning("");
      },
      onError: () => setRunning(""),
    });
  };
  return (
    <PageFrame
      eyebrow="Protected admin surface"
      title="System sync"
      detail="Reconcile the database and Redis deliberately. Every run is explicit and visible in this browser session."
      action={
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/8 px-3 py-2 text-xs font-bold text-primary">
          <ServerCog size={14} /> Supervisor control
        </div>
      }
    >
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
        <strong className="font-extrabold">Shared state warning.</strong> Sync
        changes can affect active routing. Run only when the floor is stable and
        a supervisor has approved it.
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
              <DatabaseIcon direction="right" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">DB to Redis</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Push authoritative records to the live state store.
              </p>
            </div>
          </div>
          <button
            disabled={!!running}
            onClick={() => run("db-to-redis")}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
            data-testid="button-sync-db-redis"
          >
            {running === "db-to-redis" ? (
              <Spinner label="Syncing records" />
            ) : (
              <>
                <Play size={14} className="mr-2 inline" />
                Run database sync
              </>
            )}
          </button>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/30 text-[hsl(155,50%,28%)]">
              <DatabaseIcon direction="left" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">Redis to DB</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Persist live operational changes back to storage.
              </p>
            </div>
          </div>
          <button
            disabled={!!running}
            onClick={() => run("redis-to-db")}
            className="mt-6 w-full rounded-xl border border-border bg-card py-3 text-xs font-extrabold hover:border-primary hover:text-primary disabled:opacity-50"
            data-testid="button-sync-redis-db"
          >
            {running === "redis-to-db" ? (
              <Spinner label="Syncing records" />
            ) : (
              <>
                <Play size={14} className="mr-2 inline" />
                Run Redis sync
              </>
            )}
          </button>
        </Card>
      </div>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="eyebrow text-muted-foreground">Browser session</div>
          <h2 className="mt-1 text-base font-extrabold">Recent sync history</h2>
        </div>
        {history.length === 0 ? (
          <div
            className="p-5 text-xs text-muted-foreground"
            data-testid="empty-sync-history"
          >
            No syncs run in this browser session.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((item, i) => (
              <div
                className="flex items-center gap-3 p-4 text-xs"
                key={`${item.at}-${i}`}
              >
                <Check size={15} className="text-[hsl(155,50%,28%)]" />
                <span className="flex-1 font-bold">{item.direction}</span>
                <span className="mono text-muted-foreground">{item.at}</span>
                <StatusPill status={item.result} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageFrame>
  );
}
function DatabaseIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <div className="flex items-center gap-0.5">
      <Database size={18} />
      <ChevronRight
        size={12}
        className={direction === "left" ? "rotate-180" : ""}
      />
    </div>
  );
}

export function SettingsPage() {
  const [base, setBase] = useState(
    () =>
      localStorage.getItem("nubitel-api-base") ||
      import.meta.env.VITE_API_BASE_URL ||
      "https://cxdev-dialplan-api.nubitel.io",
  );
  const [selectedDomain, setSelectedDomain] = useState(getSelectedDomain);
  const [interval, setIntervalValue] = useState(
    () => localStorage.getItem("nubitel-refresh") || "30",
  );
  const [mock, setMock] = useState(
    () => localStorage.getItem("nubitel-mock") !== "false",
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nubitel-theme") || "light",
  );
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();
  const save = () => {
    localStorage.setItem("nubitel-api-base", base);
    localStorage.setItem("nubitel-domain", selectedDomain);
    localStorage.setItem("nubitel-refresh", interval);
    localStorage.setItem("nubitel-mock", String(mock));
    localStorage.setItem("nubitel-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  return (
    <PageFrame
      eyebrow="Workspace preferences"
      title="Settings"
      detail="Tune this browser's connection and presentation without touching shared infrastructure."
      action={
        <button
          onClick={save}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground"
          data-testid="button-save-settings"
        >
          <Save size={14} className="mr-2 inline" />
          Save preferences
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.8fr]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="eyebrow text-muted-foreground">Connection</div>
            <h2 className="mt-1 text-base font-extrabold">API and workspace</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold">
                API base URL
                <input
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  className="mono mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-xs"
                  data-testid="input-api-base-url"
                />
              </label>
              <label className="block text-xs font-bold">
                Default domain
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="mono mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-xs"
                  data-testid="select-default-domain"
                >
                  {availableDomains.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <div className="text-xs font-bold">Mock API</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Use realistic local data and simulated latency
                  </div>
                </div>
                <button
                  onClick={() => setMock(!mock)}
                  className={`h-6 w-11 rounded-full p-1 ${mock ? "bg-primary" : "bg-muted"}`}
                  aria-label="Toggle mock API"
                  data-testid="switch-mock-api"
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-card transition-transform ${mock ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="eyebrow text-muted-foreground">
              Polling behavior
            </div>
            <h2 className="mt-1 text-base font-extrabold">Refresh interval</h2>
            <div className="mt-5 flex items-center gap-3">
              <select
                value={interval}
                onChange={(e) => setIntervalValue(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold"
                data-testid="select-refresh-interval"
              >
                <option value="1">1 second</option>
                <option value="2">2 seconds</option>
                <option value="3">3 seconds</option>
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
                <option value="0">Manual only</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Overview and Live operations only
              </span>
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="eyebrow text-muted-foreground">Appearance</div>
            <h2 className="mt-1 text-base font-extrabold">Theme</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["light", "dark"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTheme(item)}
                  className={`rounded-xl border p-3 text-left ${theme === item ? "border-primary bg-primary/8" : "border-border"}`}
                  data-testid={`button-theme-${item}`}
                >
                  <div
                    className={`mb-3 h-12 rounded-lg ${item === "light" ? "bg-[hsl(224,33%,96%)]" : "bg-[hsl(225,39%,10%)]"}`}
                  />
                  <div className="text-xs font-extrabold capitalize">
                    {item}
                  </div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="eyebrow text-muted-foreground">Diagnostics</div>
            <h2 className="mt-1 text-base font-extrabold">Health check</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Test the configured API without changing any records.
            </p>
            <button
              onClick={() => window.alert(`Health check queued for ${base}`)}
              className="mt-4 w-full rounded-xl border border-border bg-card py-2.5 text-xs font-extrabold hover:border-primary hover:text-primary"
              data-testid="button-test-health"
            >
              <Wifi size={14} className="mr-2 inline" />
              Test API connection
            </button>
            <a
              href={`${base}/swagger/index.html`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-extrabold text-primary hover:underline"
              data-testid="link-swagger"
            >
              Open Swagger documentation <ExternalLink size={13} />
            </a>
            <button
              onClick={() => {
                localStorage.clear();
                setLocation("/");
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 border-t border-border pt-4 text-xs font-bold text-destructive"
              data-testid="button-clear-preferences"
            >
              <Trash2 size={13} /> Clear local preferences
            </button>
          </Card>
          {saved && (
            <div
              className="rounded-xl bg-accent/25 px-4 py-3 text-xs font-bold text-[hsl(155,50%,28%)]"
              data-testid="status-settings-saved"
            >
              <Check size={14} className="mr-2 inline" />
              Preferences saved for this browser.
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
