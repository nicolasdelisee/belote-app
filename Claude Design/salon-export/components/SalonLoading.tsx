import { useEffect, useState } from 'react'

/**
 * Full-screen loading "salon" view shown while auth resolves.
 * Brass spinner over deep felt with vignette + soft pulse.
 */
export default function SalonLoading({ label = 'Préparation du salon…' }: { label?: string }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 4), 450)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="salon-root" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
      <div className="salon-ornament tl" /><div className="salon-ornament tr" />
      <div className="salon-ornament bl" /><div className="salon-ornament br" />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, zIndex: 5 }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
            color: '#e3c279', fontWeight: 600,
          }}>
            Maison · de · Belote
          </span>
          <h1 style={{
            margin: 0,
            fontFamily: "'Fraunces', serif",
            fontSize: 56, fontWeight: 500,
            color: '#f6f1e3', letterSpacing: '-0.01em',
          }}>
            Belote
          </h1>
        </div>

        {/* Three flipping cards */}
        <div style={{ display: 'flex', gap: 14, padding: '8px 0' }}>
          {(['hearts', 'spades', 'diamonds'] as const).map((s, i) => (
            <div key={s} style={{
              width: 64, height: 92, borderRadius: 8,
              background: 'linear-gradient(135deg, #6f1d1f 0%, #4a1213 100%)',
              border: '1px solid #2a0a0b',
              boxShadow: '0 10px 24px -10px rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: tick === i ? 'translateY(-10px) rotate(-3deg)' : 'translateY(0)',
              transition: 'transform 380ms cubic-bezier(.2,.8,.2,1)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 4, border: '1px solid rgba(201,162,75,0.55)', borderRadius: 5,
              }} />
              <span style={{
                fontFamily: "'Fraunces', serif", fontStyle: 'italic',
                color: '#c9a24b', fontSize: 22, position: 'relative', zIndex: 1,
              }}>B</span>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(246,241,227,0.55)', fontWeight: 600, margin: 0,
        }}>
          {label}
          <span style={{ display: 'inline-block', width: 14, textAlign: 'left' }}>{'.'.repeat((tick % 3) + 1)}</span>
        </p>
      </div>
    </div>
  )
}
