import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Medal, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/modules/profile/server/queries";
import { AutoRefresh } from "@/modules/social/components/auto-refresh";
import { FeedCard } from "@/modules/social/components/feed-card";
import { FriendList } from "@/modules/social/components/friend-list";
import { FriendRequests } from "@/modules/social/components/friend-requests";
import { FriendSearch } from "@/modules/social/components/friend-search";
import { ShareInvite } from "@/modules/social/components/share-invite";
import { SectionLinks } from "@/modules/social/components/section-links";
import { FIXTURE_PROFILE_FRIEND } from "@/modules/social/fixtures-profiles";
import { FriendsStudying } from "@/modules/social/components/friends-studying";
import { LeaderboardCard } from "@/modules/social/components/leaderboard/leaderboard-card";
import { getWeeklyLeaderboard } from "@/modules/social/server/leaderboard";
import { countUnreadNotifications } from "@/modules/social/server/notifications";
import { getFeed, getLiveFriends, listFriendRequests, listFriends } from "@/modules/social/server/queries";

export const metadata: Metadata = { title: "Social" };

export default async function SocialPage() {
  const [profile, feed, live, friends, requests, unread, board] = await Promise.all([
    getMyProfile(),
    getFeed(),
    getLiveFriends(),
    listFriends(),
    listFriendRequests(),
    countUnreadNotifications(),
    // The ranking card is a bonus: if it cannot be read, the rest of the page still opens.
    getWeeklyLeaderboard().catch(() => null),
  ]);
  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader title="Social" description="Tes amis et le fil de leurs séances." />
      <div className="space-y-8">
        <SectionLinks
          label="Notifications, classement et exemple de profil"
          links={[
            {
              href: "/social/notifications",
              title: "Notifications",
              description:
                unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Demandes d'ami et bravos.",
              icon: Bell,
            },
            {
              href: "/social/classement",
              title: "Classement",
              description: "Tes XP de la semaine, comparés à ceux de tes amis.",
              icon: Medal,
            },
            {
              // Real friends cannot be linked yet: getSocialProfile does not exist (S-09), so only the sample ids resolve.
              href: `/social/amis/${FIXTURE_PROFILE_FRIEND.id}`,
              title: "Exemple de profil d'ami",
              description: "Ce qu'un ami voit de toi : niveau, série, séances partagées.",
              icon: UserRound,
              mock: true,
            },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-8">
            <FriendsStudying friends={live} />

            <section className="space-y-3" aria-labelledby="feed-title">
              <h2 id="feed-title" className="text-xl font-extrabold">
                Fil d&apos;activité
              </h2>
              {feed.posts.length > 0 ? (
                <div className="space-y-3">
                  {feed.posts.map((post) => (
                    <FeedCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title={friends.length === 0 ? "Pas encore d'amis" : "Aucune activité récente"}
                  description={
                    friends.length === 0
                      ? "Ajoute des amis ci-dessous. Le fil ne montre que les séances qu'ils choisissent de partager. Jamais leurs notes."
                      : "Termine une séance Focus : elle apparaîtra ici, ainsi que celles de tes amis."
                  }
                >
                  {friends.length === 0 ? (
                    <Button asChild className="min-h-11">
                      <Link href="#ajouter-ami">Ajoute ton premier ami</Link>
                    </Button>
                  ) : (
                    <Button asChild className="min-h-11">
                      <Link href="/focus">Lance une séance</Link>
                    </Button>
                  )}
                </EmptyState>
              )}
            </section>

            {incoming.length > 0 && (
              <section className="space-y-3" aria-labelledby="received-title">
                <h2 id="received-title" className="text-xl font-extrabold">
                  Demandes reçues ({incoming.length})
                </h2>
                <FriendRequests requests={incoming} />
              </section>
            )}

            <section className="space-y-3" aria-labelledby="friends-title">
              <h2 id="friends-title" className="text-xl font-extrabold">
                Mes amis ({friends.length})
              </h2>
              {friends.length > 0 ? (
                <FriendList friends={friends} />
              ) : (
                <p className="text-sm text-muted-foreground">Aucun ami pour l&apos;instant.</p>
              )}
            </section>

            <section id="ajouter-ami" className="scroll-mt-20 space-y-3" aria-labelledby="add-title">
              <h2 id="add-title" className="text-xl font-extrabold">
                Ajouter un ami
              </h2>
              <FriendSearch />
              {profile.username && <ShareInvite username={profile.username} />}
              {outgoing.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-muted-foreground">Demandes envoyées</h3>
                  <FriendRequests requests={outgoing} />
                </div>
              )}
            </section>
          </div>
          {board && (
            <div className="lg:sticky lg:top-6">
              <LeaderboardCard entries={board.entries} participation={board.participation} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
