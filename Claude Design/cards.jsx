// Beautiful playing-card primitives for the Belote table.
// All values are real Belote: 7, 8, 9, 10, J, Q, K, A.

const SUIT_GLYPH = {
  hearts:   '\u2665',
  diamonds: '\u2666',
  clubs:    '\u2663',
  spades:   '\u2660',
};

const SUIT_LABEL = {
  hearts: 'Cœur',
  diamonds: 'Carreau',
  clubs: 'Trèfle',
  spades: 'Pique',
};

const SUIT_IS_RED = (s) => s === 'hearts' || s === 'diamonds';

// ---------- Card front ----------
// Cream-white card with subtle texture, classic corner indices, and a centred crest.
function CardFront({
  card,
  onClick,
  selected = false,
  playable = false,
  disabled = false,
  size = 'md',  // 'sm' | 'md' | 'lg'
  faded = false,
}) {
  const dim =
    size === 'sm' ? { w: 52, h: 76, idx: 12, glyph: 14, crest: 26, radius: 6 } :
    size === 'lg' ? { w: 92, h: 132, idx: 18, glyph: 22, crest: 56, radius: 10 } :
                    { w: 70, h: 100, idx: 14, glyph: 17, crest: 38, radius: 8 };

  const red = SUIT_IS_RED(card.suit);
  const inkColor = red ? '#b1242b' : '#1c1a16';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="card-front-btn"
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: dim.radius,
        cursor: disabled ? 'default' : (onClick ? 'pointer' : 'default'),
        opacity: faded ? 0.55 : 1,
        transform: selected ? 'translateY(-14px)' : 'translateY(0)',
        boxShadow: selected
          ? '0 18px 28px -10px rgba(0,0,0,0.55), 0 0 0 2px #c9a24b, 0 0 26px rgba(201,162,75,0.55)'
          : playable
            ? '0 8px 18px -8px rgba(0,0,0,0.55), 0 0 0 2px #c9a24b'
            : '0 6px 14px -6px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* corner: top-left */}
      <span
        className="card-corner card-corner-tl"
        style={{ color: inkColor, fontSize: dim.idx, lineHeight: 1 }}
      >
        <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{card.value}</span>
        <span style={{ fontSize: dim.glyph, marginTop: 1 }}>{SUIT_GLYPH[card.suit]}</span>
      </span>
      {/* central crest */}
      <span
        className="card-crest"
        style={{ color: inkColor, fontSize: dim.crest, opacity: 0.92 }}
      >
        {SUIT_GLYPH[card.suit]}
      </span>
      {/* corner: bottom-right (rotated) */}
      <span
        className="card-corner card-corner-br"
        style={{ color: inkColor, fontSize: dim.idx, lineHeight: 1 }}
      >
        <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{card.value}</span>
        <span style={{ fontSize: dim.glyph, marginTop: 1 }}>{SUIT_GLYPH[card.suit]}</span>
      </span>
    </button>
  );
}

// ---------- Card back ----------
// Ornate brass-on-burgundy back, scaled for opponent stacks.
function CardBack({ size = 'sm', style = {} }) {
  const dim =
    size === 'xs' ? { w: 36, h: 52, radius: 5 } :
    size === 'sm' ? { w: 52, h: 76, radius: 6 } :
                    { w: 70, h: 100, radius: 8 };

  return (
    <div
      className="card-back"
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: dim.radius,
        ...style,
      }}
    >
      <div className="card-back-pattern" />
      <div className="card-back-frame" />
      <div className="card-back-monogram">B</div>
    </div>
  );
}

// ---------- Stacks of opponents ----------
// Top: horizontal fan-row.  Sides: vertical column.
function OpponentStack({ count, orientation = 'row' }) {
  const isRow = orientation === 'row';
  return (
    <div
      className="opponent-stack"
      style={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            marginLeft: isRow && i > 0 ? -28 : 0,
            marginTop: !isRow && i > 0 ? -50 : 0,
            transform: isRow ? `rotate(${(i - (count - 1) / 2) * 1.2}deg)` : 'none',
            zIndex: i,
          }}
        >
          <CardBack size={isRow ? 'sm' : 'xs'} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { CardFront, CardBack, OpponentStack, SUIT_GLYPH, SUIT_LABEL, SUIT_IS_RED });
