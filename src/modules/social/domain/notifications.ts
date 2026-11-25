/** Notification wording (pure). One sentence per kind; the actor's display name comes first. */

import type { NotificationItem, NotificationKind } from "../contracts";

const TEXT: Readonly<Record<NotificationKind, string>> = {
  friend_request: "t'a envoyé une demande d'ami.",
  friend_accepted: "a accepté ta demande d'ami.",
  post_reaction: "t'a envoyé un bravo sur une de tes séances.",
};

export function notificationText(n: Pick<NotificationItem, "kind">): string {
  return TEXT[n.kind];
}

/** Where a notification leads: requests and acceptances to the friends list, bravos to the feed. */
export function notificationHref(): string {
  return "/social";
}

export function unreadCount(list: readonly Pick<NotificationItem, "read">[]): number {
  return list.filter((n) => !n.read).length;
}
