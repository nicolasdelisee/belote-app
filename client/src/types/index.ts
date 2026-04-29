export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type CardValue = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
export type Team = 1 | 2

export interface Card {
  suit: Suit
  value: CardValue
}

export interface Player {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  elo: number
  games_played: number
  games_won: number
}

export interface GamePlayer {
  player: Player
  team: Team
  position: 1 | 2 | 3 | 4
}

export interface Game {
  id: string
  status: 'waiting' | 'in_progress' | 'finished'
  team1_score: number
  team2_score: number
  winning_team: Team | null
  players: GamePlayer[]
  created_at: string
}

export interface SocketEvents {
  // Client -> Server
  'game:join': (gameId: string) => void
  'game:leave': (gameId: string) => void
  // Server -> Client
  'game:updated': (game: Game) => void
  'players:online': (players: Player[]) => void
}
