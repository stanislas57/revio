# Module `social` — amis, fil, encouragements

Tables : `friendships` (initiale), `posts`, `post_reactions` (migration `20261125030000`), lecture de `user_stats`.
Un post est créé par `finalize_study_session` ; il est visible par les amis **tant que la séance est partagée**
(la RLS de `posts` suit celle de `study_sessions`). Aucune note n'apparaît dans un post (D-16, D-18).

Ajouté par la PR `charles/focus-social-v2` (contrat `API_CONTRACTS.md` §4) :

- Serveur : `searchUsers` (préfixe du pseudo, 3 à 24 car.), `sendFriendRequest`, `respondFriendRequest`,
  `cancelFriendRequest`, `removeFriend`, `toggleReaction`, `listFriends`, `listFriendRequests`, `getLiveFriends`,
  `getFeed` (curseur, 20 max).
- UI : `FeedCard`, `ReactionButton`, `FriendsStudying`, `FriendList`, `FriendRequests`, `FriendSearch`, `UserAvatar`.
- « Amis en révision » : séance partagée avec heartbeat < 3 min ; page rafraîchie toutes les 30 s (D-19).

Pas encore : `getSocialProfile`, blocage, signalement, `deletePost`, bouton « voir plus » du fil (l'API le gère),
limitation de débit de la recherche (`rate_limited` n'est jamais renvoyé).
