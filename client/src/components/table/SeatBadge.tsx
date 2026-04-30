interface SeatBadgeProps {
  name: string
  team: 1 | 2
  teamName?: string
  elo?: number
  active?: boolean
  highlight?: boolean
  size?: 'sm' | 'md'
  avatarUrl?: string | null
  turnLabel?: string | null
}

export function SeatBadge({ name, team, teamName, elo, active = false, highlight = true, size = 'sm', avatarUrl, turnLabel }: SeatBadgeProps) {
  const badge = (
    <div className={`salon-seat-badge ${active && highlight ? 'is-active' : ''}`}>
      <span
        className="salon-seat-avatar"
        style={{
          ...(size === 'md' ? { width: 38, height: 38, fontSize: 17 } : undefined),
          position: 'relative',
        }}
      >
        {/* Initial always visible as base layer */}
        {name[0]?.toUpperCase() ?? '?'}
        {/* Photo as absolute overlay — hidden on mobile via CSS */}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="salon-seat-photo"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        )}
      </span>
      <span className="salon-seat-meta">
        <span className="salon-seat-name">{name}</span>
        <span className="salon-seat-sub">
          <span className={`salon-team-pip salon-team-${team}`} />
          {teamName ?? `Éq.${team}`}
        </span>
        {elo != null && (
          <span className="salon-seat-elo" style={{ fontSize: 12, color: 'var(--brass)', fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: '0.02em' }}>
            Elo {elo}
          </span>
        )}
      </span>
    </div>
  )

  // Always wrap in column — visibility:hidden when no label reserves stable space
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <span
        className="salon-seat-turn-label"
        style={{
          fontSize: 10, fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          color: 'var(--brass-soft)', letterSpacing: '0.04em',
          visibility: turnLabel ? 'visible' : 'hidden',
          animation: turnLabel ? 'salonTagPulse 2s ease-in-out infinite' : undefined,
          display: 'block', minHeight: '1em',
        }}
      >
        {turnLabel ?? ' '}
      </span>
      {badge}
    </div>
  )
}
