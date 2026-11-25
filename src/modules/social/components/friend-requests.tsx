import type { FriendRequest } from "../contracts";
import { userLabel } from "../domain/names";
import { CancelRequestButton, IncomingRequestButtons } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

export function FriendRequests({ requests }: { requests: FriendRequest[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
          <UserAvatar user={r.user} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userLabel(r.user)}</p>
            {r.user.username && <p className="text-xs text-muted-foreground">@{r.user.username}</p>}
          </div>
          {r.direction === "incoming" ? (
            <IncomingRequestButtons requestId={r.id} />
          ) : (
            <CancelRequestButton requestId={r.id} />
          )}
        </li>
      ))}
    </ul>
  );
}
