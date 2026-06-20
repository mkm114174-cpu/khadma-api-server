import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LandingPage } from "@/pages/Landing";
import { SignInPage } from "@/pages/SignIn";
import { DashboardPage } from "@/pages/Dashboard";
import { ProvidersPage } from "@/pages/Providers";
import { ServicesPage } from "@/pages/Services";
import { RequestsPage } from "@/pages/Requests";
import { MessagesPage } from "@/pages/Messages";
import { CommissionPage } from "@/pages/Commission";
import { Shell } from "@/components/layout/Shell";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthProvider, useAuthSession } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { sessionLoaded, isSignedIn } = useAuthSession();

  if (!sessionLoaded) return null;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function AuthenticatedRoutes() {
  return (
    <AuthGate>
      <Shell>
        <Switch>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/providers" component={ProvidersPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/requests" component={RequestsPage} />
          <Route path="/commission" component={CommissionPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </AuthGate>
  );
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in" component={SignInPage} />
          <Route path="/dashboard" component={AuthenticatedRoutes} />
          <Route path="/providers" component={AuthenticatedRoutes} />
          <Route path="/services" component={AuthenticatedRoutes} />
          <Route path="/requests" component={AuthenticatedRoutes} />
          <Route path="/commission" component={AuthenticatedRoutes} />
          <Route path="/messages" component={AuthenticatedRoutes} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
