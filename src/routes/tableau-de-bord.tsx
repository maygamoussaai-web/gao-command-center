import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Loader2,
  RefreshCw,
  Store,
  TrendingUp,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { useAuth } from "@/lib/auth-context";
import { dashboard, formatFCFA, formatNombre, type PeriodeStats } from "@/lib/admin-api";

export const Route = createFileRoute("/tableau-de-bord")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tableau de bord · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Santé de la plateforme GAO FOOD en un coup d'œil : commandes du jour, chiffre d'affaires, restaurants et soldes dus.",
      },
      { property: "og:title", content: "Tableau de bord · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Commandes, chiffre d'affaires et soldes des restaurateurs de GAO FOOD.",
      },
    ],
  }),
  component: () => (
    <ConsoleLayout>
      <TableauDeBord />
    </ConsoleLayout>
  ),
});

type Periode = "jour" | "semaine" | "mois";

const PERIODES: { cle: Periode; label: string; suffixe: string }[] = [
  { cle: "jour", label: "Aujourd'hui", suffixe: "aujourd'hui" },
  { cle: "semaine", label: "Cette semaine", suffixe: "cette semaine" },
  { cle: "mois", label: "Ce mois", suffixe: "ce mois" },
];

function TableauDeBord() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<Periode>("jour");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", token],
    queryFn: () => dashboard(token!),
    enabled: !!token,
  });

  const stats: PeriodeStats | null = useMemo(
    () => (data ? data[periode] : null),
    [data, periode],
  );
  const libelle = PERIODES.find((p) => p.cle === periode)!;

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
          {error instanceof Error ? error.message : "Impossible de charger le tableau de bord."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            État de santé de la plateforme GAO FOOD, {libelle.suffixe}.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Solde dû par les restaurateurs — métrique prioritaire */}
      <section className="panel relative overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: "var(--color-money)" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <Banknote className="size-3.5" style={{ color: "var(--color-money)" }} />
              Solde total dû par les restaurateurs
            </p>
            <p
              className="num mt-3 text-4xl font-semibold sm:text-5xl"
              style={{ color: "var(--color-money)" }}
            >
              {formatFCFA(data.total_solde_admin)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Montant à encaisser, cumulé sur les {formatNombre(data.nombre_restaurants)}{" "}
              restaurants de la plateforme.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Prix par commande payée</p>
              <p className="num mt-1 font-semibold">
                {formatFCFA(data.parametres.prix_par_commande_payee)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prix promotion</p>
              <p className="num mt-1 font-semibold">
                {formatFCFA(data.parametres.prix_promotion)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat
          icone={<Utensils className="size-4" />}
          label={`Commandes · ${libelle.label.toLowerCase()}`}
          valeur={formatNombre(stats?.nombre_commandes)}
        />
        <CarteStat
          icone={<TrendingUp className="size-4" />}
          label="Moyenne de commandes / jour"
          valeur={formatNombre(Math.round(data.moyenne_commandes_par_jour))}
        />
        <CarteStat
          icone={<Store className="size-4" />}
          label="Restaurants actifs"
          valeur={formatNombre(data.nombre_restaurants)}
        />
        <CarteStat
          icone={<Users className="size-4" />}
          label="Clients inscrits"
          valeur={formatNombre(data.nombre_clients)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CarteClassement
          titre="Restaurant le plus commandé"
          sousTitre={`Volume de commandes ${libelle.suffixe}`}
          nom={stats?.restaurant_plus_commandes?.nom ?? null}
          valeur={
            stats?.restaurant_plus_commandes
              ? `${formatNombre(stats.restaurant_plus_commandes.nb)} commandes`
              : null
          }
        />
        <CarteClassement
          titre="Meilleur chiffre d'affaires"
          sousTitre={`Chiffre d'affaires ${libelle.suffixe}`}
          nom={stats?.restaurant_plus_chiffre_affaires?.nom ?? null}
          valeur={
            stats?.restaurant_plus_chiffre_affaires
              ? formatFCFA(stats.restaurant_plus_chiffre_affaires.ca)
              : null
          }
        />
      </section>
    </div>
  );
}

function CarteStat({
  icone,
  label,
  valeur,
}: {
  icone: React.ReactNode;
  label: string;
  valeur: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icone}
        <span className="text-[11px] font-medium tracking-wide uppercase">{label}</span>
      </div>
      <p className="num mt-3 text-3xl font-semibold">{valeur}</p>
    </div>
  );
}

function CarteClassement({
  titre,
  sousTitre,
  nom,
  valeur,
}: {
  titre: string;
  sousTitre: string;
  nom: string | null;
  valeur: string | null;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="size-4" />
          <span className="text-[11px] font-medium tracking-wide uppercase">{titre}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">{sousTitre}</span>
      </div>
      {nom ? (
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="text-lg font-semibold">{nom}</p>
          <p className="num flex items-center gap-1 text-sm font-medium text-primary">
            <ArrowUpRight className="size-4" />
            {valeur}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Aucune commande enregistrée sur cette période.
        </p>
      )}
    </div>
  );
}
