import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "./admin-api";
import type { AdminProfil } from "./admin-api";

const TOKEN_KEY = "gaofood_admin_token";

type AuthState = {
  token: string | null;
  profil: AdminProfil | null;
  chargement: boolean;
  connexion: (motDePasse: string) => Promise<void>;
  deconnexion: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profil, setProfil] = useState<AdminProfil | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setChargement(false);
      return;
    }
    let annule = false;
    api
      .session(stored)
      .then((p) => {
        if (annule) return;
        setToken(stored);
        setProfil({ prenom: p.prenom, nom: p.nom, numero: p.numero });
      })
      .catch(() => {
        if (annule) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setProfil(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const connexion = useCallback(async (motDePasse: string) => {
    const res = await api.login(motDePasse);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setProfil({ prenom: res.prenom, nom: res.nom, numero: res.numero });
  }, []);

  const deconnexion = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProfil(null);
  }, []);

  const value = useMemo(
    () => ({ token, profil, chargement, connexion, deconnexion }),
    [token, profil, chargement, connexion, deconnexion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
