import { Download, Trash2 } from "lucide-react";
import { NotImplemented } from "@/components/states/not-implemented";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIENCE_TITLES, groupByAudience, MY_DATA, NOT_COLLECTED } from "../domain/my-data";

/** "Mes données": what is kept, who sees it, and (not working yet) export and deletion. */
export function MyData() {
  return (
    <Card id="mes-donnees" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Mes données</CardTitle>
        <CardDescription>
          Ce que Revio garde sur toi et ce que voient les autres, en clair. {NOT_COLLECTED}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupByAudience(MY_DATA).map(({ audience, items }) => (
          <section key={audience} aria-labelledby={`data-${audience}`} className="space-y-2">
            <h3 id={`data-${audience}`} className="text-sm font-semibold">
              {AUDIENCE_TITLES[audience]}
            </h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section aria-labelledby="data-actions" className="space-y-3">
          <h3 id="data-actions" className="text-sm font-semibold">
            Récupérer ou supprimer mes données
          </h3>
          <NotImplemented
            owner="Stan"
            feature="L'export de tes données et la suppression du compte ne sont pas encore disponibles : les boutons ci-dessous sont désactivés."
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled className="min-h-11">
              <Download className="size-4" aria-hidden />
              Exporter mes données
            </Button>
            <Button type="button" variant="outline" disabled className="min-h-11 text-destructive">
              <Trash2 className="size-4" aria-hidden />
              Supprimer mon compte
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
