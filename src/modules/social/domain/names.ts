/** Name shown in the UI: display name, else @username, else a neutral fallback. */
export function displayName(p: { display_name?: string | null; username?: string | null }): string {
  const name = p.display_name?.trim();
  if (name) return name;
  if (p.username) return `@${p.username}`;
  return "Étudiant Revio";
}

/** Up to two initials for avatars. */
export function initials(p: { display_name?: string | null; username?: string | null }): string {
  const source = p.display_name?.trim() || p.username || "?";
  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : source.slice(0, 2);
  return letters.toUpperCase();
}
