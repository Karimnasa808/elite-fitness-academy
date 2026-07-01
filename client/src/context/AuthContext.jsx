// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("efa_token");
    const savedCoach = localStorage.getItem("efa_coach");
    if (token && savedCoach) {
      try {
        setCoach(JSON.parse(savedCoach));
      } catch {
        localStorage.removeItem("efa_coach");
      }
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("efa_token", data.token);
    localStorage.setItem("efa_coach", JSON.stringify(data.coach));
    setCoach(data.coach);
    return data.coach;
  }

  function logout() {
    localStorage.removeItem("efa_token");
    localStorage.removeItem("efa_coach");
    setCoach(null);
  }

  return (
    <AuthContext.Provider value={{ coach, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
