import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
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
  suspendreRestaurant,
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
          <h1 className="text-xl font-semibold">Restaurants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNombre(data.length)} restaurants partenaires · {formatFCFA(totalDu)} à encaisser
            {suspendus > 0 ? ` · ${formatNombre(suspendus)} suspendu(s)` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un restaurant"
              className="h-9 w-56 rounded-lg border border-border bg-surface-2 pr-3 pl-8 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtre === f.cle
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
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

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-border px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase md:grid">
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
            {liste.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelection(r.id)}
                  className="grid w-full grid-cols-1 gap-2 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-accent/50 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {r.logo_url ? (
                      <img
                        src={r.logo_url}
                        alt={`Logo ${r.nom}`}
                        loading="lazy"
                        className="size-9 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
                        <Store className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.nom}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.quartier}</p>
                    </div>
                  </div>
                  <div className="min-w-0 text-xs text-muted-foreground md:text-sm">
                    <p className="truncate text-foreground">
                      {r.restaurateurs
                        ? `${r.restaurateurs.prenom} ${r.restaurateurs.nom}`
                        : "Restaurateur inconnu"}
                    </p>
                    <p className="num truncate text-xs text-muted-foreground">
                      {r.restaurateurs?.numero ?? "—"}
                    </p>
                  </div>
                  <p
                    className="num text-sm font-semibold md:text-right"
                    style={
                      Number(r.solde_admin) > 0 ? { color: "var(--color-money)" } : undefined
                    }
                  >
                    {formatFCFA(Number(r.solde_admin))}
                  </p>
                  <div className="md:text-right">
                    <BadgeStatut statut={r.statut} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selection && <PanneauDetail id={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

function BadgeStatut({ statut }: { statut: RestaurantAdmin["statut"] }) {
  const suspendu = statut === "suspendu";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background">
        <header className="sticky top-0 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
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
        ) : error || !r ? (
          <p className="p-6 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Restaurant introuvable."}
          </p>
        ) : (
          <div className="space-y-5 p-5">
            <section className="panel p-5">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
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
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
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
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-60"
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

            <section className="panel space-y-3 p-5 text-sm">
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

            <section className="panel p-5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Activité facturée
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ["Aujourd'hui", data.stats.jour],
                    ["Cette semaine", data.stats.semaine],
                    ["Ce mois", data.stats.mois],
                  ] as const
                ).map(([label, s]) => (
                  <div key={label} className="rounded-lg border border-border bg-surface-2 p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="num mt-1 text-lg font-semibold">
                      {formatNombre(s.commandes_validees)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatNombre(s.promotions)} promo.
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel p-5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
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
          className="num mt-1.5 h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary"
        />
      </label>
      {m.error && <p className="mt-3 text-sm text-destructive">{(m.error as Error).message}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-sm">
          Annuler
        </button>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !Number(montant)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      {m.error && <p className="mt-3 text-sm text-destructive">{(m.error as Error).message}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-sm">
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="panel relative w-full max-w-md p-6">
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
