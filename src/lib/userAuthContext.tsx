"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
}

interface UserAuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  sendEmailOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyEmailOtp: (
    email: string,
    token: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseUser(rawUser: any): UserProfile {
  const meta = rawUser.user_metadata || {};
  return {
    id: rawUser.id,
    email: rawUser.email || "",
    name:
      meta.full_name ||
      meta.name ||
      rawUser.email?.split("@")[0] ||
      "მომხმარებელი",
    avatarUrl: meta.avatar_url || meta.picture,
    provider: rawUser.app_metadata?.provider || "email",
  };
}

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("token has expired") || lower.includes("invalid") || lower.includes("otp_expired")) {
    return "კოდი არასწორია ან ვადა გაუვიდა. გთხოვთ სცადოთ თავიდან.";
  }
  if (lower.includes("rate limit") || lower.includes("60 seconds") || lower.includes("security purposes")) {
    return "უსაფრთხოების მიზნით, კოდის ხელახლა მოთხოვნა შეგიძლიათ 60 წამში ერთხელ.";
  }
  if (lower.includes("valid email") || lower.includes("invalid email")) {
    return "გთხოვთ მიუთითოთ სწორი ელფოსტის მისამართი.";
  }
  if (lower.includes("provider is not enabled")) {
    return "Google ავტორიზაცია ჯერ გააქტიურებული არ არის. გთხოვთ გამოიყენოთ ელფოსტა.";
  }
  return msg;
}

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize session from Supabase client
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (!error && session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        // Clean auth tokens from URL bar (hash or query) so magic link tokens don't persist in browser
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const sendEmailOtp = useCallback(async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { ok: false, error: "გთხოვთ მიუთითოთ სწორი ელფოსტა." };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        return { ok: false, error: translateAuthError(error.message) };
      }

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: translateAuthError(message) };
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();

      if (!cleanToken || cleanToken.length < 6) {
        return { ok: false, error: "შეიყვანეთ 6-ნიშნა კოდი." };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "email",
      });

      if (error || !data.user) {
        return {
          ok: false,
          error: translateAuthError(error?.message || "კოდი არასწორია"),
        };
      }

      setUser(mapSupabaseUser(data.user));
      setIsAuthModalOpen(false);
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: translateAuthError(message) };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        return { ok: false, error: translateAuthError(error.message) };
      }

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: translateAuthError(message) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        // Remove Supabase localStorage tokens and URL hash
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // ignore storage error
        }
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      sendEmailOtp,
      verifyEmailOtp,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      isLoading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      sendEmailOtp,
      verifyEmailOtp,
      loginWithGoogle,
      logout,
    ],
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
