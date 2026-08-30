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

export type RestaurantAdmin = {
  id: string;
  nom: string;
  logo_url: string | null;
  quartier: string;
  prix_livraison: number;
  horaire_ouverture: string;
  horaire_fermeture: string;
  delai_livraison_min_min: number;
  delai_livraison_max_min: number;
  solde_admin: number;
  statut: "actif" | "suspendu";
  motif_suspension: string | null;
  created_at: string;
  restaurateurs: { prenom: string; nom: string; numero: string } | null;
};

export type PaiementSolde = {
  id: string;
  restaurant_id: string;
  montant: number;
  created_at: string;
  restaurants?: { nom: string } | null;
};

export type StatsRestaurant = {
  jour: { commandes_validees: number; promotions: number };
  semaine: { commandes_validees: number; promotions: number };
  mois: { commandes_validees: number; promotions: number };
};

export function listRestaurants(token: string) {
  return invoke<{ restaurants: RestaurantAdmin[] }>("admin-api", {
    action: "list_restaurants",
    token,
  }).then((r) => r.restaurants ?? []);
}

export function detailRestaurant(token: string, restaurant_id: string) {
  return invoke<{
    restaurant: RestaurantAdmin | null;
    stats: StatsRestaurant;
    paiements: PaiementSolde[];
  }>("admin-api", { action: "detail_restaurant", token, restaurant_id });
}

export function historiquePaiements(token: string) {
  return invoke<{ paiements: PaiementSolde[] }>("admin-api", {
    action: "historique_paiements",
    token,
  }).then((r) => r.paiements ?? []);
}

export function enregistrerPaiement(token: string, restaurant_id: string, montant: number) {
  return invoke<{ ok?: boolean }>("admin-api", {
    action: "enregistrer_paiement",
    token,
    restaurant_id,
    montant,
  });
}

export function suspendreRestaurant(token: string, restaurant_id: string, motif: string) {
  return invoke<{ ok?: boolean }>("admin-api", {
    action: "suspendre",
    token,
    restaurant_id,
    motif,
  });
}

export function leverSuspension(token: string, restaurant_id: string) {
  return invoke<{ ok?: boolean }>("admin-api", {
    action: "lever_suspension",
    token,
    restaurant_id,
  });
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}
