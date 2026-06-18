"use client";

import { useState, createContext, useContext, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const ADMIN_EMAIL = "sriadmin@ahs.com";
const ADMIN_PASSWORD = "sriadmin@777";

interface AuthContextType {
  isLoggedIn: boolean;
  user: { email: string; name: string; role: string } | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem("ahs_auth");
    const storedUser = localStorage.getItem("ahs_user");
    if (authed === "true" && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Hardcoded admin check
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email: ADMIN_EMAIL, name: "Admin User", role: "super-admin" };
      localStorage.setItem("ahs_auth", "true");
      localStorage.setItem("ahs_user", JSON.stringify(adminUser));
      setIsLoggedIn(true);
      setUser(adminUser);
      return true;
    }

    // Check Firestore users
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password && userData.password === password) {
          const loggedInUser = {
            email: userData.email,
            name: userData.name,
            role: userData.role,
          };
          localStorage.setItem("ahs_auth", "true");
          localStorage.setItem("ahs_user", JSON.stringify(loggedInUser));
          setIsLoggedIn(true);
          setUser(loggedInUser);
          return true;
        }
      }
    } catch (err) {
      console.error("Firestore login error:", err);
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ahs_auth");
    localStorage.removeItem("ahs_user");
    setIsLoggedIn(false);
    setUser(null);
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
