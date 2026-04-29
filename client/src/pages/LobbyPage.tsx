import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import SalonLoading from '../components/SalonLoading'
import '../salon.css'

interface LobbyPlayer {
  id: string
  display_name: string
  elo: number
  avatar_url: string | null
}

interface GamePlayer {
  player_id: string
  team: 1 | 2
  position: 1 | 2 | 3 | 4
  elo_before: number
  profiles: LobbyPlayer
}

interface LobbyGame {
  id: string
  status: string
  created_by: string
  game_players: GamePlayer[]
}

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [game, setGame] = useState<LobbyGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamNames, setTeamNames] = useState<{ 1: string; 2: string }>({ 1: 'Équipe 1', 2: 'Équipe 2' })
  const [teamNameEdits, setTeamNameEdits] = useState<{ 1: string; 2: string }>({ 1: 'Équipe 1', 2: 'Équipe 2' })
  const editsClean = useRef(true)
  const teamNamesRef = useRef(teamNames)
  teamNamesRef.current = teamNames

  const fetchGame = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from('games')
      .select('id, status, created_by, game_players(player_id, team, position, elo_before, profiles(id, display_name, elo, avatar_url))')
      .eq('id', id)
      .single()
    if (data) {
      const anyData = data as any
      if (anyData.status === 'in_progress') {
        navigate(`/game/${id}/play`, { state: { teamNames: teamNamesRef.current } })
        return
      }
      setGame(anyData as LobbyGame)
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    fetchGame()
  }, [fetchGame])

  const fetchGameRef = useRef(fetchGame)
  fetchGameRef.current = fetchGame
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`lobby-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${id}` }, () => {
        fetchGameRef.current()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (!socket || !id) return
    socket.on('game:lobby_updated', () => { fetchGame() })
    socket.on('game:started', (names?: { 1: string; 2: string }) => {
      navigate(`/game/${id}/play`, { state: { teamNames: names } })
    })
    socket.on('game:team_names', (names: { 1: string; 2: string }) => {
      setTeamNames(names)
      if (editsClean.current) setTeamNameEdits(names)
    })
    socket.emit('game:join', id)
    return () => {
      socket.off('game:lobby_updated')
      socket.off('game:started')
      socket.off('game:team_names')
      socket.emit('game:leave', id)
    }
  }, [socket, id, fetchGame, navigate])

  const joinSeat = (position: 1 | 2 | 3 | 4) => {
    if (!socket || !id) return
    socket.emit('game:join_seat', id, position)
  }

  const saveTeamNames = () => {
    if (!id) return
    setTeamNames(teamNameEdits)
    editsClean.current = true
    socket?.emit('game:set_team_names', id, teamNameEdits)
  }

  const startGame = async () => {
    if (!id) return
    setStarting(true)
    setError(null)
    const { error } = await (supabase.from('games') as any).update({ status: 'in_progress' }).eq('id', id)
    if (error) {
      setError(error.message)
      setStarting(false)
      return
    }
    socket?.emit('game:set_team_names', id, teamNameEdits)
    socket?.emit('game:start', id)
    navigate(`/game/${id}/play`, { state: { teamNames: teamNameEdits } })
  }

  const leaveGame = async () => {
    if (!id || !user) return
    await supabase.from('game_players').delete().eq('game_id', id).eq('player_id', user.id)
    if (game?.created_by === user.id) {
      await supabase.from('games').delete().eq('id', id)
    }
    navigate('/')
  }

  if (loading) return <SalonLoading label="Ouverture de la salle" />

  if (!game) {
    return (
      <div className="salon-root" style={{ minHeight: '100vh' }}>
        <div className="salon-ornament tl" /><div className="salon-ornament tr" />
        <div className="salon-ornament bl" /><div className="salon-ornament br" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 4 }}>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>Partie introuvable.</p>
          <button onClick={() => navigate('/')} className="salon-ghost-btn">
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
            <span>Retour au salon</span>
          </button>
        </div>
      </div>
    )
  }

  const playersByPosition = Object.fromEntries(game.game_players.map((gp) => [gp.position, gp]))
  const playerCount = game.game_players.length
  const isCreator = game.created_by === user?.id
  const isFull = playerCount === 4
  const myPlayer = game.game_players.find((gp) => gp.player_id === user?.id)
  const isInGame = !!myPlayer
  const teamNamesChanged = teamNameEdits[1] !== teamNames[1] || teamNameEdits[2] !== teamNames[2]

  return (
    <div className="salon-root" style={{ minHeight: '100vh' }}>
      <div className="salon-ornament tl" /><div className="salon-ornament tr" />
      <div className="salon-ornament bl" /><div className="salon-ornament br" />

      <header className="salon-topbar">
        <button onClick={() => navigate('/')} className="salon-ghost-btn" style={{ justifySelf: 'start' }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
          <span>Retour au salon</span>
        </button>
        <div className="salon-title-block">
          <span className="salon-title-eyebrow">{playerCount}/4 joueurs</span>
          <span className="salon-title-main">Salle d'attente</span>
        </div>
        <div />
      </header>

      <main className="salon-page-main">
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div className="salon-lobby-teams">
            {([1, 2] as const).map((team) => {
              const positions: (1 | 2 | 3 | 4)[] = team === 1 ? [1, 3] : [2, 4]
              const teamPlayers = game.game_players.filter((gp) => gp.team === team)
              const teamElo = teamPlayers.length > 0
                ? Math.round(teamPlayers.reduce((s, p) => s + p.profiles.elo, 0) / teamPlayers.length)
                : null

              return (
                <section key={team} className="salon-card-panel">
                  <div className="salon-panel-head">
                    {isCreator ? (
                      <input
                        className="salon-team-name-input"
                        value={teamNameEdits[team]}
                        onChange={(e) => {
                          editsClean.current = false
                          setTeamNameEdits((prev) => ({ ...prev, [team]: e.target.value }))
                        }}
                        placeholder={`Équipe ${team}`}
                        maxLength={20}
                      />
                    ) : (
                      <h2 className="salon-panel-title">{teamNames[team]}</h2>
                    )}
                    {teamElo && (
                      <span style={{ fontSize: 11, color: 'var(--brass)', fontWeight: 700, fontFamily: "'Fraunces', serif", flexShrink: 0 }}>
                        Elo moy. {teamElo}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {positions.map((pos) => {
                      const occupant = playersByPosition[pos]
                      const canJoin = !occupant && (isInGame || !isFull)
                      return (
                        <LobbySeat
                          key={pos}
                          player={occupant?.profiles ?? null}
                          isCurrentUser={occupant?.player_id === user?.id}
                          canJoin={canJoin}
                          onJoin={() => joinSeat(pos)}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {error && (
              <p style={{ margin: 0, fontSize: 13, color: '#e98e8e', textAlign: 'center' }}>{error}</p>
            )}

            {isCreator && teamNamesChanged && (
              <button onClick={saveTeamNames} className="salon-secondary-btn">
                Enregistrer les noms d'équipes
              </button>
            )}

            {!isFull && (
              <p style={{ margin: 0, color: 'var(--brass-soft)', fontSize: 13, animation: 'salonTagPulse 1.5s ease-in-out infinite' }}>
                En attente de {4 - playerCount} joueur{4 - playerCount > 1 ? 's' : ''}…
              </p>
            )}

            {isCreator && isFull && (
              <button
                onClick={startGame}
                disabled={starting}
                className="salon-primary-btn"
                style={{ fontSize: 16, padding: '14px 36px' }}
              >
                {starting ? 'Lancement…' : '🃏 Lancer la partie'}
              </button>
            )}

            {!isCreator && isFull && (
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13 }}>
                En attente que le créateur lance la partie…
              </p>
            )}

            {isInGame && (
              <button onClick={leaveGame} className="salon-link-btn" style={{ color: '#e98e8e', marginTop: 4 }}>
                <span className="salon-link-bullet" style={{ background: '#e98e8e' }} />
                Quitter la partie
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function LobbySeat({
  player, isCurrentUser, canJoin, onJoin,
}: {
  player: LobbyPlayer | null
  isCurrentUser: boolean
  canJoin: boolean
  onJoin: () => void
}) {
  if (!player) {
    return (
      <div
        onClick={canJoin ? onJoin : undefined}
        className={`salon-lobby-seat ${canJoin ? 'can-join' : 'is-waiting'}`}
      >
        <div className="salon-lobby-avatar is-empty">
          {canJoin ? '+' : '·'}
        </div>
        <span style={{ fontSize: 13, color: canJoin ? 'var(--ink-soft)' : 'var(--ink-faint)' }}>
          {canJoin ? 'Rejoindre ce siège' : 'En attente…'}
        </span>
      </div>
    )
  }

  return (
    <div className={`salon-lobby-seat${isCurrentUser ? ' is-me' : ''}`}>
      <div className="salon-lobby-avatar" style={{ overflow: 'hidden', padding: player.avatar_url ? 0 : undefined }}>
        {player.avatar_url
          ? <img src={player.avatar_url} alt={player.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : player.display_name[0].toUpperCase()
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.display_name}
          {isCurrentUser && <span style={{ fontSize: 11, color: 'var(--brass)', fontWeight: 500, flexShrink: 0 }}>(moi)</span>}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--brass)', fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
          {player.elo} Elo
        </p>
      </div>
    </div>
  )
}
