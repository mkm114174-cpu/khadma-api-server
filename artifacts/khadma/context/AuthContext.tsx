import { useAuth as useClerkAuth } from "@clerk/expo";
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

export type AppRole = "customer" | "provider" | "admin";

type AuthStatus =
  | "loading"
  | "signedOut"
  | "needsProvision"
  | "ready"
  | "error"
  | "guest"; // demo mode

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
  logout: () => Promise<void>;
  setGuest: (guest: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestResolved, setGuestResolved] = useState(false);

  // On mobile there is no browser cookie jar, so attach the Clerk session
  // token as a bearer header to every generated API request.
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  // Check for demo/guest mode
  useEffect(() => {
    AsyncStorage.getItem("khadma:demo").then((val) => {
      setIsGuest(val === "true");
      setGuestResolved(true);
    });
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
      setLoadError(false);
    } catch (err) {
      setUser(null);
      if (err instanceof ApiError && err.status === 404) {
        // Signed in with Clerk but no backend profile yet — needs provisioning.
        setLoadError(false);
      } else {
        // Transient/auth failures (network, 5xx, 401) must not be mistaken
        // for "needs provisioning" — surface a retryable error instead.
        console.error("Failed to load current user", err);
        setLoadError(true);
      }
    } finally {
      setResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setResolved(false);
      void loadUser();
    } else {
      setUser(null);
      setLoadError(false);
      setResolved(true);
    }
  }, [isLoaded, isSignedIn, loadUser]);

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

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setLoadError(false);
    setResolved(true);
  }, [signOut]);

  const status: AuthStatus =
    !isLoaded || !guestResolved
      ? "loading"
      : isGuest
        ? "guest"
        : !isSignedIn
          ? "signedOut"
          : !resolved
            ? // Signed in with Clerk but the backend profile fetch has not
              // finished yet. Stay in loading instead of briefly reporting
              // needsProvision, which would flash the registration screen and
              // make a fresh login look like it failed the first time.
              "loading"
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
      refresh: loadUser,
      logout: async () => {
        await AsyncStorage.removeItem("khadma:demo");
        setIsGuest(false);
        await signOut();
        setUser(null);
        setLoadError(false);
        setResolved(true);
      },
      setGuest,
    }),
    [status, user, isGuest, provision, loadUser, signOut, setGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
