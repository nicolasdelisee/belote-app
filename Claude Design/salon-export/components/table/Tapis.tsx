import type { Card, Suit } from '../../types'
import { CardFront, SUIT_GLYPH, SUIT_LABEL, suitColor } from './Card'

export interface TrickCard {
  playerId: string
  card: Card
  fromSlot?: 'top' | 'left' | 'right' | 'bottom'
  playerName?: string
}

interface TapisProps {
  trump: Suit | null
  trick: TrickCard[]
  ledSuit?: Suit | null
  emptyState?: React.ReactNode
}

export function Tapis({ trump, trick, ledSuit, emptyState }: TapisProps) {
  return (
    <div className="salon-tapis">
      {trump && (
        <div className="salon-tapis-trump">
          <span className="salon-trump-eyebrow">Atout</span>
          <span className="salon-trump-glyph" style={{ color: suitColor(trump) }}>
            {SUIT_GLYPH[trump]}
          </span>
          <span className="salon-trump-name">
            {SUIT_LABEL[trump]}{ledSuit ? ' · ' : ''}
            {ledSuit && <em style={{ fontStyle: 'italic', opacity: 0.75 }}>{SUIT_LABEL[ledSuit]} demandé</em>}
          </span>
        </div>
      )}

      {trick.length > 0 ? (
        <div className="salon-tapis-trick">
          {trick.map(({ playerId, card, playerName }, i) => (
            <div
              key={playerId}
              className="salon-trick-slot"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <CardFront card={card} size="md" />
              {playerName && <span className="salon-trick-label">{playerName}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ minHeight: 132, display: 'flex', alignItems: 'center' }}>
          {emptyState ?? <span style={{ color: 'rgba(246,241,227,0.45)', fontSize: 13 }}>En attente…</span>}
        </div>
      )}
    </div>
  )
}
