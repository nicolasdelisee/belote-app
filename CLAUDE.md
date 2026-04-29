# Belote App — Architecture & Context

## Overview
Multiplayer Belote card game for internal company use.
Monorepo with `/client` (React/Vite) and `/server` (Node/Express).

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + TypeScript |
| Backend | Node.js + Express + Socket.io + TypeScript |
| Database | Supabase (PostgreSQL + Auth) |
| Realtime | Socket.io (online players, game state) |
| Deploy | Vercel (client) + Railway (server) |

## Project Structure
```
belotte-app/
├── client/                  # React SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level pages
│       ├── hooks/           # useAuth, useSocket, ...
│       ├── lib/             # supabase.ts client
│       └── types/           # database.ts (Supabase types), index.ts (domain types)
└── server/                  # Express API + Socket.io
    └── src/
        ├── routes/          # games.ts, players.ts
        ├── middleware/       # auth.ts (JWT verification via Supabase)
        ├── socket/          # handlers.ts (online players, game rooms)
        └── lib/             # supabase.ts (service role client)
```

## Database Schema (Supabase)

### `profiles` — extends Supabase auth.users
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK auth.users) | |
| username | text unique | |
| display_name | text | |
| avatar_url | text nullable | |
| elo | integer | default 1000 |
| games_played | integer | default 0 |
| games_won | integer | default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `games`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| status | enum | waiting / in_progress / finished |
| team1_score | integer | cumulative across rounds |
| team2_score | integer | cumulative across rounds |
| winning_team | integer nullable | 1 or 2 |
| created_by | uuid FK profiles | |
| created_at | timestamptz | |
| finished_at | timestamptz nullable | |

### `game_players` — pivot games ↔ profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| game_id | uuid FK games | |
| player_id | uuid FK profiles | |
| team | integer | 1 or 2 |
| position | integer | 1–4 (seat order) |
| elo_before | integer | snapshot at game start |
| elo_after | integer nullable | updated at game end |

### `rounds`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| game_id | uuid FK games | |
| round_number | integer | |
| trump_suit | enum | hearts / diamonds / clubs / spades |
| trump_caller_id | uuid FK profiles | player who called trump |
| team1_points | integer | cards points (without announcements) |
| team2_points | integer | |
| team1_announcements | integer | tierce=20, quarte=50, cinquante=50, cent=100, carré=200 |
| team2_announcements | integer | |
| capot | boolean | winning team took all tricks |
| belote_team | integer nullable | 1, 2, or null |
| created_at | timestamptz | |

## Elo System
- Starting Elo: 1000
- K-factor: 32
- Formula: standard Elo — winning team gains K*(1 - expected), losers lose same
- Expected score based on average team Elo vs opponent team Elo

## Belote Rules (to implement)
- 4 players, 2 teams of 2 (positions: team1=seats 1,3 / team2=seats 2,4)
- 32-card deck (7 to A)
- Trump bidding: each player passes or takes, then optionally changes suit
- Trump suit card ranking: J(11pts) 9(9pts) A(11pts) 10(10pts) K(4pts) Q(3pts) 8(0pts) 7(0pts)
- Non-trump ranking: A(11pts) 10(10pts) K(4pts) Q(3pts) J(2pts) 9(0pts) 8(0pts) 7(0pts)
- Obligation to follow suit, must trump if unable, must overtrump if possible
- Total card points: 152 + 10 (last trick bonus "dix de der") = 162
- If trump caller's team fails to beat opponent: opponent gets ALL points (162)
- Capot (all 8 tricks): 162 + 82 bonus = 252 points for winning team
- Belote/Rebelote: king+queen of trump = 20pts bonus (announced when played)
- Target score: 701 points (classic) or configurable

## Socket Events
| Event | Direction | Payload |
|---|---|---|
| `players:online` | server→client | Player[] |
| `game:join` | client→server | gameId: string |
| `game:leave` | client→server | gameId: string |
| `game:updated` | server→client | Game |

## Environment Variables

### client/.env
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SERVER_URL=http://localhost:3001
```

### server/.env
```
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLIENT_URL=http://localhost:5173
```

## Dev Commands
```bash
# Root — start everything
npm run dev

# Client only
cd client && npm run dev

# Server only
cd server && npm run dev
```

## Next Steps (backlog)
1. Game lobby UI (seats visualization, team assignment)
2. Card dealing & bidding phase (Socket.io events)
3. Trick-taking game engine (server-side validation)
4. Score counting + announcement detection
5. End-of-game Elo recalculation
6. Game history page
7. Player profile page
