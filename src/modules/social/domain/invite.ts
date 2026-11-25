/**
 * The ready-made message a user copies to invite someone. It carries the sender's username and no link:
 * a real invitation link needs a token, an expiry and single use, which only the server can provide.
 */
export function inviteMessage(username: string): string {
  return [
    "Salut ! Je révise avec Revio, une appli de révision avec des amis.",
    `Crée ton compte, puis dans Social → Ajouter un ami, cherche mon pseudo : ${username}`,
  ].join("\n");
}
