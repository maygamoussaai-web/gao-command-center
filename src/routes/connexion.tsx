import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/connexion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Accès sécurisé à la console d'administration GAO FOOD : pilotage des restaurants et des soldes à Gao.",
      },
      { property: "og:title", content: "Connexion · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Accès sécurisé à la console d'administration de la plateforme GAO FOOD.",
      },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const { connexion, token, chargement } = useAuth();
  const navigate = useNavigate();
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!chargement && token) navigate({ to: "/tableau-de-bord", replace: true });
  }, [chargement, token, navigate]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!motDePasse) return setErreur("Veuillez saisir votre mot de passe.");
    setEnvoi(true);
    try {
      await connexion(motDePasse);
      navigate({ to: "/tableau-de-bord", replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
            G
          </div>
          <h1 className="wordmark text-2xl text-foreground">GAO FOOD</h1>
          <p className="mt-1.5 text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Console Admin
          </p>
        </div>

        <div className="panel p-6">
          <form onSubmit={soumettre} className="space-y-5">
            <ChampMotDePasse
              id="mot_de_passe"
              label="Mot de passe administrateur"
              value={motDePasse}
              onChange={setMotDePasse}
              placeholder="••••••••"
              autoFocus
            />
            {erreur && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erreur}
              </p>
            )}
            <button
              type="submit"
              disabled={envoi}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {envoi && <Loader2 className="size-4 animate-spin" />}
              Se connecter
            </button>
          </form>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Accès réservé au fondateur · Gao, Mali
        </p>
      </div>
    </div>
  );
}
