"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: string; org: string; location?: string; aadhaar: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage synchronously to avoid redirect race condition
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("parampara_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("parampara_token");
  });
  const [isLoading, setIsLoading] = useState(false); // No longer needs async init

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    sessionStorage.setItem("parampara_token", jwtToken);
    sessionStorage.setItem("parampara_user", JSON.stringify(userData));
    setIsLoading(false);
  };

  const register = async (data: { name: string; email: string; password: string; role: string; org: string; location?: string; aadhaar: string }) => {
    const res = await authAPI.register(data);
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    sessionStorage.setItem("parampara_token", jwtToken);
    sessionStorage.setItem("parampara_user", JSON.stringify(userData));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoading(false);
    sessionStorage.removeItem("parampara_token");
    sessionStorage.removeItem("parampara_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
