# Module `social` — amis, fil, encouragements

Tables (migrations de Stan) : `friendships`, `posts`, `post_reactions`, lecture de `user_stats`. Les posts sont créés par
`finish_study_session` (jamais de note, la matière n'y figure que si l'auteur l'a autorisée, D-16). Un post est lisible
par son auteur et ses amis ; l'auteur peut le supprimer.

Ajouté par la PR `charles/focus-social-v2` (contrat `API_CONTRACTS.md` §4) :

- Serveur : `searchUsers` (préfixe du pseudo, 3 à 24 car.), `sendFriendRequest`, `respondFriendRequest`,
  `cancelFriendRequest`, `removeFriend`, `toggleReaction`, `listFriends`, `listFriendRequests`, `getLiveFriends`,
  `getFeed` (curseur, 20 max).
- UI : `FeedCard`, `ReactionButton`, `FriendsStudying`, `FriendList`, `FriendRequests`, `FriendSearch`, `UserAvatar`.
- « Amis en révision » : séance partagée avec heartbeat < 3 min ; page rafraîchie toutes les 30 s (D-19). La matière n'est
  jamais montrée en direct (table privée).

Pas encore : `getSocialProfile`, blocage, signalement, `deletePost`, bouton « voir plus » du fil (l'API le gère),
limitation de débit de la recherche (`rate_limited` n'est jamais renvoyé).

## Invitations par lien (`share-invite.tsx`, `/invite/[code]`)

Le lien `…/invite/<pseudo>` est personnel et **sans table** : son code est le pseudo, déjà public (les amis le cherchent).
Il n'expose rien de plus. Un visiteur qui l'ouvre voit une page d'accueil neutre (un visiteur anonyme ne peut pas lire les
profils), son code est gardé une semaine dans un cookie (`revio-invite`, qui ne contient que le pseudo), puis, **après l'inscription ou la
connexion et l'onboarding**, la mise en page de l'app envoie la demande d'ami (`acceptPendingInvite`, qui passe par
`sendFriendRequest` : mêmes règles et même RLS qu'une demande tapée à la main) et supprime le cookie : jamais deux fois.
Un utilisateur déjà connecté est envoyé sur Social. Partage : QR code (`uqr`, MIT), feuille de partage du téléphone
(`navigator.share`, qui liste Instagram, Snapchat, Messenger…), WhatsApp (`wa.me`), SMS (`sms:`), Snapchat
(`snapchat.com/scan?attachmentUrl=`, lien public non vérifié sur un vrai compte), « Copier le lien ». Instagram et Messenger
n'ont pas de lien web sans identifiant d'application : ils passent par la feuille de partage, sinon le lien est copié avec
une note. Limites : le lien n'expire pas (changer de pseudo l'invalide) et il n'est pas à usage unique.
