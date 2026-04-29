export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          elo: number
          games_played: number
          games_won: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      games: {
        Row: {
          id: string
          status: 'waiting' | 'in_progress' | 'finished'
          team1_score: number
          team2_score: number
          winning_team: 1 | 2 | null
          created_by: string
          created_at: string
          finished_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['games']['Insert']>
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          player_id: string
          team: 1 | 2
          position: 1 | 2 | 3 | 4
          elo_before: number
          elo_after: number | null
        }
        Insert: Omit<Database['public']['Tables']['game_players']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['game_players']['Insert']>
      }
      rounds: {
        Row: {
          id: string
          game_id: string
          round_number: number
          trump_suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
          trump_caller_id: string
          team1_points: number
          team2_points: number
          team1_announcements: number
          team2_announcements: number
          capot: boolean
          belote_team: 1 | 2 | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>
      }
    }
  }
}
