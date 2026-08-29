import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";

export const Route = createFileRoute("/restaurants")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restaurants · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Gestion des restaurants partenaires de GAO FOOD : soldes, suspensions et paramètres économiques.",
      },
      { property: "og:title", content: "Restaurants · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Gestion des restaurants partenaires de la plateforme GAO FOOD.",
      },
    ],
  }),
  component: () => (
    <ConsoleLayout>
      <Placeholder />
    </ConsoleLayout>
  ),
});

function Placeholder() {
  return (
    <div className="panel mx-auto mt-10 max-w-md p-8 text-center">
      <Store className="mx-auto size-6 text-muted-foreground" />
      <h1 className="mt-3 text-base font-semibold">Restaurants</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Cette section arrive bientôt : liste des restaurants, soldes dus et suspensions.
      </p>
    </div>
  );
}
