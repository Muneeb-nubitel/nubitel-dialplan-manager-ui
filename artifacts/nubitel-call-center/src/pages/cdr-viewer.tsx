import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  LockKeyhole,
  LogOut,
  Mic,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Phone,
  RefreshCw,
  Search,
} from 'lucide-react';
import { EmptyState, Skeleton, Spinner } from '@/components/ui-primitives';
import { CdrApiError, cdrToken, cdrViewerApi, type CdrFilters, type CdrItem } from '@/lib/api/cdrViewerApi';

/* ---------- small helpers ---------- */

const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

const duration = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

type CallStatus = 'Answered' | 'Missed' | 'Not answered';
const statusOf = (c: Pick<CdrItem, 'answer_stamp' | 'missed_call'>): CallStatus =>
  c.missed_call ? 'Missed' : c.answer_stamp ? 'Answered' : 'Not answered';

function StatusBadge({ item }: { item: CdrItem }) {
  const status = statusOf(item);
  const tone =
    status === 'Answered' ? 'bg-accent/25 text-[hsl(155,50%,28%)]' : status === 'Missed' ? 'bg-destructive/15 text-destructive' : 'bg-amber-100 text-amber-800';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function DirectionIcon({ item }: { item: CdrItem }) {
  if (item.missed_call) return <PhoneMissed size={15} className="text-destructive" />;
  if (item.direction === 'inbound') return <PhoneIncoming size={15} className="text-primary" />;
  if (item.direction === 'outbound') return <PhoneOutgoing size={15} className="text-muted-foreground" />;
  return <Phone size={15} className="text-muted-foreground" />;
}

function Frame({ title, detail, action, children }: { title: string; detail: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow text-primary">Call detail records</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-foreground sm:text-[30px]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{detail}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`surface rounded-2xl ${className}`}>{children}</section>
);

const inputClass = 'h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary';
const buttonClass = 'inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold hover:border-primary disabled:opacity-50';

/* ---------- sign-in ---------- */

const SessionContext = createContext<{ signOut: () => void }>({ signOut: () => {} });
const useCdrSession = () => useContext(SessionContext);

function SignIn({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await cdrViewerApi.login(username.trim(), password);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame title="Call records" detail="Sign in with the internal CDR viewer account to see call detail records.">
      <Panel className="mx-auto max-w-sm p-6">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
          <LockKeyhole size={19} />
        </div>
        <form onSubmit={submit} className="space-y-3" data-testid="form-cdr-login">
          <label className="block text-xs font-bold">
            User name
            <input className={`${inputClass} mt-1`} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus data-testid="input-cdr-user" />
          </label>
          <label className="block text-xs font-bold">
            Password
            <input className={`${inputClass} mt-1`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="input-cdr-password" />
          </label>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" role="alert" data-testid="text-cdr-login-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !username || !password} className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50" data-testid="button-cdr-login">
            {busy ? <Spinner label="Signing in" /> : 'Sign in'}
          </button>
        </form>
      </Panel>
    </Frame>
  );
}

function CdrGate({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => cdrToken.get() !== null);
  const signOut = () => {
    cdrViewerApi.logout();
    setSignedIn(false);
  };
  if (!signedIn) return <SignIn onDone={() => setSignedIn(true)} />;
  return <SessionContext.Provider value={{ signOut }}>{children}</SessionContext.Provider>;
}

function SignOutButton() {
  const { signOut } = useCdrSession();
  return (
    <button onClick={signOut} className={buttonClass} data-testid="button-cdr-logout">
      <LogOut size={14} /> Sign out
    </button>
  );
}

/* a 401 from any request means the token expired: go back to the sign-in form */
function useSignOutOn401(error: unknown) {
  const { signOut } = useCdrSession();
  useEffect(() => {
    if (error instanceof CdrApiError && error.status === 401) signOut();
  }, [error, signOut]);
}

/* ---------- list ---------- */

const PRESETS = [
  { value: '1h', label: 'Last hour', hours: 1 },
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { value: '30d', label: 'Last 30 days', hours: 24 * 30 },
  { value: 'custom', label: 'Custom range', hours: 0 },
];

type Form = {
  preset: string;
  customFrom: string;
  customTo: string;
  number: string;
  direction: string;
  status: string;
  recording: string;
  hangup_cause: string;
  queue: string;
  agent: string;
  domain: string;
};

const emptyForm: Form = { preset: '24h', customFrom: '', customTo: '', number: '', direction: '', status: '', recording: '', hangup_cause: '', queue: '', agent: '', domain: '' };

/** Turns the form into API filters. The time window is measured when Apply is pressed. */
function toFilters(form: Form): CdrFilters {
  const filters: CdrFilters = {
    number: form.number.trim(),
    direction: form.direction,
    hangup_cause: form.hangup_cause.trim(),
    queue: form.queue.trim(),
    agent: form.agent.trim(),
    domain: form.domain.trim(),
    has_recording: form.recording,
  };
  if (form.status === 'answered') filters.answered = 'true';
  if (form.status === 'missed') filters.missed = 'true';
  if (form.status === 'unanswered') filters.answered = 'false';

  if (form.preset === 'custom') {
    if (form.customFrom) filters.from = new Date(form.customFrom).toISOString();
    if (form.customTo) filters.to = new Date(form.customTo).toISOString();
  } else {
    const hours = PRESETS.find((p) => p.value === form.preset)?.hours ?? 24;
    filters.from = new Date(Date.now() - hours * 3600_000).toISOString();
  }
  return filters;
}

function exportCsv(items: CdrItem[]) {
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const header = 'uuid,start,direction,caller_number,caller_name,destination,queue,agent,status,duration_s,billsec_s,hangup_cause,recording';
  const rows = items.map((c) =>
    [c.uuid, c.start_stamp, c.direction, c.caller_id_number, c.caller_id_name, c.destination_number, c.cc_queue, c.cc_agent, statusOf(c), c.duration, c.billsec, c.hangup_cause, c.record_name].map(quote).join(','),
  );
  const url = URL.createObjectURL(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'nubitel-call-records.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function SortHeader({ label, column, sort, order, onSort, className = '' }: { label: string; column: string; sort: string; order: 'asc' | 'desc'; onSort: (column: string) => void; className?: string }) {
  const active = sort === column;
  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button onClick={() => onSort(column)} className="inline-flex items-center gap-1 font-extrabold uppercase tracking-[.08em] hover:text-foreground" data-testid={`sort-${column}`}>
        {label}
        {active && (order === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
}

function CdrRecordsInner() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<Form>(emptyForm);
  const [applied, setApplied] = useState<CdrFilters>(() => toFilters(emptyForm));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState('start_stamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cdr-list', applied, page, pageSize, sort, order],
    queryFn: () => cdrViewerApi.list({ ...applied, sort, order, limit: pageSize, offset: page * pageSize }),
    placeholderData: keepPreviousData,
    retry: false,
  });
  useSignOutOn401(error);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const apply = (event?: FormEvent) => {
    event?.preventDefault();
    setApplied(toFilters(form));
    setPage(0);
  };
  const reset = () => {
    setForm(emptyForm);
    setApplied(toFilters(emptyForm));
    setPage(0);
  };
  const onSort = (column: string) => {
    if (sort === column) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(column);
      setOrder('desc');
    }
    setPage(0);
  };

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, page * pageSize + items.length);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const select = (value: string, onChange: (v: string) => void, options: [string, string][], testId: string) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} data-testid={testId}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <Frame
      title="Call records"
      detail={data ? `${total.toLocaleString()} calls between ${dateTime(data.from)} and ${dateTime(data.to)}.` : 'Every call stored in v_xml_cdr, newest first.'}
      action={
        <div className="flex gap-2">
          <button onClick={() => exportCsv(items)} disabled={!items.length} className={buttonClass} data-testid="button-cdr-export">
            <Download size={14} /> Export page
          </button>
          <button onClick={() => refetch()} className={buttonClass} data-testid="button-cdr-refresh">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <SignOutButton />
        </div>
      }
    >
      <Panel className="mb-5 p-5">
        <form onSubmit={apply} className="space-y-3" data-testid="form-cdr-filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="Caller, destination or source number" className={`${inputClass} pl-9`} data-testid="input-cdr-number" />
            </div>
            {select(form.preset, (v) => set('preset', v), PRESETS.map((p) => [p.value, p.label]), 'select-cdr-range')}
            {select(form.direction, (v) => set('direction', v), [['', 'Any direction'], ['inbound', 'Inbound'], ['outbound', 'Outbound'], ['local', 'Local']], 'select-cdr-direction')}
          </div>
          {form.preset === 'custom' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold">
                From
                <input type="datetime-local" className={`${inputClass} mt-1`} value={form.customFrom} onChange={(e) => set('customFrom', e.target.value)} data-testid="input-cdr-from" />
              </label>
              <label className="text-xs font-bold">
                To
                <input type="datetime-local" className={`${inputClass} mt-1`} value={form.customTo} onChange={(e) => set('customTo', e.target.value)} data-testid="input-cdr-to" />
              </label>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {select(form.status, (v) => set('status', v), [['', 'Any outcome'], ['answered', 'Answered'], ['unanswered', 'Not answered'], ['missed', 'Missed']], 'select-cdr-status')}
            {select(form.recording, (v) => set('recording', v), [['', 'With or without recording'], ['true', 'Has recording'], ['false', 'No recording']], 'select-cdr-recording')}
            <input value={form.hangup_cause} onChange={(e) => set('hangup_cause', e.target.value)} placeholder="Hangup cause, e.g. NO_ANSWER" className={inputClass} data-testid="input-cdr-hangup" />
            <input value={form.queue} onChange={(e) => set('queue', e.target.value)} placeholder="Queue" className={inputClass} data-testid="input-cdr-queue" />
            <input value={form.agent} onChange={(e) => set('agent', e.target.value)} placeholder="Agent" className={inputClass} data-testid="input-cdr-agent" />
            <input value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="Domain (all if empty)" className={inputClass} data-testid="input-cdr-domain" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground" data-testid="button-cdr-apply">
              Apply filters
            </button>
            <button type="button" onClick={reset} className={buttonClass} data-testid="button-cdr-reset">
              Reset
            </button>
          </div>
        </form>
      </Panel>

      {error && !(error instanceof CdrApiError && error.status === 401) ? (
        <EmptyState
          title="Could not load call records"
          detail={error instanceof Error ? error.message : 'Unknown error'}
          action={
            <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground">
              Try again
            </button>
          }
        />
      ) : isLoading ? (
        <Panel className="space-y-3 p-5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </Panel>
      ) : items.length === 0 ? (
        <EmptyState title="No calls match" detail="Widen the time range or clear some filters." action={<button onClick={reset} className="rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground">Reset filters</button>} />
      ) : (
        <Panel className={`overflow-hidden transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm" data-testid="table-cdr">
              <thead className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                <tr>
                  <SortHeader label="Time" column="start_stamp" sort={sort} order={order} onSort={onSort} />
                  <th className="px-4 py-3 text-left font-extrabold uppercase tracking-[.08em]">Caller</th>
                  <SortHeader label="Destination" column="destination_number" sort={sort} order={order} onSort={onSort} />
                  <th className="px-4 py-3 text-left font-extrabold uppercase tracking-[.08em]">Queue / agent</th>
                  <SortHeader label="Duration" column="duration" sort={sort} order={order} onSort={onSort} />
                  <th className="px-4 py-3 text-left font-extrabold uppercase tracking-[.08em]">Outcome</th>
                  <th className="px-4 py-3 text-left font-extrabold uppercase tracking-[.08em]">Rec</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.uuid} onClick={() => navigate(`/cdr/${c.uuid}`)} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40" data-testid={`row-cdr-${c.uuid}`}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="mr-2 inline-block align-middle"><DirectionIcon item={c} /></span>
                      <span className="mono text-xs">{dateTime(c.start_stamp)}</span>
                      {c.leg === 'b' && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-muted-foreground">b-leg</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mono text-xs font-semibold">{c.caller_id_number || '—'}</div>
                      {c.caller_id_name && <div className="text-[11px] text-muted-foreground">{c.caller_id_name}</div>}
                    </td>
                    <td className="mono px-4 py-3 text-xs">{c.destination_number || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{c.cc_queue || <span className="text-muted-foreground">—</span>}</div>
                      {c.cc_agent && <div className="text-[11px] text-muted-foreground">{c.cc_agent}</div>}
                    </td>
                    <td className="mono px-4 py-3 text-xs">
                      {duration(c.duration)}
                      {c.billsec ? <span className="text-muted-foreground"> · talk {duration(c.billsec)}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge item={c} />
                      <div className="mono mt-1 text-[10px] text-muted-foreground">{c.hangup_cause}</div>
                    </td>
                    <td className="px-4 py-3">{c.has_recording ? <Mic size={15} className="text-primary" aria-label="Has recording" /> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row">
            <span className="text-muted-foreground" data-testid="text-cdr-range">
              {first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="h-8 rounded-lg border border-input bg-card px-2 text-xs" data-testid="select-cdr-page-size">
                {[25, 50, 100].map((n) => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-40" aria-label="Previous page" data-testid="button-cdr-prev"><ChevronLeft size={15} /></button>
              <span className="mono">{page + 1} / {pages}</span>
              <button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-40" aria-label="Next page" data-testid="button-cdr-next"><ChevronRight size={15} /></button>
            </div>
          </div>
        </Panel>
      )}
    </Frame>
  );
}

export function CdrRecordsPage() {
  return (
    <CdrGate>
      <CdrRecordsInner />
    </CdrGate>
  );
}

/* ---------- detail ---------- */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="eyebrow text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold">{children || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

const asText = (value: unknown) => (value === null || value === undefined || value === '' ? '' : String(value));

function CdrDetailInner() {
  const { uuid = '' } = useParams<{ uuid: string }>();
  const [, navigate] = useLocation();
  const { data, error, isLoading } = useQuery({ queryKey: ['cdr-detail', uuid], queryFn: () => cdrViewerApi.get(uuid), retry: false });
  useSignOutOn401(error);
  const [copied, setCopied] = useState(false);

  const back = (
    <Link href="/cdr" className={buttonClass} data-testid="link-cdr-back">
      <ArrowLeft size={14} /> All calls
    </Link>
  );

  if (isLoading) {
    return (
      <Frame title="Call" detail="Loading…" action={back}>
        <Panel className="space-y-3 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</Panel>
      </Frame>
    );
  }
  if (error || !data) {
    const notFound = error instanceof CdrApiError && error.status === 404;
    return (
      <Frame title={notFound ? 'Call not found' : 'Could not load the call'} detail={error instanceof Error ? error.message : ''} action={back}>
        <EmptyState title={notFound ? 'No call with that id' : 'Something went wrong'} detail="Go back to the list and pick another call." />
      </Frame>
    );
  }

  const r = data.record;
  const status = statusOf({ answer_stamp: asText(r.answer_stamp) || null, missed_call: r.missed_call === true });
  const allFields = Object.entries(r)
    .filter(([k, v]) => v !== null && v !== '' && k !== 'xml' && k !== 'json')
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <Frame title={`${asText(r.caller_id_number) || 'Unknown'} → ${asText(r.destination_number) || 'Unknown'}`} detail={`${dateTime(asText(r.start_stamp) || null)} · ${status} · ${asText(r.hangup_cause)}`} action={back}>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="cdr-summary">
            <Field label="Direction">{asText(r.direction)}</Field>
            <Field label="Domain">{asText(r.domain_name)}</Field>
            <Field label="Leg">{asText(r.leg)}</Field>
            <Field label="Caller">{[asText(r.caller_id_number), asText(r.caller_id_name)].filter(Boolean).join(' · ')}</Field>
            <Field label="Destination">{asText(r.destination_number)}</Field>
            <Field label="Source number">{asText(r.source_number)}</Field>
            <Field label="Started">{dateTime(asText(r.start_stamp) || null)}</Field>
            <Field label="Answered">{dateTime(asText(r.answer_stamp) || null)}</Field>
            <Field label="Ended">{dateTime(asText(r.end_stamp) || null)}</Field>
            <Field label="Duration">{duration(Number(r.duration))}</Field>
            <Field label="Talk time">{duration(Number(r.billsec))}</Field>
            <Field label="Hangup">{[asText(r.hangup_cause), asText(r.sip_hangup_disposition)].filter(Boolean).join(' · ')}</Field>
            <Field label="Queue">{asText(r.cc_queue)}</Field>
            <Field label="Agent">{asText(r.cc_agent)}</Field>
            <Field label="Queue result">{[asText(r.cc_cause), asText(r.cc_cancel_reason)].filter(Boolean).join(' · ')}</Field>
            <Field label="SIP call id"><span className="mono text-xs">{asText(r.sip_call_id)}</span></Field>
            <Field label="Call uuid"><span className="mono text-xs">{r.xml_cdr_uuid}</span></Field>
          </div>
        </Panel>

        <Panel className="p-5" >
          <div className="eyebrow text-muted-foreground">Recording</div>
          {data.recording.available ? (
            <div className="mt-3 space-y-3" data-testid="cdr-recording">
              <div className="flex items-center gap-2 text-sm font-extrabold"><Mic size={16} className="text-primary" /> Recorded call</div>
              <div className="mono break-all text-[11px] text-muted-foreground">{data.recording.path}/{data.recording.name}</div>
              <button
                className={buttonClass}
                onClick={() => {
                  void navigator.clipboard?.writeText(data.recording.interaction_id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                data-testid="button-cdr-copy-interaction"
              >
                <Copy size={13} /> {copied ? 'Copied' : 'Copy interaction id'}
              </button>
              <p className="text-[11px] leading-5 text-muted-foreground">
                Audio is played by the supervisor API (<span className="mono">recordingV2</span>) with this interaction id and channel 0. In-page playback is added once the supervisor sign-in is connected.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">This call has no recording.</p>
          )}
        </Panel>
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="border-b border-border px-5 py-3 text-sm font-extrabold">Other legs of this call</div>
        {data.legs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground" data-testid="cdr-no-legs">No other legs were stored for this call.</p>
        ) : (
          <table className="w-full text-sm" data-testid="table-cdr-legs">
            <tbody>
              {data.legs.map((l) => (
                <tr key={l.uuid} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40" onClick={() => navigate(`/cdr/${l.uuid}`)}>
                  <td className="px-5 py-3 text-xs"><DirectionIcon item={l} /></td>
                  <td className="mono px-3 py-3 text-xs">{dateTime(l.start_stamp)}</td>
                  <td className="mono px-3 py-3 text-xs">{l.caller_id_number || '—'} → {l.destination_number || '—'}</td>
                  <td className="px-3 py-3"><StatusBadge item={l} /></td>
                  <td className="mono px-3 py-3 text-xs">{duration(l.duration)}</td>
                  <td className="px-3 py-3 text-[10px] font-extrabold uppercase text-muted-foreground">{l.leg}-leg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <details className="surface mt-5 rounded-2xl">
        <summary className="cursor-pointer px-5 py-3 text-sm font-extrabold">All stored fields ({allFields.length})</summary>
        <div className="grid gap-x-8 gap-y-2 border-t border-border px-5 py-4 sm:grid-cols-2" data-testid="cdr-all-fields">
          {allFields.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-border/40 py-1 text-xs">
              <span className="mono text-muted-foreground">{k}</span>
              <span className="mono break-all text-right">{String(v)}</span>
            </div>
          ))}
        </div>
      </details>
    </Frame>
  );
}

export function CdrDetailPage() {
  return (
    <CdrGate>
      <CdrDetailInner />
    </CdrGate>
  );
}
