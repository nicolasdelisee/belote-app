import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import SalonLoading from '../components/SalonLoading'

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

function formatDuration(startMs: number, endMs: number): string {
  const totalSec = Math.max(0, Math.floor((endMs - startMs) / 1000))
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${String(secs).padStart(2, '0')}s`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} j`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface TeamColumnProps {
  players: GamePlayer[]
  isWinner: boolean
  userId?: string
  align?: 'left' | 'right'
  onPlayerClick?: (playerId: string) => void
}

function TeamColumn({ players, isWinner, userId, align = 'left', onPlayerClick }: TeamColumnProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {players.map(p => {
        const delta = p.elo_after !== null && p.elo_before !== null ? p.elo_after - p.elo_before : null
        const isMe = p.player_id === userId
        const clickable = !isMe && !!onPlayerClick
        return (
          <div
            key={p.player_id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: align === 'right' ? 'row-reverse' : 'row', cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable ? () => onPlayerClick(p.player_id) : undefined}
            title={clickable ? `Voir le profil de ${p.profiles?.display_name ?? 'ce joueur'}` : undefined}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: isMe ? 'var(--brass-soft)' : 'var(--brass-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: isMe ? '#1a1208' : 'var(--ink-soft)',
              flexShrink: 0, overflow: 'hidden',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
              onMouseLeave={e => { if (clickable) (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              {p.profiles?.avatar_url
                ? <img src={p.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (p.profiles?.display_name?.[0]?.toUpperCase() ?? '?')}
            </div>
            <div style={{ textAlign: align === 'right' ? 'right' : 'left' }}>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: isMe ? 700 : 500,
                color: isMe ? 'var(--brass-soft)' : clickable ? 'var(--ink)' : 'var(--ink)',
                textDecoration: clickable ? 'underline' : 'none',
                textDecorationColor: 'rgba(255,255,255,0.2)',
                textUnderlineOffset: 2,
              }}>
                {p.profiles?.display_name ?? 'Joueur'}
              </p>
              {delta !== null && (
                <p style={{ margin: 0, fontSize: 11, color: delta >= 0 ? '#a7d7a4' : '#e98e8e', fontFamily: "'Inter', sans-serif" }}>
                  {delta > 0 ? '+' : ''}{delta} · <span style={{ color: isWinner ? 'var(--brass-soft)' : 'var(--ink-faint)' }}>{p.elo_after}</span>
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<HistoryGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(supabase.from('games') as any)
      .select('id, team1_score, team2_score, winning_team, created_at, finished_at, game_players(player_id, team, elo_before, elo_after, profiles(id, display_name, avatar_url))')
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(100)
      .then(({ data }: { data: HistoryGame[] | null }) => {
        setGames(data ?? [])
        setLoading(false)
      })
  }, [user])

  if (loading) return <SalonLoading label="Chargement de l'historique" />

  const myGames = games.filter(g => g.game_players.some(gp => gp.player_id === user?.id))
  const myWins = myGames.filter(g => {
    const me = g.game_players.find(gp => gp.player_id === user?.id)
    return me && g.winning_team === me.team
  })
  const winRate = myGames.length > 0 ? Math.round((myWins.length / myGames.length) * 100) : 0

  const gamesWithDuration = myGames.filter(g => g.finished_at)
  const avgDurationMs = gamesWithDuration.length > 0
    ? gamesWithDuration.reduce((sum, g) => sum + (new Date(g.finished_at!).getTime() - new Date(g.created_at).getTime()), 0) / gamesWithDuration.length
    : 0
  const avgDurationMins = Math.round(avgDurationMs / 60000)

  const eloDeltas = myGames
    .flatMap(g => g.game_players.filter(gp => gp.player_id === user?.id))
    .filter(gp => gp.elo_after !== null && gp.elo_before !== null)
    .map(gp => gp.elo_after! - gp.elo_before!)
  const totalEloDelta = eloDeltas.reduce((sum, d) => sum + d, 0)
  const avgEloDelta = eloDeltas.length > 0 ? Math.round(totalEloDelta / eloDeltas.length) : 0

  // Winning streaks
  let streak = 0; let bestStreak = 0; let currentStreak = 0
  for (const g of [...myGames].reverse()) {
    const me = g.game_players.find(gp => gp.player_id === user?.id)
    if (me && g.winning_team === me.team) { streak++; bestStreak = Math.max(bestStreak, streak) } else streak = 0
  }
  streak = 0
  for (const g of myGames) {
    const me = g.game_players.find(gp => gp.player_id === user?.id)
    if (me && g.winning_team === me.team) { streak++; currentStreak = streak } else { streak = 0; currentStreak = 0 }
  }

  // Partenaire préféré (most games as teammate)
  const partnerMap = new Map<string, { count: number; wins: number; name: string; avatar_url: string | null }>()
  for (const g of myGames) {
    const me = g.game_players.find(gp => gp.player_id === user?.id)
    if (!me) continue
    const won = g.winning_team === me.team
    for (const p of g.game_players) {
      if (p.team !== me.team || p.player_id === user?.id) continue
      const existing = partnerMap.get(p.player_id) ?? { count: 0, wins: 0, name: p.profiles?.display_name ?? 'Joueur', avatar_url: p.profiles?.avatar_url ?? null }
      partnerMap.set(p.player_id, { ...existing, count: existing.count + 1, wins: existing.wins + (won ? 1 : 0) })
    }
  }
  let favPartner: { id: string; count: number; wins: number; name: string; avatar_url: string | null } | null = null
  for (const [id, data] of partnerMap) {
    if (!favPartner || data.count > favPartner.count) favPartner = { id, ...data }
  }

  const handlePlayerClick = (playerId: string) => {
    if (playerId === user?.id) navigate('/profile')
    else navigate(`/profile/${playerId}`)
  }

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
          <span className="salon-title-eyebrow">Mes statistiques</span>
          <span className="salon-title-main">Historique des parties</span>
        </div>
        <div />
      </header>

      <main className="salon-page-main">
        <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {myGames.length > 0 && (
            <section style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <StatCard label="Parties jouées" value={myGames.length} />
              <StatCard label="Victoires" value={`${myWins.length} (${winRate}%)`} accent />
              <StatCard label="Défaites" value={myGames.length - myWins.length} />
              <StatCard label="Elo total" value={totalEloDelta > 0 ? `+${totalEloDelta}` : String(totalEloDelta)} color={totalEloDelta >= 0 ? '#a7d7a4' : '#e98e8e'} />
              <StatCard label="Elo / partie" value={avgEloDelta > 0 ? `+${avgEloDelta}` : String(avgEloDelta)} color={avgEloDelta >= 0 ? '#a7d7a4' : '#e98e8e'} />
              {avgDurationMins > 0 && <StatCard label="Durée moy." value={`${avgDurationMins} min`} />}
              {bestStreak >= 2 && <StatCard label="Meilleure série" value={`${bestStreak} V`} accent />}
              {currentStreak >= 2 && <StatCard label="Série en cours" value={`${currentStreak} V`} accent />}
              {favPartner && favPartner.count >= 2 && (
                <PartnerCard
                  partner={favPartner}
                  onClick={() => handlePlayerClick(favPartner!.id)}
                />
              )}
            </section>
          )}

          <section className="salon-card-panel">
            <div className="salon-panel-head">
              <h2 className="salon-panel-title">Parties terminées</h2>
              <span className="salon-panel-meta">{games.length} partie{games.length !== 1 ? 's' : ''}</span>
            </div>

            {games.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13, padding: '36px 0', margin: 0 }}>
                Aucune partie terminée pour l'instant.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {games.map(game => {
                  const me = game.game_players.find(gp => gp.player_id === user?.id)
                  const myTeam = me?.team
                  const won = myTeam != null && game.winning_team === myTeam
                  const inGame = myTeam != null
                  const team1 = game.game_players.filter(gp => gp.team === 1)
                  const team2 = game.game_players.filter(gp => gp.team === 2)
                  const duration = game.finished_at
                    ? formatDuration(new Date(game.created_at).getTime(), new Date(game.finished_at).getTime())
                    : null

                  return (
                    <div key={game.id} style={{
                      border: `1px solid ${won ? 'rgba(167,215,164,0.3)' : inGame && !won ? 'rgba(233,142,142,0.2)' : 'var(--border)'}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                      background: won ? 'rgba(167,215,164,0.04)' : inGame && !won ? 'rgba(233,142,142,0.03)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {formatDate(game.finished_at ?? game.created_at)}
                          </span>
                          {duration && (
                            <span style={{ fontSize: 11, color: 'var(--ink-faint)', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4 }}>
                              ⏱ {duration}
                            </span>
                          )}
                        </div>
                        {inGame && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            padding: '3px 8px', borderRadius: 4,
                            background: won ? 'rgba(167,215,164,0.18)' : 'rgba(233,142,142,0.15)',
                            color: won ? '#a7d7a4' : '#e98e8e',
                          }}>
                            {won ? 'VICTOIRE' : 'DÉFAITE'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr', gap: 12, alignItems: 'center' }}>
                        <TeamColumn players={team1} isWinner={game.winning_team === 1} userId={user?.id} onPlayerClick={handlePlayerClick} />

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 600,
                              color: game.winning_team === 1 ? 'var(--brass-soft)' : 'var(--ink-soft)',
                            }}>{game.team1_score}</span>
                            <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>–</span>
                            <span style={{
                              fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 600,
                              color: game.winning_team === 2 ? 'var(--brass-soft)' : 'var(--ink-soft)',
                            }}>{game.team2_score}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                            {game.winning_team === 1 ? 'Éq. 1 gagne' : 'Éq. 2 gagne'}
                          </div>
                        </div>

                        <TeamColumn players={team2} isWinner={game.winning_team === 2} userId={user?.id} align="right" onPlayerClick={handlePlayerClick} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  accent?: boolean
  color?: string
}

function StatCard({ label, value, accent, color }: StatCardProps) {
  return (
    <div className="salon-card-panel" style={{ padding: '14px 18px', flex: '1 1 120px', minWidth: 110 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: color ?? (accent ? 'var(--brass-soft)' : 'var(--ink)') }}>
        {value}
      </p>
    </div>
  )
}

interface PartnerCardProps {
  partner: { name: string; count: number; wins: number; avatar_url: string | null }
  onClick: () => void
}

function PartnerCard({ partner, onClick }: PartnerCardProps) {
  const winRate = partner.count > 0 ? Math.round((partner.wins / partner.count) * 100) : 0
  return (
    <div
      className="salon-card-panel"
      onClick={onClick}
      style={{ padding: '14px 18px', flex: '1 1 160px', minWidth: 150, cursor: 'pointer' }}
      title={`Voir le profil de ${partner.name}`}
    >
      <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Partenaire préféré
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--brass-dim)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, fontWeight: 700,
          color: 'var(--ink-soft)', flexShrink: 0, overflow: 'hidden',
        }}>
          {partner.avatar_url
            ? <img src={partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : partner.name[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--brass-soft)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)', textUnderlineOffset: 2 }}>
            {partner.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-soft)', fontFamily: "'Inter', sans-serif" }}>
            {partner.count} partie{partner.count > 1 ? 's' : ''} · {winRate}% victoires
          </p>
        </div>
      </div>
    </div>
  )
}
