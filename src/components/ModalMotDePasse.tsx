import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ChampMotDePasse } from "./ChampMotDePasse";
import { changerMotDePasse } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";

export function ModalMotDePasse({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!ancien || !nouveau) return setErreur("Tous les champs sont obligatoires.");
    if (nouveau !== confirmation) return setErreur("La confirmation ne correspond pas.");
    if (!token) return setErreur("Session expirée.");
    setEnvoi(true);
    try {
      await changerMotDePasse(token, ancien, nouveau);
      setSucces(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec du changement de mot de passe.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Changer de mot de passe</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Le mot de passe unique d'accès à la console.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {succes ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              Mot de passe mis à jour avec succès.
            </p>
            <button
              onClick={onClose}
              className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={soumettre} className="space-y-4">
            <ChampMotDePasse
              id="ancien"
              label="Ancien mot de passe"
              value={ancien}
              onChange={setAncien}
              autoFocus
            />
            <ChampMotDePasse
              id="nouveau"
              label="Nouveau mot de passe"
              value={nouveau}
              onChange={setNouveau}
            />
            <ChampMotDePasse
              id="confirmation"
              label="Confirmer le nouveau mot de passe"
              value={confirmation}
              onChange={setConfirmation}
            />
            {erreur && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erreur}
              </p>
            )}
            <button
              type="submit"
              disabled={envoi}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {envoi && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
