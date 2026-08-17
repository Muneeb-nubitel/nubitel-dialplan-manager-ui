import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AgentDetailPage, AgentsPage, CallRecordsPage, CampaignDetailPage, CampaignsPage, LiveOperationsPage, OverviewPage, SettingsPage, SystemSyncPage, TiersPage } from '@/pages/call-center';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/live-operations" component={LiveOperationsPage} />
          <Route path="/campaigns" component={CampaignsPage} />
          <Route path="/campaigns/:extension" component={CampaignDetailPage} />
          <Route path="/agents" component={AgentsPage} />
          <Route path="/agents/:uuid" component={AgentDetailPage} />
          <Route path="/tiers" component={TiersPage} />
          <Route path="/call-records" component={CallRecordsPage} />
          <Route path="/system-sync" component={SystemSyncPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
