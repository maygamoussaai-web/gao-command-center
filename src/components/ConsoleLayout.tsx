import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  Receipt,
  User,
  Moon,
  Sun,
  LogOut,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { ModalMotDePasse } from "./ModalMotDePasse";

const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/restaurants", label: "Restaurants", icon: Store },
  { to: "/historique-paiements", label: "Historique des paiements", icon: Receipt },
] as const;

export function ConsoleLayout({ children }: { children: ReactNode }) {
  const { token, profil, chargement, deconnexion } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [modal, setModal] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!chargement && !token) navigate({ to: "/connexion", replace: true });
  }, [chargement, token, navigate]);

  if (chargement || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            G
          </span>
          <span className="wordmark text-[17px] text-foreground">GAO FOOD</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const actif = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  actif
                    ? "bg-sidebar-accent font-medium text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 text-[11px] text-muted-foreground">Console admin · Gao, Mali</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-5 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <span className="wordmark text-base">GAO FOOD</span>
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">
            Pilotage de la plateforme
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Basculer le thème"
              className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOuvert((v) => !v)}
                aria-label="Profil"
                className="grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-foreground transition-colors hover:bg-accent"
              >
                <User className="size-4" />
              </button>
              {menuOuvert && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOuvert(false)} />
                  <div className="panel absolute right-0 z-50 mt-2 w-72 p-4">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Profil administrateur
                    </p>
                    <dl className="mt-3 space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Prénom</dt>
                        <dd className="font-medium">{profil?.prenom ?? "Moussa Issoufi"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Nom</dt>
                        <dd className="font-medium">{profil?.nom ?? "MAYGA"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Numéro</dt>
                        <dd className="num font-medium">{profil?.numero ?? "60673302"}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 space-y-1 border-t border-border pt-3">
                      <button
                        onClick={() => {
                          setMenuOuvert(false);
                          setModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        <KeyRound className="size-4 text-muted-foreground" />
                        Changer de mot de passe
                      </button>
                      <button
                        onClick={() => {
                          setMenuOuvert(false);
                          deconnexion();
                          navigate({ to: "/connexion", replace: true });
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="size-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6">{children}</main>

        <nav className="sticky bottom-0 flex border-t border-border bg-background/95 backdrop-blur md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${
                pathname === to ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>

      {modal && <ModalMotDePasse onClose={() => setModal(false)} />}
    </div>
  );
}
