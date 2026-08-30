import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Loader2, Receipt, RefreshCw } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { useAuth } from "@/lib/auth-context";
import {
  formatDate,
  formatFCFA,
  formatNombre,
  historiquePaiements,
  listRestaurants,
} from "@/lib/admin-api";

export const Route = createFileRoute("/historique-paiements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Historique des paiements · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Historique des encaissements effectués auprès des restaurateurs partenaires de GAO FOOD.",
      },
      { property: "og:title", content: "Historique des paiements · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Suivi des encaissements des restaurateurs de la plateforme GAO FOOD.",
      },
    ],
  }),
  component: () => (
    <ConsoleLayout>
      <PagePaiements />
    </ConsoleLayout>
  ),
});

type Periode = "jour" | "semaine" | "mois" | "tout";

const PERIODES: { cle: Periode; label: string; jours: number | null }[] = [
  { cle: "jour", label: "Aujourd'hui", jours: 1 },
  { cle: "semaine", label: "7 derniers jours", jours: 7 },
  { cle: "mois", label: "30 derniers jours", jours: 30 },
  { cle: "tout", label: "Tout", jours: null },
];

function PagePaiements() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<Periode>("tout");
  const [restaurant, setRestaurant] = useState<string>("tous");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["paiements", token],
    queryFn: () => historiquePaiements(token!),
    enabled: !!token,
  });

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants", token],
    queryFn: () => listRestaurants(token!),
    enabled: !!token,
  });

  const nomParId = useMemo(
    () => new Map((restaurants ?? []).map((r) => [r.id, r.nom])),
    [restaurants],
  );

  const liste = useMemo(() => {
    const jours = PERIODES.find((p) => p.cle === periode)!.jours;
    const limite = jours ? Date.now() - jours * 24 * 60 * 60 * 1000 : null;
    return (data ?? [])
      .filter((p) => (restaurant === "tous" ? true : p.restaurant_id === restaurant))
      .filter((p) => (limite ? new Date(p.created_at).getTime() >= limite : true))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data, periode, restaurant]);

  const total = liste.reduce((s, p) => s + Number(p.montant || 0), 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel mx-auto mt-10 max-w-md p-6 text-center">
        <AlertTriangle className="mx-auto size-6 text-warning" />
        <h2 className="mt-3 text-sm font-semibold">Données indisponibles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Impossible de charger les encaissements."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 btn-primary"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-semibold">Historique des paiements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encaissements enregistrés auprès des restaurateurs de GAO FOOD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            className="field w-auto"
          >
            <option value="tous">Tous les restaurants</option>
            {(restaurants ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom} · {r.quartier}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            {PERIODES.map((p) => (
              <button
                key={p.cle}
                onClick={() => setPeriode(p.cle)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  periode === p.cle
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Actualiser"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <section className="panel animate-fade-up flex flex-wrap items-center justify-between gap-6 p-5">
        <div>
          <p className="flex items-center gap-2 label-kpi">
            <Banknote className="size-3.5" style={{ color: "var(--color-money)" }} />
            Total encaissé sur la sélection
          </p>
          <p className="num mt-2 text-[34px] leading-none font-semibold" style={{ color: "var(--color-money)" }}>
            {formatFCFA(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Encaissements</p>
          <p className="num mt-1 text-2xl font-semibold">{formatNombre(liste.length)}</p>
        </div>
      </section>

      <div className="panel animate-fade-up overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-border px-5 py-2.5 label-kpi md:grid">
          <span>Date</span>
          <span>Restaurant</span>
          <span className="text-right">Montant</span>
        </div>
        {liste.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Aucun encaissement enregistré</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les paiements apparaîtront ici dès le premier encaissement effectué depuis la page
              Restaurants.
            </p>
          </div>
        ) : (
          <ul>
            {liste.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-1 gap-1 border-b border-border px-5 py-3 last:border-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)] md:items-center md:gap-4"
              >
                <span className="num text-xs text-muted-foreground md:text-sm">
                  {formatDate(p.created_at)}
                </span>
                <span className="truncate text-sm font-medium">
                  {p.restaurants?.nom ?? nomParId.get(p.restaurant_id) ?? "Restaurant supprimé"}
                </span>
                <span className="num text-sm font-semibold md:text-right">
                  {formatFCFA(p.montant)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
