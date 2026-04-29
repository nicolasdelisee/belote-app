# Salon redesign — fichiers à copier dans `belotte-app/client/`

Tu es presque prêt. Voici la cartographie exacte de chaque fichier de ce dossier `salon-export/` vers ton projet local **`belotte-app/`**.

## 📁 Mapping

| Source (ce dossier)                                | Destination dans ton projet                                  |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `salon.css`                                        | `client/src/styles/salon.css` *(crée le dossier `styles/`)* |
| `index.css`                                        | `client/src/index.css` *(remplace l'existant)*               |
| `App.tsx`                                          | `client/src/App.tsx` *(remplace l'existant)*                 |
| `components/SalonLoading.tsx`                      | `client/src/components/SalonLoading.tsx`                     |
| `components/table/Card.tsx`                        | `client/src/components/table/Card.tsx`                       |
| `components/table/SeatBadge.tsx`                   | `client/src/components/table/SeatBadge.tsx`                  |
| `components/table/Tapis.tsx`                       | `client/src/components/table/Tapis.tsx`                      |
| `components/table/CardReferencePanel.tsx`          | `client/src/components/table/CardReferencePanel.tsx`         |
| `pages/HomePage.tsx`                               | `client/src/pages/HomePage.tsx` *(remplace l'existant)*      |
| `pages/ProfilePage.tsx`                            | `client/src/pages/ProfilePage.tsx` *(remplace l'existant)*   |

## ⚙️ Étapes

```bash
cd belotte-app/client
mkdir -p src/styles src/components/table
# puis copier chaque fichier selon le tableau ci-dessus
```

## ✅ Aucune dépendance npm à ajouter

Les composants utilisent uniquement React + react-router-dom + supabase + ton hook `useSocket`, qui sont déjà dans ton `package.json`. Les fonts Google sont chargées via `@import` dans `index.css`.

## 🎯 Ce que tu obtiens

- **`SalonLoading`** — splash screen utilisé par `App.tsx` pendant l'auth + par `ProfilePage` au chargement.
- **`HomePage`** — Salon principal avec hero CTA, liste des tables (4 sièges visualisés en pastilles laiton), au comptoir (présence en ligne), classement Elo (médailles I/II/III).
- **`ProfilePage`** — avatar 112px laiton avec hover "Changer", trio de stats (Elo / Parties / Victoires + win rate), formulaire propre.

## 🔧 Notes d'intégration

- `HomePage` consomme aussi `useSocket` pour les joueurs en ligne (j'ai fusionné `OnlinePlayers` dedans). Tu peux supprimer `components/OnlinePlayers.tsx` si tu veux.
- Idem pour `Leaderboard.tsx` et `GameList.tsx` — leur contenu est intégré dans la nouvelle `HomePage.tsx`. Garde-les ou supprime-les selon ta préférence.
- `GamePage.tsx` n'est **pas** réécrit ici — laisse ta version existante. Si tu veux que je la refasse aussi avec les nouveaux `Card`/`Tapis`/`SeatBadge`, dis-le moi.
