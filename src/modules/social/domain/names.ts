type NameParts = { displayName: string; username: string | null };

/** Name shown in the UI: display name, else @username, else a neutral fallback. */
export function userLabel(u: NameParts): string {
  const name = u.displayName.trim();
  if (name) return name;
  if (u.username) return `@${u.username}`;
  return "Étudiant Revio";
}

/** Up to two initials for avatars. */
export function initials(u: NameParts): string {
  const source = u.displayName.trim() || u.username || "?";
  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : source.slice(0, 2);
  return letters.toUpperCase();
}
