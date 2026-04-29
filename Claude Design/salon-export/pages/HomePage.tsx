import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useSocket } from '../hooks/useSocket'
import type { Player } from '../types'

const ELO_MEDALS = ['I', 'II', 'III']

export default function HomePage() {
  const { user, signOut } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [openGames, setOpenGames] = useState<any[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([])
  const [loadingCreate, setLoadingCreate] = useState(false)

  useEffect(() => {
    fetchLeaderboard(); fetchOpenGames()
    const channel = supabase
      .channel('open-games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, fetchOpenGames)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players' }, fetchOpenGames)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('players:online', (p: Player[]) => setOnlinePlayers(p))
    return () => { socket.off('players:online') }
  }, [socket])

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('profiles').select('*').order('elo', { ascending: false }).limit(10)
    if (data) setLeaderboard(data as Player[])
  }
  const fetchOpenGames = async () => {
    const { data } = await supabase
      .from('games').select('*, game_players(*, profiles(*))')
      .eq('status', 'waiting').order('created_at', { ascending: false })
    if (data) setOpenGames(data)
  }
  const createGame = async () => {
    if (!user) return
    setLoadingCreate(true)
    try {
      const { data: game, error } = await supabase
        .from('games')
        .insert({ status: 'waiting', team1_score: 0, team2_score: 0, winning_team: null, created_by: user.id })
        .select().single()
      if (error) throw error
      await supabase.from('game_players').insert({
        game_id: game.id, player_id: user.id, team: 1, position: 1,
        elo_before: leaderboard.find((p) => p.id === user.id)?.elo ?? 1000,
      })
      navigate(`/game/${game.id}`)
    } finally { setLoadingCreate(false) }
  }

  const joinGame = async (game: any) => {
    if (!user) return
    const playerCount = game.game_players?.length ?? 0
    if (playerCount >= 4) return
    const team: 1 | 2 = playerCount < 2 ? 1 : 2
    const position = (playerCount + 1) as 1 | 2 | 3 | 4
    await supabase.from('game_players').insert({
      game_id: game.id, player_id: user.id, team, position, elo_before: 1000,
    })
    navigate(`/game/${game.id}`)
  }

  return (
    <div className="salon-root" style={{ minHeight: '100vh' }}>
      <div className="salon-ornament tl" /><div className="salon-ornament tr" />
      <div className="salon-ornament bl" /><div className="salon-ornament br" />

      {/* Top bar */}
      <header className="salon-topbar">
        <div className="salon-title-block" style={{ alignItems: 'flex-start', gridColumn: 1 }}>
          <span className="salon-title-eyebrow">Maison de Belote</span>
          <span className="salon-title-main">Salon principal</span>
        </div>
        <div /> {/* spacer */}
        <div style={{ justifySelf: 'end', display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/profile')} className="salon-ghost-btn">Mon profil</button>
          <button onClick={() => signOut()} className="salon-ghost-btn">Déconnexion</button>
        </div>
      </header>

      <main style={{
        position: 'relative', zIndex: 4, flex: 1,
        maxWidth: 1180, margin: '0 auto', padding: '8px 32px 56px',
        display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignContent: 'start',
      }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero CTA — create a table */}
          <section className="salon-card-panel salon-hero">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <span className="salon-title-eyebrow">Nouvelle table</span>
                <h2 style={{
                  margin: '4px 0 6px', fontFamily: "'Fraunces', serif",
                  fontSize: 26, fontWeight: 500, color: '#f6f1e3',
                }}>
                  Prêt pour une partie&nbsp;?
                </h2>
                <p style={{ margin: 0, color: 'rgba(246,241,227,0.62)', fontSize: 13 }}>
                  Crée une table, invite trois collègues, distribue.
                </p>
              </div>
              <button onClick={createGame} disabled={loadingCreate} className="salon-primary-btn">
                {loadingCreate ? 'Création…' : '+ Créer une partie'}
              </button>
            </div>
          </section>

          {/* Open tables */}
          <section className="salon-card-panel">
            <div className="salon-panel-head">
              <h2 className="salon-panel-title">Parties en attente</h2>
              <span className="salon-panel-meta">{openGames.length} table{openGames.length > 1 ? 's' : ''}</span>
            </div>
            {openGames.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(246,241,227,0.45)', fontSize: 13, padding: '36px 0' }}>
                Aucune partie ouverte — sois le premier à dresser une table.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {openGames.map((game: any) => {
                  const playerCount = game.game_players?.length ?? 0
                  const isInGame = game.game_players?.some((gp: any) => gp.player_id === user?.id)
                  const isFull = playerCount >= 4
                  return (
                    <div key={game.id} className="salon-game-row">
                      <div className="salon-game-seats">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const filled = i < playerCount
                          const player = game.game_players?.[i]
                          return (
                            <div key={i} className={`salon-seat-chip ${filled ? 'is-filled' : ''}`}
                              title={player?.profiles?.display_name ?? 'Place libre'}>
                              {filled ? (player?.profiles?.display_name?.[0]?.toUpperCase() ?? '?') : ''}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f6f1e3' }}>
                          Table de {game.game_players?.[0]?.profiles?.display_name ?? 'joueur'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(246,241,227,0.55)' }}>
                          {playerCount}/4 joueurs · {new Date(game.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => joinGame(game)}
                        disabled={isInGame || isFull}
                        className={isInGame || isFull ? 'salon-secondary-btn' : 'salon-primary-btn'}
                      >
                        {isInGame ? 'Déjà inscrit' : isFull ? 'Complète' : 'Rejoindre'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Online players */}
          <section className="salon-card-panel">
            <div className="salon-panel-head">
              <h2 className="salon-panel-title">Au comptoir</h2>
              <span className="salon-panel-meta">{onlinePlayers.length} en ligne</span>
            </div>
            {onlinePlayers.length === 0 ? (
              <p style={{ color: 'rgba(246,241,227,0.45)', fontSize: 13, margin: 0 }}>
                Personne pour l'instant. Le bar reste ouvert.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {onlinePlayers.map((p) => (
                  <div key={p.id} className="salon-online-chip">
                    <span className="salon-online-dot" />
                    <span>{p.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT column — Leaderboard */}
        <aside className="salon-card-panel" style={{ alignSelf: 'start' }}>
          <div className="salon-panel-head">
            <h2 className="salon-panel-title">Classement Elo</h2>
            <span className="salon-panel-meta">Top 10</span>
          </div>
          {leaderboard.length === 0 ? (
            <p style={{ color: 'rgba(246,241,227,0.45)', fontSize: 13, margin: 0 }}>Aucun joueur encore.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {leaderboard.map((p, i) => (
                <div key={p.id} className={`salon-leader-row ${p.id === user?.id ? 'is-me' : ''}`}>
                  <span className={`salon-leader-rank ${i < 3 ? `salon-medal-${i + 1}` : ''}`}>
                    {i < 3 ? ELO_MEDALS[i] : `${i + 1}`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f6f1e3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.display_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(246,241,227,0.55)' }}>
                      {p.games_played} partie{p.games_played !== 1 ? 's' : ''} · {p.games_won ?? 0} gagnée{(p.games_won ?? 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="salon-leader-elo">{p.elo}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
