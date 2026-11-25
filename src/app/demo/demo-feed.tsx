"use client";

import type { ActionResult } from "@/lib/contracts";
import type { FeedPost, ReactionState } from "@/modules/social/contracts";
import { FeedCard } from "@/modules/social/components/feed-card";

/** Local-only reaction: the demo never calls the server. */
async function fakeToggle(): Promise<ActionResult<ReactionState>> {
  return { ok: true, data: { reactionsCount: 0, hasReacted: true } };
}

export function DemoFeed({ posts }: { posts: FeedPost[] }) {
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} onToggle={fakeToggle} />
      ))}
    </div>
  );
}
