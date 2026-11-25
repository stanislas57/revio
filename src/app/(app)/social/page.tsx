import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { AutoRefresh } from "@/modules/social/components/auto-refresh";
import { FeedCard } from "@/modules/social/components/feed-card";
import { FriendList } from "@/modules/social/components/friend-list";
import { FriendRequests } from "@/modules/social/components/friend-requests";
import { FriendSearch } from "@/modules/social/components/friend-search";
import { FriendsStudying } from "@/modules/social/components/friends-studying";
import { getFeed, getLiveFriends, listFriendRequests, listFriends } from "@/modules/social/server/queries";

export const metadata: Metadata = { title: "Social" };

export default async function SocialPage() {
  const [feed, live, friends, requests] = await Promise.all([
    getFeed(),
    getLiveFriends(),
    listFriends(),
    listFriendRequests(),
  ]);
  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader title="Social" description="Tes amis et le fil de leurs séances." />
      <div className="space-y-8">
        <FriendsStudying friends={live} />

        <section className="space-y-3" aria-labelledby="feed-title">
          <h2 id="feed-title" className="text-lg font-semibold">
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
            />
          )}
        </section>

        {incoming.length > 0 && (
          <section className="space-y-3" aria-labelledby="received-title">
            <h2 id="received-title" className="text-lg font-semibold">
              Demandes reçues ({incoming.length})
            </h2>
            <FriendRequests requests={incoming} />
          </section>
        )}

        <section className="space-y-3" aria-labelledby="friends-title">
          <h2 id="friends-title" className="text-lg font-semibold">
            Mes amis ({friends.length})
          </h2>
          {friends.length > 0 ? (
            <FriendList friends={friends} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun ami pour l&apos;instant.</p>
          )}
        </section>

        <section className="space-y-3" aria-labelledby="add-title">
          <h2 id="add-title" className="text-lg font-semibold">
            Ajouter un ami
          </h2>
          <FriendSearch />
          {outgoing.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">Demandes envoyées</h3>
              <FriendRequests requests={outgoing} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
