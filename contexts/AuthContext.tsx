"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: User }>("/api/v1/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // These functions are INSIDE AuthProvider because they need
  // access to setUser. If they were outside,
  // they couldn't update the user state.

  async function login(email: string, password: string) {
    const res = await api.post<{
      data: { user: User };
    }>("/api/v1/auth/login", { email, password });
    setUser(res.data.user);
  }

  async function register(email: string, password: string, name: string) {
    await api.post("/api/v1/auth/register", { email, password, name });
    await login(email, password);
  }

  async function logout() {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {}
    setUser(null);
    window.location.href = "/login";
  }

  // Everything inside AuthProvider.Provider becomes available
  // to any child component that calls useAuth()
  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook that components use to access auth state
// Instead of prop drilling, any component just calls:
// const { user, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
