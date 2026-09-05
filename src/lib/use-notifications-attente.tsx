import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { restaurantsEnAttente } from "./admin-api";
import { useAuth } from "./auth-context";

const VUS_KEY = "gaofood_demandes_vues";

function lireVus(): string[] {
  try {
    const raw = localStorage.getItem(VUS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Surveille les nouvelles demandes de création de restaurant et affiche
 * une notification pour chacune. Renvoie le nombre de demandes en attente.
 */
export function useNotificationsAttente() {
  const { token } = useAuth();

  const { data } = useQuery({
    queryKey: ["restaurants-en-attente", token],
    queryFn: () => restaurantsEnAttente(token!),
    enabled: !!token,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const annonces = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    const vus = new Set([...lireVus(), ...annonces.current]);
    const nouveaux = data.filter((r) => r.statut === "en_attente" && !vus.has(r.id));
    if (nouveaux.length === 0) return;

    nouveaux.forEach((r) => annonces.current.add(r.id));

    if (nouveaux.length <= 3) {
      nouveaux.forEach((r) => {
        toast(`Nouvelle demande : ${r.nom}`, {
          description: `${r.quartier} · ${
            r.restaurateur ? `${r.restaurateur.prenom} ${r.restaurateur.nom}` : "Restaurateur inconnu"
          }`,
          duration: 8000,
        });
      });
    } else {
      toast(`${nouveaux.length} nouvelles demandes de création`, {
        description: "Ouvre la page Restaurants pour les valider ou les refuser.",
        duration: 8000,
      });
    }

    const tous = [...new Set([...lireVus(), ...nouveaux.map((r) => r.id)])];
    try {
      localStorage.setItem(VUS_KEY, JSON.stringify(tous.slice(-200)));
    } catch {
      /* stockage indisponible */
    }
  }, [data]);

  return data?.filter((r) => r.statut === "en_attente").length ?? 0;
}
