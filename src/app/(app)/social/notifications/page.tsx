import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/modules/social/components/notification-list";
import { NotificationPrefsForm } from "@/modules/social/components/notification-prefs";
import {
  markAllNotificationsRead,
  updateNotificationPrefs,
} from "@/modules/social/server/notification-actions";
import { getNotificationPrefs, listNotifications } from "@/modules/social/server/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const [items, prefs] = await Promise.all([listNotifications(), getNotificationPrefs()]);
  return (
    <>
      <Link
        href="/social"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au social
      </Link>
      <PageHeader title="Notifications" description="Ce qui se passe avec tes amis. Rien d'autre." />
      <div className="space-y-6">
        <NotificationList items={items} onMarkAllRead={markAllNotificationsRead} />
        <NotificationPrefsForm initial={prefs} onSave={updateNotificationPrefs} />
      </div>
    </>
  );
}
