/** Same format as a username (`profileUpdateSchema`): 3 to 24 lowercase letters, digits or "_". */
export const INVITE_CODE_PATTERN = /^[a-z0-9_]{3,24}$/;

/** Name of the cookie that remembers an invitation until the visitor has signed up or signed in. */
export const INVITE_COOKIE = "revio-invite";
/** The invitation is remembered for a week. */
export const INVITE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/** The code of an invitation link IS the sender's username: public (friends search by it), nothing else is exposed. */
export const isInviteCode = (value: string): boolean => INVITE_CODE_PATTERN.test(value);

/** `https://site/invite/<username>` from the site origin. */
export function inviteUrl(origin: string, username: string): string {
  return `${origin.replace(/\/$/, "")}/invite/${encodeURIComponent(username)}`;
}

/**
 * The ready-made message of an invitation: the link first, so it stays clickable, and the username as a
 * fallback (one can still search for it in Social → Ajouter un ami).
 */
export function inviteMessage(username: string, url?: string): string {
  return [
    "Salut ! Je révise avec Revio, une appli de révision avec des amis.",
    url ? `Rejoins-moi : ${url}` : "",
    `Ou cherche mon pseudo dans Social → Ajouter un ami : ${username}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type ShareTarget = "whatsapp" | "sms" | "snapchat";

/**
 * Public share links that need no API key and no app id: WhatsApp (wa.me), SMS (sms:) and Snapchat's web share
 * (`snapchat.com/scan?attachmentUrl=`). Instagram and Messenger have no such link: they go through the share
 * sheet of the phone (`navigator.share`), or through "copy the link".
 */
export function shareLink(target: ShareTarget, url: string, text: string): string {
  switch (target) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case "sms":
      return `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
    case "snapchat":
      return `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`;
  }
}
