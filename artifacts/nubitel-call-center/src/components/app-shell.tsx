import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, BarChart3, Bot, ChevronRight, CircleHelp, Database, Gauge, Layers3, Menu, Radio, Settings2, SlidersHorizontal, UsersRound, X, Zap } from 'lucide-react';
import { availableDomains, getSelectedDomain } from '@/lib/domains';

const nav = [
  { href: '/', label: 'Overview', icon: Gauge },
  { href: '/live-operations', label: 'Live operations', icon: Radio, live: true },
  { href: '/campaigns', label: 'Campaigns', icon: Layers3 },
  { href: '/agents', label: 'Agents', icon: UsersRound },
  { href: '/tiers', label: 'Tiers & routing', icon: SlidersHorizontal },
  { href: '/call-records', label: 'Call records', icon: BarChart3 },
];
const admin = [
  { href: '/system-sync', label: 'System sync', icon: Database },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [domain, setDomain] = useState(getSelectedDomain);
  useEffect(() => { localStorage.setItem('nubitel-domain', domain); }, [domain]);
  return (
    <div className="min-h-[100dvh] app-shell text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[78px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.25)]">
              <Zap size={17} strokeWidth={2.5} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-sidebar" />
            </div>
            <div><div className="text-[15px] font-extrabold tracking-tight text-white">nubitel</div><div className="eyebrow text-sidebar-foreground/60">call center</div></div>
          </Link>
          <button onClick={() => setOpen(false)} className="text-sidebar-foreground/50 lg:hidden" aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="px-4 pt-6">
          <div className="eyebrow px-3 pb-2 text-sidebar-foreground/45">Workspace</div>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-xs font-semibold text-sidebar-accent-foreground" data-testid="select-domain">
            {availableDomains.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <nav className="flex-1 space-y-1 px-4 pt-7">
          <div className="eyebrow px-3 pb-2 text-sidebar-foreground/45">Control room</div>
          {nav.map(({ href, label, icon: Icon, live }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold ${location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-3"><Icon size={17} strokeWidth={1.8} />{label}</span>{live && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}</Link>)}
          <div className="eyebrow px-3 pb-2 pt-7 text-sidebar-foreground/45">Administration</div>
          {admin.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold ${location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-3"><Icon size={17} strokeWidth={1.8} />{label}</span><ChevronRight size={14} className="opacity-30" /></Link>)}
        </nav>
        <div className="m-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white"><span className="live-dot h-2 w-2 rounded-full bg-accent" />Demo session</div>
          <p className="mt-1.5 text-[11px] leading-4 text-sidebar-foreground/60">Local supervisor access · authentication ready</p>
          <button className="mt-3 flex items-center gap-2 text-[11px] font-bold text-primary hover:text-white" onClick={() => window.alert('Session abstraction is ready for your auth provider.')} data-testid="button-session-info"><CircleHelp size={13} /> Session details</button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-sidebar/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-overlay-close" />}
      <main className="min-w-0 lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={20} /></button><div className="lg:hidden text-sm font-extrabold">nubitel <span className="font-normal text-muted-foreground">/ control room</span></div><div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><Activity size={15} className="text-primary" /> Operational view <span className="text-border">/</span> <span className="font-semibold text-foreground">{domain}</span></div></div>
          <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> API connected <span className="mono text-[10px] text-muted-foreground/70">42 ms</span></div><div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">AR</div></div>
        </header>
        {children}
      </main>
    </div>
  );
}
