import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldOff,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { useAuth } from "@/lib/auth-context";
import {
  detailRestaurant,
  enregistrerPaiement,
  formatDate,
  formatFCFA,
  formatNombre,
  leverSuspension,
  listRestaurants,
  statsRestaurant,
  suspendreRestaurant,
  type PeriodeResto,
  type RestaurantAdmin,
} from "@/lib/admin-api";

export const Route = createFileRoute("/restaurants")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restaurants · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Gestion des restaurants partenaires de GAO FOOD : soldes dus, encaissements et suspensions.",
      },
      { property: "og:title", content: "Restaurants · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Soldes, encaissements et suspensions des restaurants partenaires GAO FOOD.",
      },
    ],
  }),
  component: () => (
    <ConsoleLayout>
      <PageRestaurants />
    </ConsoleLayout>
  ),
});

type Filtre = "tous" | "actif" | "suspendu";

function PageRestaurants() {
  const { token } = useAuth();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [selection, setSelection] = useState<string | null>(null);
  const [deplie, setDeplie] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["restaurants", token],
    queryFn: () => listRestaurants(token!),
    enabled: !!token,
  });

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (filtre === "tous" ? true : r.statut === filtre))
      .filter((r) => (q ? r.nom.toLowerCase().includes(q) || r.quartier.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(b.solde_admin) - Number(a.solde_admin));
  }, [data, recherche, filtre]);

  const totalDu = (data ?? []).reduce((s, r) => s + Number(r.solde_admin || 0), 0);
  const suspendus = (data ?? []).filter((r) => r.statut === "suspendu").length;

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
          {error instanceof Error ? error.message : "Impossible de charger les restaurants."}
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
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold">Restaurants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNombre(data.length)} restaurants partenaires · {formatFCFA(totalDu)} à encaisser
            {suspendus > 0 ? ` · ${formatNombre(suspendus)} suspendu(s)` : ""}
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <div className="relative min-w-0 sm:w-56">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher"
              className="field w-full pl-8"
            />
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Actualiser"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:order-3"
          >
            <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
          <div className="col-span-2 flex min-w-0 overflow-x-auto rounded-lg border border-border bg-surface-2 p-0.5 sm:col-auto sm:order-2">
            {(
              [
                { cle: "tous", label: "Tous" },
                { cle: "actif", label: "Actifs" },
                { cle: "suspendu", label: "Suspendus" },
              ] as { cle: Filtre; label: string }[]
            ).map((f) => (
              <button
                key={f.cle}
                onClick={() => setFiltre(f.cle)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtre === f.cle
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="panel animate-fade-up overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-border px-5 py-2.5 label-kpi md:grid">
          <span>Restaurant</span>
          <span>Restaurateur</span>
          <span className="text-right">Solde dû</span>
          <span className="text-right">Statut</span>
        </div>
        {liste.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Aucun restaurant ne correspond à cette recherche.
          </p>
        ) : (
          <ul>
            {liste.map((r, i) => {
              const ouvert = deplie === r.id;
              return (
                <li
                  key={r.id}
                  className="animate-fade-up border-b border-border last:border-0"
                  style={{ animationDelay: `${Math.min(i, 14) * 28}ms` }}
                >
                  <button
                    onClick={() => setDeplie(ouvert ? null : r.id)}
                    aria-expanded={ouvert}
                    className={`row-interactive grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 text-left md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:gap-4 md:px-4 ${
                      ouvert ? "bg-accent/40" : ""
                    }`}
                  >
                    <ChevronRight
                      className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        ouvert ? "rotate-90 text-primary" : ""
                      }`}
                    />
                    <div className="flex min-w-0 items-center gap-2.5">
                      {r.logo_url ? (
                        <img
                          src={r.logo_url}
                          alt={`Logo ${r.nom}`}
                          loading="lazy"
                          className="size-7 shrink-0 rounded-md object-cover ring-1 ring-border"
                        />
                      ) : (
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-2 text-muted-foreground">
                          <Store className="size-3.5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{r.nom}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{r.quartier}</p>
                      </div>
                    </div>
                    <div className="hidden min-w-0 text-[12px] text-muted-foreground md:block">
                      <p className="truncate text-foreground">
                        {r.restaurateurs
                          ? `${r.restaurateurs.prenom} ${r.restaurateurs.nom}`
                          : "Restaurateur inconnu"}
                      </p>
                      <p className="num truncate text-[11px]">{r.restaurateurs?.numero ?? "—"}</p>
                    </div>
                    <p
                      className="num hidden text-[13px] font-semibold md:block md:text-right"
                      style={Number(r.solde_admin) > 0 ? { color: "var(--color-money)" } : undefined}
                    >
                      {formatFCFA(Number(r.solde_admin))}
                    </p>
                    <div className="flex items-center justify-end gap-2 md:block md:text-right">
                      <span
                        className="num text-[12px] font-semibold md:hidden"
                        style={
                          Number(r.solde_admin) > 0 ? { color: "var(--color-money)" } : undefined
                        }
                      >
                        {formatFCFA(Number(r.solde_admin))}
                      </span>
                      <BadgeStatut statut={r.statut} />
                    </div>
                  </button>

                  {ouvert && (
                    <div className="animate-fade-up grid gap-2 border-t border-border/70 bg-surface-2/40 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniInfo
                        label="Restaurateur"
                        valeur={
                          r.restaurateurs
                            ? `${r.restaurateurs.prenom} ${r.restaurateurs.nom}`
                            : "Inconnu"
                        }
                        sous={r.restaurateurs?.numero ?? "—"}
                      />
                      <MiniInfo
                        label="Horaires"
                        valeur={`${r.horaire_ouverture.slice(0, 5)} – ${r.horaire_fermeture.slice(0, 5)}`}
                        sous={r.quartier}
                      />
                      <MiniInfo
                        label="Livraison"
                        valeur={formatFCFA(r.prix_livraison)}
                        sous={`${r.delai_livraison_min_min}–${r.delai_livraison_max_min} min`}
                      />
                      <div className="flex items-end justify-start sm:justify-end">
                        <button onClick={() => setSelection(r.id)} className="btn-primary">
                          Ouvrir la fiche
                        </button>
                      </div>
                      {r.statut === "suspendu" && r.motif_suspension && (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive sm:col-span-2 lg:col-span-4">
                          Suspendu — {r.motif_suspension}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selection && <PanneauDetail id={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

function MiniInfo({
  label,
  valeur,
  sous,
}: {
  label: string;
  valeur: string;
  sous?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <p className="label-kpi">{label}</p>
      <p className="mt-1 truncate text-[13px] font-medium">{valeur}</p>
      {sous && <p className="num truncate text-[11px] text-muted-foreground">{sous}</p>}
    </div>
  );
}

function BadgeStatut({ statut }: { statut: RestaurantAdmin["statut"] }) {
  const suspendu = statut === "suspendu";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        suspendu
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-surface-2 text-muted-foreground"
      }`}
    >
      {suspendu ? <ShieldOff className="size-3" /> : <ShieldCheck className="size-3" />}
      {suspendu ? "Suspendu" : "Actif"}
    </span>
  );
}

function PanneauDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [action, setAction] = useState<"paiement" | "suspension" | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["restaurant", id, token],
    queryFn: () => detailRestaurant(token!, id),
    enabled: !!token,
  });

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ["restaurant", id] });
    qc.invalidateQueries({ queryKey: ["restaurants"] });
    qc.invalidateQueries({ queryKey: ["paiements"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const lever = useMutation({
    mutationFn: () => leverSuspension(token!, id),
    onSuccess: rafraichir,
  });

  const r = data?.restaurant ?? null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-slide-left relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background">
        <header className="sticky top-0 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-5 py-3.5 backdrop-blur">
          <h2 className="text-base font-semibold">{r?.nom ?? "Restaurant"}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !data || !r ? (
          <p className="p-6 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Restaurant introuvable."}
          </p>
        ) : (
          <div className="space-y-4 p-4">
            <section className="panel p-4">
              <p className="label-kpi">
                Solde dû
              </p>
              <p
                className="num mt-2 text-3xl font-semibold"
                style={{ color: "var(--color-money)" }}
              >
                {formatFCFA(Number(r.solde_admin))}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setAction("paiement")}
                  className="btn-primary"
                >
                  <Banknote className="size-4" />
                  Encaisser
                </button>
                {r.statut === "actif" ? (
                  <button
                    onClick={() => setAction("suspension")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <ShieldOff className="size-4" />
                    Suspendre
                  </button>
                ) : (
                  <button
                    onClick={() => lever.mutate()}
                    disabled={lever.isPending}
                    className="btn-ghost"
                  >
                    {lever.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    Lever la suspension
                  </button>
                )}
              </div>
              {lever.error && (
                <p className="mt-2 text-xs text-destructive">
                  {(lever.error as Error).message}
                </p>
              )}
            </section>

            {r.statut === "suspendu" && r.motif_suspension && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Suspendu — {r.motif_suspension}
              </p>
            )}

            <section className="panel space-y-2.5 p-4 text-sm">
              <Ligne icone={<MapPin className="size-4" />} label="Quartier" valeur={r.quartier} />
              <Ligne
                icone={<Phone className="size-4" />}
                label="Restaurateur"
                valeur={
                  r.restaurateurs
                    ? `${r.restaurateurs.prenom} ${r.restaurateurs.nom} · ${r.restaurateurs.numero}`
                    : "—"
                }
              />
              <Ligne
                icone={<Clock className="size-4" />}
                label="Horaires"
                valeur={`${r.horaire_ouverture.slice(0, 5)} – ${r.horaire_fermeture.slice(0, 5)}`}
              />
              <Ligne
                icone={<Banknote className="size-4" />}
                label="Livraison"
                valeur={`${formatFCFA(r.prix_livraison)} · ${r.delai_livraison_min_min}–${r.delai_livraison_max_min} min`}
              />
            </section>

            <BlocStats restaurantId={id} soldeActuel={Number(r.solde_admin)} />


            <section className="panel p-4">
              <p className="label-kpi">
                Encaissements de ce restaurant
              </p>
              {data.paiements.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Aucun encaissement enregistré pour l'instant.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {data.paiements.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                      <span className="num font-medium">{formatFCFA(p.montant)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {action === "paiement" && r && (
          <ModalPaiement
            restaurant={r}
            onClose={() => setAction(null)}
            onSuccess={rafraichir}
          />
        )}
        {action === "suspension" && r && (
          <ModalSuspension
            restaurant={r}
            onClose={() => setAction(null)}
            onSuccess={rafraichir}
          />
        )}
      </aside>
    </div>
  );
}

const PERIODES_RESTO: { cle: PeriodeResto; label: string }[] = [
  { cle: "jour", label: "Aujourd'hui" },
  { cle: "semaine", label: "Cette semaine" },
  { cle: "mois", label: "Ce mois" },
  { cle: "tout", label: "En tout" },
];

function BlocStats({ restaurantId, soldeActuel }: { restaurantId: string; soldeActuel: number }) {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<PeriodeResto>("jour");

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats-restaurant", restaurantId, token],
    queryFn: () => statsRestaurant(token!, restaurantId),
    enabled: !!token,
  });

  const s = data?.stats[periode];

  return (
    <section className="panel panel-glow p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-kpi">Activité facturée</p>
        <div className="flex flex-wrap overflow-hidden rounded-lg border border-border bg-surface-2 p-0.5">
          {PERIODES_RESTO.map((p) => (
            <button
              key={p.cle}
              onClick={() => setPeriode(p.cle)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                periode === p.cle ? "seg-active" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[74px]" />
          ))}
        </div>
      ) : error || !s ? (
        <p className="mt-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Statistiques indisponibles."}
        </p>
      ) : (
        <>
          <div key={periode} className="animate-fade-up mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tuile label="Commandes validées" valeur={formatNombre(s.commandes_validees)} />
            <Tuile label="Promotions" valeur={formatNombre(s.promotions)} />
            <Tuile
              label="Dû à l'admin"
              valeur={formatFCFA(s.montant_du)}
              accent
              className="col-span-2 sm:col-span-1"
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Calcul : {formatNombre(s.commandes_validees)} × {formatFCFA(data.parametres.prix_par_commande_payee)}{" "}
            (commande validée) + {formatNombre(s.promotions)} ×{" "}
            {formatFCFA(data.parametres.prix_promotion)} (promotion).
          </p>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2.5">
            <span className="text-[12px] text-muted-foreground">
              Solde admin actuel (restant à encaisser)
            </span>
            <span className="num text-[15px] font-semibold" style={{ color: "var(--color-money)" }}>
              {formatFCFA(data.solde_admin ?? soldeActuel)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function Tuile({
  label,
  valeur,
  accent,
  className = "",
}: {
  label: string;
  valeur: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`lift rounded-lg border border-border bg-surface p-3 ${className}`}>
      <p className="label-kpi text-[10px]">{label}</p>
      <p
        className="num mt-1.5 text-xl font-semibold"
        style={accent ? { color: "var(--color-money)" } : undefined}
      >
        {valeur}
      </p>
    </div>
  );
}


function Ligne({
  icone,
  label,
  valeur,
}: {
  icone: React.ReactNode;
  label: string;
  valeur: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icone}
        {label}
      </span>
      <span className="text-right font-medium">{valeur}</span>
    </div>
  );
}

function ModalPaiement({
  restaurant,
  onClose,
  onSuccess,
}: {
  restaurant: RestaurantAdmin;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [montant, setMontant] = useState(String(Math.round(Number(restaurant.solde_admin)) || ""));

  const m = useMutation({
    mutationFn: () => enregistrerPaiement(token!, restaurant.id, Number(montant)),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal titre={`Encaisser · ${restaurant.nom}`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Solde actuel : <span className="num font-medium text-foreground">{formatFCFA(Number(restaurant.solde_admin))}</span>
      </p>
      <label className="mt-4 block text-sm">
        <span className="text-muted-foreground">Montant encaissé (FCFA)</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="field num mt-1.5"
        />
      </label>
      {m.error && <p className="mt-3 text-sm text-destructive">{(m.error as Error).message}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          Annuler
        </button>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !Number(montant)}
          className="btn-primary"
        >
          {m.isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer l'encaissement
        </button>
      </div>
    </Modal>
  );
}

function ModalSuspension({
  restaurant,
  onClose,
  onSuccess,
}: {
  restaurant: RestaurantAdmin;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [motif, setMotif] = useState("");

  const m = useMutation({
    mutationFn: () => suspendreRestaurant(token!, restaurant.id, motif.trim()),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal titre={`Suspendre · ${restaurant.nom}`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Le restaurant n'apparaîtra plus pour les clients tant que la suspension est active.
      </p>
      <label className="mt-4 block text-sm">
        <span className="text-muted-foreground">Motif de la suspension</span>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          placeholder="Ex. : solde impayé depuis plus de 15 jours"
          className="field mt-1.5 h-auto py-2"
        />
      </label>
      {m.error && <p className="mt-3 text-sm text-destructive">{(m.error as Error).message}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          Annuler
        </button>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !motif.trim()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground disabled:opacity-60"
        >
          {m.isPending && <Loader2 className="size-4 animate-spin" />}
          Confirmer la suspension
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  titre,
  onClose,
  children,
}: {
  titre: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="panel animate-pop relative w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-semibold">{titre}</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
