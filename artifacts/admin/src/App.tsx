import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LandingPage } from "@/pages/Landing";
import { DashboardPage } from "@/pages/Dashboard";
import { ProvidersPage } from "@/pages/Providers";
import { ServicesPage } from "@/pages/Services";
import { RequestsPage } from "@/pages/Requests";
import { MessagesPage } from "@/pages/Messages";
import { CommissionPage } from "@/pages/Commission";
import { Shell } from "@/components/layout/Shell";
import { AuthGate } from "@/components/auth/AuthGate";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(45 93% 53%)",
    colorForeground: "hsl(0 0% 100%)",
    colorMutedForeground: "hsl(0 0% 53.3%)",
    colorDanger: "hsl(0 100% 63.5%)",
    colorBackground: "hsl(0 0% 11%)",
    colorInput: "hsl(0 0% 16.5%)",
    colorInputForeground: "hsl(0 0% 100%)",
    colorNeutral: "hsl(0 0% 16.5%)",
    fontFamily: "'Tajawal', sans-serif",
    borderRadius: "14px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#1c1c1c] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#2a2a2a] shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold text-2xl",
    headerSubtitle: "text-[#888] text-sm",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-white font-medium",
    footerActionLink: "text-[#F5C518] font-bold hover:text-[#d4aa15]",
    footerActionText: "text-[#888]",
    dividerText: "text-[#888]",
    identityPreviewEditButton: "text-[#F5C518] hover:text-[#d4aa15]",
    formFieldSuccessText: "text-green-500",
    alertText: "text-white",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "bg-[#252525] border border-[#2a2a2a] hover:bg-[#333] transition-colors",
    formButtonPrimary: "bg-[#F5C518] text-black hover:bg-[#d4aa15] font-bold transition-colors",
    formFieldInput: "bg-[#252525] border border-[#2a2a2a] text-white focus:ring-1 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all",
    footerAction: "mt-4",
    dividerLine: "bg-[#2a2a2a]",
    alert: "bg-[#252525] border border-[#ff4444]",
    otpCodeFieldInput: "bg-[#252525] border border-[#2a2a2a] text-white focus:ring-1 focus:ring-[#F5C518]",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ApiAuthTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "تسجيل الدخول",
            subtitle: "الرجاء تسجيل الدخول للوصول إلى لوحة التحكم",
          },
        },
        signUp: {
          start: {
            title: "إنشاء حساب",
            subtitle: "مرحباً بك في خدمة",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ApiAuthTokenSync />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
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
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;