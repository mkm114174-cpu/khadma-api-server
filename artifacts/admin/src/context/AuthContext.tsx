import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { authClient, getAccessToken, hasActiveSession } from "@/lib/neonAuth";

interface AuthContextValue {
  sessionLoaded: boolean;
  isSignedIn: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => getAccessToken());
    return () => setAuthTokenGetter(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const active = await hasActiveSession();
    setIsSignedIn(active);
    setSessionLoaded(true);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setIsSignedIn(false);
    setSessionLoaded(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionLoaded,
      isSignedIn,
      logout,
      refreshSession,
    }),
    [sessionLoaded, isSignedIn, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthSession must be used within AuthProvider");
  return ctx;
}
