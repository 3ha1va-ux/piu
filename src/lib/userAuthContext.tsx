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

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: "google" | "email";
}

interface UserAuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "piu_user_session";

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load stored session on client after mount (deferred to avoid React 19 sync-render lint)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const loginWithGoogle = useCallback(async () => {
    const demoUser: UserProfile = {
      id: "usr_google_demo",
      email: "user@gmail.com",
      name: "მომხმარებელი",
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      provider: "google",
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
    setIsAuthModalOpen(false);
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    const demoUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      email,
      name: email.split("@")[0],
      provider: "email",
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithEmail,
      logout,
    }),
    [
      user,
      isLoading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithEmail,
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
