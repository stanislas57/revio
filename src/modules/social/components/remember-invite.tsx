"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "../domain/invite";

/**
 * On the invitation page: remembers the invitation in a cookie (only the sender's username, which is public),
 * so the friend request is sent after sign-up or sign-in. A visitor who is already signed in goes straight to
 * Social, where the app layout sends it.
 */
export function RememberInvite({ code, signedIn }: { code: string; signedIn: boolean }) {
  const router = useRouter();
  useEffect(() => {
    document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(code)}; Max-Age=${INVITE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
    if (signedIn) router.replace("/social");
  }, [code, signedIn, router]);
  return null;
}
