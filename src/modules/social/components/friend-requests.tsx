import { displayName } from "../domain/names";
import type { FriendRequest } from "../server/queries";
import { RequestButtons } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

export function FriendRequests({ requests, received }: { requests: FriendRequest[]; received: boolean }) {
  return (
    <ul className="divide-y rounded-lg border">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
          <UserAvatar profile={r.profile} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName(r.profile)}</p>
            {r.profile.username && <p className="text-xs text-muted-foreground">@{r.profile.username}</p>}
          </div>
          <RequestButtons friendshipId={r.id} received={received} />
        </li>
      ))}
    </ul>
  );
}
