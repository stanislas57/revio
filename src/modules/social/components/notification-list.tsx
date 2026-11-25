"use client";

import Link from "next/link";
import { useTransition } from "react";
import { BellOff } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "../contracts";
import { notificationHref, notificationText, unreadCount } from "../domain/notifications";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationList({
  items,
  onMarkAllRead,
}: {
  items: NotificationItem[];
  onMarkAllRead: () => Promise<ActionResult<null>>;
}) {
  const [pending, startTransition] = useTransition();
  const unread = unreadCount(items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="Aucune notification"
        description="Les demandes d'ami, les acceptations et les bravos apparaîtront ici."
      />
    );
  }
  return (
    <section aria-labelledby="notif-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="notif-title" className="font-semibold">
          {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}
        </h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={unread === 0 || pending}
          onClick={() =>
            startTransition(async () => {
              const res = await onMarkAllRead();
              if (!res.ok) toast.error(res.error.message);
            })
          }
        >
          Tout marquer comme lu
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <Link
              href={notificationHref()}
              className="flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Non lue" />}
              <span className="min-w-0 flex-1 text-sm">
                <strong>{n.actor.displayName}</strong> {notificationText(n)}
                <span className="block text-xs text-muted-foreground">
                  {DATE.format(new Date(n.createdAt))}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
