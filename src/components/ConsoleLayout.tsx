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
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { ModalMotDePasse } from "./ModalMotDePasse";

const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", court: "Bord", icon: LayoutDashboard },
  { to: "/restaurants", label: "Restaurants", court: "Restos", icon: Store },
  { to: "/historique-paiements", label: "Historique des paiements", court: "Paiements", icon: Receipt },
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
      <div className="grid-surface flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  const titreCourant = NAV.find((n) => n.to === pathname)?.label ?? "Console";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[15rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2.5 px-4">
          <span
            className="relative grid size-7 place-items-center rounded-md text-[13px] font-bold text-primary-foreground"
            style={{
              backgroundImage:
                "linear-gradient(140deg, var(--color-primary), var(--color-money))",
            }}
          >
            G
            <span
              aria-hidden
              className="animate-pulse-ring absolute inset-0 rounded-md ring-2 ring-primary"
            />
          </span>
          <span className="wordmark text-gradient text-[16px]">GAO FOOD</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
          <p className="label-kpi px-2.5 pt-2 pb-2 text-[10px]">Pilotage</p>
          {NAV.map(({ to, label, icon: Icon }) => {
            const actif = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-[13px] transition-all duration-200 ${
                  actif
                    ? "seg-active font-semibold"
                    : "sheen text-sidebar-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary transition-all duration-300 ${
                    actif ? "opacity-100" : "scale-y-0 opacity-0"
                  }`}
                />
                <Icon
                  className={`size-4 transition-colors ${actif ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                />
                <span className="truncate">{label}</span>
                <ChevronRight
                  className={`ml-auto size-3.5 text-muted-foreground transition-all duration-200 ${
                    actif ? "opacity-70" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3.5">
          <p className="text-[11px] font-medium text-foreground">Moussa Issoufi MAYGA</p>
          <p className="text-[10px] text-muted-foreground">Console admin · Gao, Mali</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2">
            <span className="wordmark text-[15px] md:hidden">GAO FOOD</span>
            <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="size-1.5 rounded-full bg-primary" />
              {titreCourant}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Basculer le thème"
              className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:rotate-12 hover:bg-accent hover:text-foreground active:scale-95"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOuvert((v) => !v)}
                aria-label="Profil"
                className="grid size-8 place-items-center rounded-lg border border-border bg-surface-2 text-foreground transition-all duration-200 hover:bg-accent active:scale-95"
              >
                <User className="size-4" />
              </button>
              {menuOuvert && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOuvert(false)} />
                  <div className="panel animate-panel-in absolute right-0 z-50 mt-2 w-72 p-4">
                    <p className="label-kpi">Profil administrateur</p>
                    <dl className="mt-3 space-y-2.5 text-[13px]">
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
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-foreground transition-colors hover:bg-accent"
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
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
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

        <main
          key={pathname}
          className="animate-fade-up grid-surface aurora flex-1 overflow-hidden px-4 py-5 sm:px-6"
        >
          {children}
        </main>

        <nav className="sticky bottom-0 z-30 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          {NAV.map(({ to, court, icon: Icon }) => {
            const actif = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                  actif ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {actif && (
                  <span aria-hidden className="absolute top-0 h-[2px] w-8 rounded-full bg-primary" />
                )}
                <Icon className="size-4" />
                {court}
              </Link>
            );
          })}
        </nav>
      </div>

      {modal && <ModalMotDePasse onClose={() => setModal(false)} />}
    </div>
  );
}
