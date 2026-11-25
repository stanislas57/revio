import Link from "next/link";
import { EyeOff, Flame, Lock, Sparkles, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/modules/focus/domain/format";
import { levelProgress } from "@/modules/gamification/domain/levels";
import type { SocialProfile } from "../../contracts";
import { userLabel } from "../../domain/names";
import { profileVisibility, relationLabel, type SharedSession } from "../../domain/profile-view";
import { UserAvatar } from "../user-avatar";
import { SharedSessions } from "./shared-sessions";

const nf = new Intl.NumberFormat("fr-FR");

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
      {hint && <dd className="text-sm text-muted-foreground">{hint}</dd>}
    </div>
  );
}

/**
 * A user's social profile. What it shows depends on who looks (my own profile as friends see it,
 * a friend's, or a limited one for someone who is not a friend). Identity and game data only:
 * never a grade, an average or a subject. `action` is an optional slot for the relation button
 * (add, accept...), wired by the server layer.
 */
export function SocialProfileView({
  profile,
  sessions,
  action,
}: {
  profile: SocialProfile;
  sessions: readonly SharedSession[];
  action?: React.ReactNode;
}) {
  const visibility = profileVisibility(profile.relation);
  const name = userLabel(profile);
  const level = levelProgress(profile.totalXp);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <UserAvatar user={profile} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words">{name}</h1>
          {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          <p className="mt-1 inline-flex rounded-full border px-3 py-0.5 text-sm font-medium">
            {relationLabel(profile.relation)}
          </p>
        </div>
        {action}
      </header>

      {visibility === "self" && (
        <section
          aria-labelledby="self-note"
          className="space-y-2 rounded-xl border border-brand/50 bg-brand-soft p-4 text-brand-soft-foreground"
        >
          <h2 id="self-note" className="flex items-center gap-2 text-sm font-semibold">
            <EyeOff className="size-4" aria-hidden /> Ton profil tel que tes amis le voient
          </h2>
          <p className="text-sm">
            Restent privés : tes notes, tes moyennes, tes matières, tes objectifs scolaires et tes
            disponibilités.
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/profil">Gérer mon profil et mes réglages</Link>
          </Button>
        </section>
      )}

      {visibility === "limited" ? (
        <section
          aria-labelledby="limited-note"
          className="space-y-2 rounded-xl border border-dashed p-6 text-center"
        >
          <Lock className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <h2 id="limited-note" className="font-semibold">
            Profil limité
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Le niveau, les XP, la série et les séances de {name} ne sont visibles que par ses amis.
          </p>
        </section>
      ) : (
        <>
          <section aria-labelledby="stats-title" className="space-y-3">
            <h2 id="stats-title" className="text-lg font-semibold">
              Progression
            </h2>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat
                icon={<Sparkles className="size-4 text-brand-text" aria-hidden />}
                label="Niveau"
                value={`${profile.level.number} · ${profile.level.name}`}
              />
              <Stat
                icon={<Sparkles className="size-4 text-brand-text" aria-hidden />}
                label="XP"
                value={`${nf.format(profile.totalXp)} XP`}
                hint={
                  level.next && level.xpUntilNextLevel !== null
                    ? `${nf.format(level.xpUntilNextLevel)} avant ${level.next.name}`
                    : "Niveau max"
                }
              />
              <Stat
                icon={<Flame className="size-4 text-orange-500" aria-hidden />}
                label="Série"
                value={`${profile.streak.currentDays} jour${profile.streak.currentDays > 1 ? "s" : ""}`}
                hint={`Record : ${profile.streak.recordDays} jour${profile.streak.recordDays > 1 ? "s" : ""}`}
              />
              <Stat
                icon={<Timer className="size-4" aria-hidden />}
                label="Temps révisé"
                value={formatMinutes(profile.totalStudyMinutes)}
              />
              <Stat
                icon={<Users className="size-4" aria-hidden />}
                label="Amis"
                value={String(profile.friendsCount)}
              />
            </dl>
          </section>

          <section aria-labelledby="sessions-title" className="space-y-3">
            <h2 id="sessions-title" className="text-lg font-semibold">
              Dernières séances partagées
            </h2>
            <SharedSessions
              sessions={sessions}
              emptyText={
                visibility === "self"
                  ? "Tu n'as pas encore partagé de séance."
                  : `${name} n'a pas encore partagé de séance.`
              }
            />
            {visibility === "friend" && (
              <p className="text-sm text-muted-foreground">
                Vous êtes amis : tu vois son niveau, ses XP, sa série et ses séances partagées. Ses notes, ses
                moyennes et ses matières ne sont jamais visibles.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
