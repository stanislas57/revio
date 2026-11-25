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
