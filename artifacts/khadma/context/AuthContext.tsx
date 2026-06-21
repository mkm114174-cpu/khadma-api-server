import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ApiError,
  getCurrentUser,
  provisionUser,
  setAuthTokenGetter,
  type User,
} from "@workspace/api-client-react";
import {
  finalizeAuthSession,
  getAccessToken,
  hasActiveSession,
  signOutAuth,
  withAuthTimeout,
} from "@/lib/neonAuth";
import type { AuthSessionPayload } from "@/lib/authSession";

export type AppRole = "customer" | "provider" | "admin";

type AuthStatus =
  | "loading"
  | "signedOut"
  | "needsProvision"
  | "ready"
  | "error"
  | "guest";

export interface ProvisionInput {
  name: string;
  role: "customer" | "provider";
  email?: string;
  phone?: string;
  commissionAgreed?: boolean;
  language?: "ar" | "en" | "he";
}

interface AuthContextValue {
  status: AuthStatus;
  isLoggedIn: boolean;
  user: User | null;
  role: AppRole | null;
  name: string;
  phone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  provision: (input: ProvisionInput) => Promise<void>;
  refresh: () => Promise<void>;
  refreshSession: () => Promise<void>;
  completeAuthLogin: (payload: AuthSessionPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  setGuest: (guest: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Never block the UI longer than this while checking auth on launch. */
const BOOT_TIMEOUT_MS = 6_000;
const LOAD_USER_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestResolved, setGuestResolved] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => getAccessToken());
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("khadma:demo")
      .then((val) => {
        setIsGuest(val === "true");
      })
      .catch(() => {
        setIsGuest(false);
      })
      .finally(() => {
        setGuestResolved(true);
      });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const active = await hasActiveSession();
      setIsSignedIn(active);
    } catch (err) {
      console.warn("[Auth] session check failed", err);
      setIsSignedIn(false);
    } finally {
      setSessionLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Safety net: never leave the splash/loading overlay up forever on slow networks.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSessionLoaded(true);
      setGuestResolved(true);
    }, BOOT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const current = await withAuthTimeout(getCurrentUser(), LOAD_USER_TIMEOUT_MS);
      setUser(current);
      setLoadError(false);
    } catch (err) {
      setUser(null);
      if (err instanceof ApiError && err.status === 404) {
        setLoadError(false);
      } else if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        console.warn("[Auth] session rejected by API — signing out");
        await signOutAuth();
        setIsSignedIn(false);
        setLoadError(false);
      } else {
        console.error("Failed to load current user", err);
        setLoadError(true);
      }
    } finally {
      setResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoaded) return;
    if (isSignedIn) {
      setResolved(false);
      void loadUser();
    } else {
      setUser(null);
      setLoadError(false);
      setResolved(true);
    }
  }, [sessionLoaded, isSignedIn, loadUser]);

  const provision = useCallback(async (input: ProvisionInput) => {
    const created = await provisionUser({
      name: input.name,
      role: input.role,
      email: input.email,
      phone: input.phone,
      commissionAgreed: input.commissionAgreed,
      language: input.language,
    });
    setUser(created);
  }, []);

  const completeAuthLogin = useCallback(
    async (payload: AuthSessionPayload) => {
      const ok = await finalizeAuthSession(payload);
      if (!ok) return false;

      setIsSignedIn(true);
      setSessionLoaded(true);
      setResolved(false);

      // Load profile in background — 404 means needsProvision (OK).
      void withAuthTimeout(getCurrentUser(), LOAD_USER_TIMEOUT_MS)
        .then((current) => {
          setUser(current);
          setLoadError(false);
        })
        .catch((err) => {
          setUser(null);
          if (err instanceof ApiError && err.status === 404) {
            setLoadError(false);
            return;
          }
          if (
            err instanceof ApiError &&
            (err.status === 401 || err.status === 403)
          ) {
            console.warn("[Auth] API rejected token after login");
            void signOutAuth().then(() => {
              setIsSignedIn(false);
              setLoadError(false);
            });
            return;
          }
          console.error("Failed to load current user after login", err);
          setLoadError(true);
        })
        .finally(() => {
          setResolved(true);
        });

      return true;
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOutAuth();
    setIsSignedIn(false);
    setUser(null);
    setLoadError(false);
    setResolved(true);
  }, []);

  const status: AuthStatus =
    !sessionLoaded || !guestResolved
      ? "loading"
      : isGuest
        ? "guest"
        : !isSignedIn
          ? "signedOut"
          : !resolved
            ? "loading"
            : user
              ? "ready"
              : loadError
                ? "error"
                : "needsProvision";

  const setGuest = useCallback(async (guest: boolean) => {
    if (guest) {
      await AsyncStorage.setItem("khadma:demo", "true");
    } else {
      await AsyncStorage.removeItem("khadma:demo");
    }
    setIsGuest(guest);
  }, []);

  const refresh = useCallback(async () => {
    await refreshSession();
    if (await hasActiveSession()) {
      setResolved(false);
      await loadUser();
    }
  }, [loadUser, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isLoggedIn: status === "ready" || status === "guest",
      user,
      role: isGuest ? "customer" : (user?.role as AppRole | undefined) ?? null,
      name: isGuest ? "Guest" : user?.name ?? "",
      phone: isGuest ? "" : user?.phone ?? "",
      address: isGuest ? "" : user?.address ?? "",
      lat: user?.lat ?? null,
      lng: user?.lng ?? null,
      provision,
      refresh,
      refreshSession,
      completeAuthLogin,
      logout: async () => {
        await AsyncStorage.removeItem("khadma:demo");
        setIsGuest(false);
        await logout();
      },
      setGuest,
    }),
    [status, user, isGuest, provision, refresh, refreshSession, completeAuthLogin, logout, setGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
