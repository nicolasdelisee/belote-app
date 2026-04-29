import type { Suit } from '../../types'
import { SUIT_GLYPH, suitColor } from './Card'

const TRUMP_ORDER: Array<[string, number]> = [
  ['J', 20], ['9', 14], ['A', 11], ['10', 10],
  ['K', 4],  ['Q', 3],  ['8', 0],  ['7', 0],
]
const NON_TRUMP_ORDER: Array<[string, number]> = [
  ['A', 11], ['10', 10], ['K', 4], ['Q', 3],
  ['J', 2],  ['9', 0],  ['8', 0], ['7', 0],
]

export function CardReferencePanel({ trump, onClose }: { trump: Suit | null; onClose: () => void }) {
  return (
    <div className="salon-ref-panel">
      <div className="salon-ref-head">
        <span>Valeur des cartes</span>
        <button className="salon-ref-close" onClick={onClose} aria-label="Fermer">×</button>
      </div>
      <div className="salon-ref-body">
        <div>
          <div className="salon-ref-col-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {trump && <span style={{ color: suitColor(trump), fontSize: 18, lineHeight: 1 }}>{SUIT_GLYPH[trump]}</span>}
            <span>Atout</span>
          </div>
          {TRUMP_ORDER.map(([v, p]) => (
            <div key={v} className="salon-ref-row">
              <span className="salon-ref-val">{v}</span>
              <span className={`salon-ref-pts ${p === 0 ? 'salon-ref-zero' : ''}`}>{p === 0 ? '—' : `${p} pts`}</span>
            </div>
          ))}
        </div>
        <div className="salon-ref-divider" />
        <div>
          <div className="salon-ref-col-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Hors atout</span>
          </div>
          {NON_TRUMP_ORDER.map(([v, p]) => (
            <div key={v} className="salon-ref-row">
              <span className="salon-ref-val">{v}</span>
              <span className={`salon-ref-pts ${p === 0 ? 'salon-ref-zero' : ''}`}>{p === 0 ? '—' : `${p} pts`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
