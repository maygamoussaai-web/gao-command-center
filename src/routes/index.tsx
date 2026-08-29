import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "GAO FOOD — Console Admin" },
      {
        name: "description",
        content:
          "Console d'administration GAO FOOD : commandes, chiffre d'affaires, restaurants et soldes dus à Gao, Mali.",
      },
      { property: "og:title", content: "GAO FOOD — Console Admin" },
      {
        property: "og:description",
        content: "Pilotage quotidien de la plateforme de commande de repas GAO FOOD.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { token, chargement } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (chargement) return;
    navigate({ to: token ? "/tableau-de-bord" : "/connexion", replace: true });
  }, [chargement, token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
