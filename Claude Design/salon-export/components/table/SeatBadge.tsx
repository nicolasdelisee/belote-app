interface SeatBadgeProps {
  name: string
  team: 1 | 2
  elo?: number
  active?: boolean
  highlight?: boolean
  size?: 'sm' | 'md'
}

export function SeatBadge({ name, team, elo, active = false, highlight = true, size = 'sm' }: SeatBadgeProps) {
  return (
    <div className={`salon-seat-badge ${active && highlight ? 'is-active' : ''}`}>
      <span className="salon-seat-avatar" style={size === 'md' ? { width: 38, height: 38, fontSize: 17 } : undefined}>
        {name[0]?.toUpperCase() ?? '?'}
      </span>
      <span className="salon-seat-meta">
        <span className="salon-seat-name">{name}</span>
        <span className="salon-seat-sub">
          <span className={`salon-team-pip salon-team-${team}`} />
          Éq.{team}{elo != null ? ` · ${elo}` : ''}
        </span>
      </span>
    </div>
  )
}
