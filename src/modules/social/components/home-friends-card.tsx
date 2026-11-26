import { Users } from "lucide-react";
import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";

/** Home: number of friends and how many are studying right now. Links to Social. */
export function HomeFriendsCard({ friends, studyingNow }: { friends: number; studyingNow: number }) {
  return (
    <LinkCard href="/social" label="Voir mes amis" className="h-full">
      <OrganicCard className="h-full justify-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"
        >
          <Users className="size-7" />
        </span>
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Amis</h2>
        <p className="font-heading text-4xl font-extrabold tabular-nums">{friends}</p>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {studyingNow > 0 && <span aria-hidden className="size-2.5 rounded-full bg-revio-success" />}
          {friends === 0
            ? "Ajoute ton premier ami."
            : studyingNow > 0
              ? `${studyingNow} en révision maintenant`
              : "Personne ne révise en ce moment."}
        </p>
      </OrganicCard>
    </LinkCard>
  );
}
