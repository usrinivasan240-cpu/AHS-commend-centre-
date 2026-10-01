"use client";

import { useState, createContext, useContext, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";

export interface SessionUser {
  email: string;
  name: string;
  role: string;
  uid?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_KEY = "ahs_auth";
const USER_KEY = "ahs_user";

function sanitizeUserDoc(data: Record<string, unknown>, fallbackEmail: string): SessionUser | null {
  // Never trust or persist password / secrets from the users doc.
  const email = String((data.email as string) || fallbackEmail || "").toLowerCase().trim();
  if (!email) return null;
  if (String(data.status || "active") !== "active") return null;
  return {
    email,
    name: String((data.name as string) || email),
    role: String((data.role as string) || ""),
  };
}

async function fetchUserProfile(email: string): Promise<SessionUser | null> {
  const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data() as Record<string, unknown>;
  if ("password" in data) {
    console.warn(
      "[auth] users doc still contains a plaintext `password` field for",
      email,
      "— remove it after migrating to Firebase Authentication."
    );
  }
  return sanitizeUserDoc(data, email);
}

function readCachedSession(): SessionUser | null {
  try {
    if (typeof window === "undefined") return null;
    if (localStorage.getItem(SESSION_KEY) !== "true") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown as Record<string, unknown>;
    if (typeof parsed?.email !== "string" || typeof parsed?.role !== "string") return null;
    if ("password" in parsed || "passwordHash" in parsed) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return {
      email: parsed.email,
      name: typeof parsed.name === "string" ? parsed.name : parsed.email,
      role: parsed.role,
      uid: typeof parsed.uid === "string" ? parsed.uid : undefined,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => readCachedSession() !== null);
  const [user, setUser] = useState<SessionUser | null>(() => readCachedSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Firebase Auth is the source of truth; localStorage is only a cache
    // seeded above via lazy useState (no sync setState-in-effect).
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser?.email) {
        // No Firebase session — keep cached profile if present (offline/dev),
        // otherwise stay logged out.
        setReady(true);
        return;
      }
      try {
        const profile = await fetchUserProfile(fbUser.email);
        if (profile) {
          const session: SessionUser = { ...profile, uid: fbUser.uid };
          localStorage.setItem(SESSION_KEY, "true");
          localStorage.setItem(USER_KEY, JSON.stringify(session));
          setIsLoggedIn(true);
          setUser(session);
        }
      } catch (err) {
        console.error("Auth profile sync error:", err);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) return false;

    // Primary path: Firebase Authentication (hashed passwords, server-verified).
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const profile = await fetchUserProfile(cred.user.email || cleanEmail);
      if (!profile) {
        await fbSignOut(auth);
        return false;
      }
      // Bootstrap super-admin: if no users doc exists yet, allow the address
      // in NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL to sign in once so it can create it.
      const session: SessionUser = { ...profile, uid: cred.user.uid };
      localStorage.setItem(SESSION_KEY, "true");
      localStorage.setItem(USER_KEY, JSON.stringify(session));
      setIsLoggedIn(true);
      setUser(session);
      return true;
    } catch (err) {
      console.error("Firebase login failed:", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    setIsLoggedIn(false);
    setUser(null);
    fbSignOut(auth).catch(() => {});
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn && pathname !== "/") {
      router.push("/");
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn && pathname !== "/") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816]">
        <div className="text-sm text-[#64748b]">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}
