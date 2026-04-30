import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import SalonLoading from '../components/SalonLoading'

interface ProfileData {
  id: string
  display_name: string | null
  avatar_url: string | null
  elo: number
  games_played: number
  games_won: number
}

interface GamePlayer {
  player_id: string
  team: 1 | 2
  elo_before: number | null
  elo_after: number | null
  profiles: { id: string; display_name: string | null; avatar_url: string | null } | null
}

interface HistoryGame {
  id: string
  team1_score: number
  team2_score: number
  winning_team: 1 | 2 | null
  created_at: string
  finished_at: string | null
  game_players: GamePlayer[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} j`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [sharedGames, setSharedGames] = useState<HistoryGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    if (id === user?.id) { navigate('/profile', { replace: true }); return }

    Promise.all([
      (supabase.from('profiles') as any)
        .select('id, display_name, avatar_url, elo, games_played, games_won')
        .eq('id', id).single(),
      (supabase.from('games') as any)
        .select('id, team1_score, team2_score, winning_team, created_at, finished_at, game_players(player_id, team, elo_before, elo_after, profiles(id, display_name, avatar_url))')
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
        .limit(100),
    ]).then(([profileRes, gamesRes]) => {
      setProfile(profileRes.data ?? null)
      const games: HistoryGame[] = gamesRes.data ?? []
      // Keep only games where both the viewed player and current user participated
      const together = user
        ? games.filter(g =>
            g.game_players.some(gp => gp.player_id === id) &&
            g.game_players.some(gp => gp.player_id === user.id)
          )
        : games.filter(g => g.game_players.some(gp => gp.player_id === id))
      setSharedGames(together)
      setLoading(false)
    })
  }, [id, user, navigate])

  if (loading) return <SalonLoading label="Chargement du profil" />
  if (!profile) return (
    <div className="salon-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--ink-soft)' }}>Joueur introuvable.</p>
    </div>
  )

  const winRate = profile.games_played > 0 ? Math.round((profile.games_won / profile.games_played) * 100) : 0

  // Head-to-head stats when current user exists
  const myTeamGames = user ? sharedGames.filter(g => {
    const them = g.game_players.find(gp => gp.player_id === id)
    const me = g.game_players.find(gp => gp.player_id === user.id)
    return them && me
  }) : []
  const asPartner = myTeamGames.filter(g => {
    const them = g.game_players.find(gp => gp.player_id === id)
    const me = g.game_players.find(gp => gp.player_id === user!.id)
    return them && me && them.team === me.team
  })
  const asOpponent = myTeamGames.filter(g => {
    const them = g.game_players.find(gp => gp.player_id === id)
    const me = g.game_players.find(gp => gp.player_id === user!.id)
    return them && me && them.team !== me.team
  })
  const partnerWins = asPartner.filter(g => {
    const me = g.game_players.find(gp => gp.player_id === user!.id)
    return me && g.winning_team === me.team
  })
  const myWinsVsThem = asOpponent.filter(g => {
    const me = g.game_players.find(gp => gp.player_id === user!.id)
    return me && g.winning_team === me.team
  })

  return (
    <div className="salon-root" style={{ minHeight: '100vh' }}>
      <div className="salon-ornament tl" /><div className="salon-ornament tr" />
      <div className="salon-ornament bl" /><div className="salon-ornament br" />

      <header className="salon-topbar">
        <button onClick={() => navigate(-1)} className="salon-ghost-btn" style={{ justifySelf: 'start' }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
          <span>Retour</span>
        </button>
        <div className="salon-title-block">
          <span className="salon-title-eyebrow">Joueur</span>
          <span className="salon-title-main">{profile.display_name ?? 'Profil'}</span>
        </div>
        <div />
      </header>

      <main className="salon-page-main">
        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identity */}
          <section className="salon-card-panel" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--brass-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: 'var(--ink-soft)',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>
                  {profile.display_name ?? 'Joueur'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                  Elo <strong style={{ color: 'var(--brass-soft)' }}>{profile.elo}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Global stats */}
          <section className="salon-stats-row">
            <div className="salon-stat">
              <span className="salon-stat-label">Parties</span>
              <span className="salon-stat-value">{profile.games_played}</span>
            </div>
            <div className="salon-stat">
              <span className="salon-stat-label">Victoires</span>
              <span className="salon-stat-value salon-stat-brass">{profile.games_won}</span>
            </div>
            <div className="salon-stat">
              <span className="salon-stat-label">Winrate</span>
              <span className="salon-stat-value">{winRate}%</span>
            </div>
          </section>

          {/* Head-to-head */}
          {user && myTeamGames.length > 0 && (
            <section className="salon-card-panel">
              <div className="salon-panel-head">
                <h2 className="salon-panel-title">Face à face</h2>
                <span className="salon-panel-meta">{myTeamGames.length} partie{myTeamGames.length > 1 ? 's' : ''} ensemble</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {asPartner.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>En équipe</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>{asPartner.length} partie{asPartner.length > 1 ? 's' : ''}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: partnerWins.length >= asPartner.length / 2 ? '#a7d7a4' : 'var(--ink-soft)' }}>
                      {partnerWins.length}V – {asPartner.length - partnerWins.length}D
                    </span>
                  </div>
                )}
                {asOpponent.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>En adversaire</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>{asOpponent.length} partie{asOpponent.length > 1 ? 's' : ''}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: myWinsVsThem.length >= asOpponent.length / 2 ? '#a7d7a4' : '#e98e8e' }}>
                      {myWinsVsThem.length}V – {asOpponent.length - myWinsVsThem.length}D
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent games together */}
          {sharedGames.length > 0 && (
            <section className="salon-card-panel">
              <div className="salon-panel-head">
                <h2 className="salon-panel-title">Parties récentes</h2>
                <span className="salon-panel-meta">{sharedGames.length} partie{sharedGames.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sharedGames.slice(0, 10).map(game => {
                  const them = game.game_players.find(gp => gp.player_id === id)
                  const me = game.game_players.find(gp => gp.player_id === user?.id)
                  const theyWon = them && game.winning_team === them.team
                  const iWon = me && game.winning_team === me.team
                  const asTeam = them && me && them.team === me.team
                  const theirDelta = them && them.elo_after !== null && them.elo_before !== null ? them.elo_after - them.elo_before : null

                  return (
                    <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--ink-soft)', minWidth: 70 }}>
                          {formatDate(game.finished_at ?? game.created_at)}
                        </span>
                        {asTeam !== undefined && (
                          <span style={{ fontSize: 11, color: asTeam ? '#a7d7a4' : 'var(--ink-faint)', padding: '1px 6px', border: `1px solid ${asTeam ? 'rgba(167,215,164,0.3)' : 'var(--border)'}`, borderRadius: 4 }}>
                            {asTeam ? 'Partenaires' : 'Adversaires'}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
                          <span style={{ color: game.winning_team === 1 ? 'var(--brass-soft)' : 'var(--ink-soft)' }}>{game.team1_score}</span>
                          <span style={{ color: 'var(--ink-faint)', margin: '0 4px' }}>–</span>
                          <span style={{ color: game.winning_team === 2 ? 'var(--brass-soft)' : 'var(--ink-soft)' }}>{game.team2_score}</span>
                        </span>
                        <div style={{ textAlign: 'right', minWidth: 60 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: theyWon ? 'rgba(167,215,164,0.15)' : 'rgba(233,142,142,0.12)',
                            color: theyWon ? '#a7d7a4' : '#e98e8e',
                          }}>
                            {theyWon ? 'V' : 'D'}
                          </span>
                          {user && me && (
                            <span style={{
                              marginLeft: 4, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: iWon ? 'rgba(167,215,164,0.15)' : 'rgba(233,142,142,0.12)',
                              color: iWon ? '#a7d7a4' : '#e98e8e',
                            }}>
                              moi {iWon ? 'V' : 'D'}
                            </span>
                          )}
                          {theirDelta !== null && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: theirDelta >= 0 ? '#a7d7a4' : '#e98e8e', fontFamily: "'Inter', sans-serif" }}>
                              {theirDelta > 0 ? '+' : ''}{theirDelta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}
