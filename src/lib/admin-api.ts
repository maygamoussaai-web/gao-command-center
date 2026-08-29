import { supabase } from "@/integrations/supabase/client";

export type AdminProfil = {
  prenom: string;
  nom: string;
  numero: string;
};

export type PeriodeStats = {
  nombre_commandes: number;
  restaurant_plus_commandes: { nom: string; nb: number } | null;
  restaurant_plus_chiffre_affaires: { nom: string; ca: number } | null;
};

export type DashboardData = {
  nombre_restaurants: number;
  nombre_clients: number;
  jour: PeriodeStats;
  semaine: PeriodeStats;
  mois: PeriodeStats;
  moyenne_commandes_par_jour: number;
  total_solde_admin: number;
  parametres: { prix_promotion: number; prix_par_commande_payee: number };
};

async function invoke<T>(fn: "admin-auth" | "admin-api", body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (error) {
    // Les erreurs métier arrivent avec un statut non-2xx : on lit le corps JSON.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = (await ctx.json()) as { error?: string };
        if (payload?.error) throw new Error(payload.error);
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
      }
    }
    throw new Error(error.message || "Impossible de contacter le serveur.");
  }

  const payload = data as { error?: string } | null;
  if (payload && typeof payload === "object" && payload.error) {
    throw new Error(payload.error);
  }
  return data as T;
}

export function login(mot_de_passe: string) {
  return invoke<AdminProfil & { token: string }>("admin-auth", {
    action: "login",
    mot_de_passe,
  });
}

export function session(token: string) {
  return invoke<AdminProfil & { token?: string }>("admin-auth", { action: "session", token });
}

export function changerMotDePasse(token: string, ancien: string, nouveau: string) {
  return invoke<{ message?: string }>("admin-auth", {
    action: "changer_mot_de_passe",
    token,
    ancien,
    nouveau,
  });
}

export function dashboard(token: string) {
  return invoke<DashboardData>("admin-api", { action: "dashboard", token });
}

const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatFCFA(value: number | null | undefined) {
  return `${fcfa.format(Math.round(value ?? 0))} FCFA`;
}

export function formatNombre(value: number | null | undefined) {
  return fcfa.format(value ?? 0);
}
