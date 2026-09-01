import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Check,
  Loader2,
  RefreshCw,
  Settings2,
  Store,
  TrendingUp,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { useAuth } from "@/lib/auth-context";
import {
  dashboard,
  formatFCFA,
  formatNombre,
  updateParametres,
  type ParametresAdmin,
  type PeriodeStats,
} from "@/lib/admin-api";

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
          className="mt-4 btn-primary"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-semibold">Tableau de bord</h1>
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
                    ? "seg-active"
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
      <section className="panel panel-glow sheen animate-fade-up relative overflow-hidden p-5">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: "var(--color-money)" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 label-kpi">
              <Banknote className="size-3.5" style={{ color: "var(--color-money)" }} />
              Solde total dû par les restaurateurs
            </p>
            <p
              className="num mt-2 text-[34px] leading-none font-semibold sm:text-[42px]"
              style={{ color: "var(--color-money)" }}
            >
              {formatFCFA(data.total_solde_admin)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Montant à encaisser, cumulé sur les {formatNombre(data.nombre_restaurants)}{" "}
              restaurants de la plateforme.
            </p>
          </div>
          <CarteParametres parametres={data.parametres} />

        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat
          index={0}
          icone={<Utensils className="size-4" />}
          label={`Commandes · ${libelle.label.toLowerCase()}`}
          valeur={formatNombre(stats?.nombre_commandes)}
        />
        <CarteStat
          index={1}
          icone={<TrendingUp className="size-4" />}
          label="Moyenne de commandes / jour"
          valeur={formatNombre(Math.round(data.moyenne_commandes_par_jour))}
        />
        <CarteStat
          index={2}
          icone={<Store className="size-4" />}
          label="Restaurants actifs"
          valeur={formatNombre(data.nombre_restaurants)}
        />
        <CarteStat
          index={3}
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

function CarteParametres({ parametres }: { parametres: ParametresAdmin }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [commande, setCommande] = useState(String(parametres.prix_par_commande_payee));
  const [promo, setPromo] = useState(String(parametres.prix_promotion));

  useEffect(() => {
    setCommande(String(parametres.prix_par_commande_payee));
    setPromo(String(parametres.prix_promotion));
  }, [parametres.prix_par_commande_payee, parametres.prix_promotion]);

  const m = useMutation({
    mutationFn: () =>
      updateParametres(token!, {
        prix_par_commande_payee: Math.max(0, Math.round(Number(commande) || 0)),
        prix_promotion: Math.max(0, Math.round(Number(promo) || 0)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["stats-restaurant"] });
    },
  });

  const modifie =
    Number(commande) !== parametres.prix_par_commande_payee ||
    Number(promo) !== parametres.prix_promotion;

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface-2/60 p-3.5">
      <p className="flex items-center gap-2 label-kpi text-[10px]">
        <Settings2 className="size-3.5 text-primary" />
        Tarifs facturés aux restaurateurs
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="text-muted-foreground">Par commande validée</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={commande}
            onChange={(e) => setCommande(e.target.value)}
            className="field num mt-1.5"
          />
        </label>
        <label className="block text-xs">
          <span className="text-muted-foreground">Par promotion</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            className="field num mt-1.5"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">Montants en FCFA</p>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !modifie}
          className="btn-primary h-8 px-3 text-xs"
        >
          {m.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          {m.isSuccess && !modifie ? "Enregistré" : "Enregistrer"}
        </button>
      </div>
      {m.error && (
        <p className="mt-2 text-[11px] text-destructive">{(m.error as Error).message}</p>
      )}
    </div>
  );
}

function CarteStat({

  icone,
  label,
  valeur,
  index = 0,
}: {
  icone: React.ReactNode;
  label: string;
  valeur: string;
  index?: number;
}) {
  return (
    <div
      className="panel lift animate-fade-up p-4"
      style={{ animationDelay: `${80 + index * 60}ms` }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="icon-tile size-7">
          {icone}
        </span>
        <span className="label-kpi text-[10px]">{label}</span>
      </div>
      <p className="num mt-2 text-3xl font-semibold">{valeur}</p>
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
    <div className="panel lift animate-fade-up p-4" style={{ animationDelay: "340ms" }}>
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
