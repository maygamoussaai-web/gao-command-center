import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";

export const Route = createFileRoute("/historique-paiements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Historique des paiements · GAO FOOD Console Admin" },
      {
        name: "description",
        content:
          "Historique des encaissements effectués auprès des restaurateurs partenaires de GAO FOOD.",
      },
      { property: "og:title", content: "Historique des paiements · GAO FOOD Console Admin" },
      {
        property: "og:description",
        content: "Suivi des encaissements des restaurateurs de la plateforme GAO FOOD.",
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
      <Receipt className="mx-auto size-6 text-muted-foreground" />
      <h1 className="mt-3 text-base font-semibold">Historique des paiements</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Cette section arrive bientôt : encaissements enregistrés, dates et montants en FCFA.
      </p>
    </div>
  );
}
