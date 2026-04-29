// Belote — warm "salon" redesign of the in-game table.
// Self-contained mock with light state so Tweaks + interactions feel real.

const { useState, useMemo, useEffect } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "feltTone": "emerald",
  "showOrnaments": true,
  "highlightTurn": true,
  "trumpSuit": "spades"
}/*EDITMODE-END*/;

// Fake table state — frozen near the moment captured in the original screenshot
// so the redesign reads as a faithful improvement, not a different screen.
const PLAYERS = {
  top:    { name: 'Margaux',  team: 2, elo: 1124, cardCount: 5 },
  left:   { name: 'Théo',     team: 1, elo: 998,  cardCount: 5 },
  right:  { name: 'Inès',     team: 2, elo: 1057, cardCount: 4 },
  me:     { name: 'Julien',   team: 1, elo: 1012 },
};

const TRICK_CARDS = [
  { who: 'left',  card: { suit: 'spades',   value: 'A'  } },
  { who: 'top',   card: { suit: 'spades',   value: '10' } },
  { who: 'right', card: { suit: 'spades',   value: '8'  } },
];

const MY_HAND_DEFAULT = [
  { suit: 'diamonds', value: 'J'  },
  { suit: 'diamonds', value: '10' },
  { suit: 'hearts',   value: '7'  },
  { suit: 'clubs',    value: 'K'  },
  { suit: 'hearts',   value: 'A'  },
  { suit: 'spades',   value: 'K'  },
  { suit: 'hearts',   value: 'Q'  },
];

const FELT_TONES = {
  emerald: { from: '#0e3b2a', mid: '#155138', to: '#08251a',  rim: 'rgba(255,210,140,0.10)' },
  forest:  { from: '#0a2e23', mid: '#11402f', to: '#06180f',  rim: 'rgba(255,210,140,0.10)' },
  bordeaux:{ from: '#3a1213', mid: '#561a1d', to: '#240a0c',  rim: 'rgba(255,210,140,0.12)' },
  navy:    { from: '#0e2540', mid: '#163a5e', to: '#081428',  rim: 'rgba(255,210,140,0.10)' },
};

function suitColor(suit) {
  return SUIT_IS_RED(suit) ? '#e26b6f' : '#f6f1e3';
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS);
  const [selectedCard, setSelectedCard] = useState(null);
  const [hoverCard, setHoverCard]       = useState(null);
  const [hand, setHand]                 = useState(MY_HAND_DEFAULT);
  const [showRef, setShowRef]           = useState(false);
  const [scoreFlash, setScoreFlash]     = useState(false);

  const tone = FELT_TONES[tweaks.feltTone] ?? FELT_TONES.emerald;
  const trump = tweaks.trumpSuit;
  const isMyTurn = true;

  // playable indices for demo: any card of the led suit (spades), else all
  const playable = useMemo(() => {
    const led = TRICK_CARDS[0]?.card.suit;
    const sameSuit = hand.map((c, i) => c.suit === led ? i : -1).filter(i => i >= 0);
    return sameSuit.length ? sameSuit : hand.map((_, i) => i);
  }, [hand]);

  function playCard(i) {
    if (!playable.includes(i)) return;
    setHand((h) => h.filter((_, idx) => idx !== i));
    setSelectedCard(null);
    setScoreFlash(true);
    setTimeout(() => setScoreFlash(false), 700);
  }

  return (
    <div
      className="table-root"
      style={{
        '--felt-from': tone.from,
        '--felt-mid':  tone.mid,
        '--felt-to':   tone.to,
        '--felt-rim':  tone.rim,
      }}
    >
      <Vignette ornaments={tweaks.showOrnaments} />

      {/* Top bar */}
      <header className="topbar">
        <button className="ghost-btn">
          <span className="chev">‹</span>
          <span>Quitter la partie</span>
        </button>

        <div className="title-block">
          <span className="title-eyebrow">Salon · Partie 14</span>
          <span className="title-main">Manche 3 · Atout demandé</span>
        </div>

        <div className="scoreboard">
          <Score
            label="Notre équipe"
            score={64}
            roundDelta={28}
            accent="brass"
            flash={scoreFlash}
          />
          <span className="score-sep">vs</span>
          <Score
            label="Eux"
            score={42}
            roundDelta={11}
            accent="silver"
          />
        </div>
      </header>

      {/* Felt */}
      <main className="felt-area">
        {/* Top opponent */}
        <SeatTop player={PLAYERS.top} active={false} highlight={tweaks.highlightTurn}/>

        {/* Middle row */}
        <div className="middle-row">
          <SeatSide player={PLAYERS.left} side="left" active highlight={tweaks.highlightTurn}/>

          <Tapis
            trick={TRICK_CARDS}
            trump={trump}
            ornaments={tweaks.showOrnaments}
          />

          <SeatSide player={PLAYERS.right} side="right" active={false} highlight={tweaks.highlightTurn}/>
        </div>

        {/* Me */}
        <MyArea
          player={PLAYERS.me}
          hand={hand}
          isMyTurn={isMyTurn}
          selected={selectedCard}
          onSelect={(i) => setSelectedCard(i === selectedCard ? null : i)}
          onPlay={playCard}
          onHover={setHoverCard}
          hover={hoverCard}
          playable={playable}
          trump={trump}
          highlight={tweaks.highlightTurn}
          onShowRef={() => setShowRef(v => !v)}
        />
      </main>

      {showRef && <CardReferencePanel trump={trump} onClose={() => setShowRef(false)} />}

      <TweakControls tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

// ---------- Vignette / ornaments ----------
function Vignette({ ornaments }) {
  if (!ornaments) return null;
  return (
    <>
      <div className="ornament corner tl" />
      <div className="ornament corner tr" />
      <div className="ornament corner bl" />
      <div className="ornament corner br" />
    </>
  );
}

// ---------- Score ----------
function Score({ label, score, roundDelta, accent, flash }) {
  return (
    <div className={`score score-${accent} ${flash ? 'score-flash' : ''}`}>
      <span className="score-label">{label}</span>
      <span className="score-num">
        {score}
        {roundDelta != null && <span className="score-delta">+{roundDelta}</span>}
      </span>
    </div>
  );
}

// ---------- Seats ----------
function SeatBadge({ player, isActive, dim = false, highlight }) {
  return (
    <div className={`seat-badge ${isActive && highlight ? 'is-active' : ''} ${dim ? 'is-dim' : ''}`}>
      <span className="seat-avatar" aria-hidden="true">{player.name[0]}</span>
      <span className="seat-meta">
        <span className="seat-name">{player.name}</span>
        <span className="seat-sub">
          <span className={`team-pip team-${player.team}`} />
          Éq.{player.team} · {player.elo}
        </span>
      </span>
      {isActive && highlight && <span className="seat-pulse" aria-hidden="true" />}
    </div>
  );
}

function SeatTop({ player, active, highlight }) {
  return (
    <div className="seat seat-top">
      <SeatBadge player={player} isActive={active} highlight={highlight} />
      <OpponentStack count={player.cardCount} orientation="row" />
    </div>
  );
}

function SeatSide({ player, side, active, highlight }) {
  return (
    <div className={`seat seat-${side}`}>
      <OpponentStack count={player.cardCount} orientation="column" />
      <SeatBadge player={player} isActive={active} highlight={highlight} />
    </div>
  );
}

// ---------- Tapis (centre) ----------
function Tapis({ trick, trump, ornaments }) {
  return (
    <div className="tapis">
      {ornaments && <div className="tapis-flourish" aria-hidden="true" />}

      <div className="tapis-trump">
        <span className="trump-eyebrow">Atout</span>
        <span className="trump-glyph" style={{ color: suitColor(trump) }}>
          {SUIT_GLYPH[trump]}
        </span>
        <span className="trump-name">{SUIT_LABEL[trump]} demandé</span>
      </div>

      <div className="tapis-trick">
        {trick.map(({ who, card }, i) => (
          <div
            key={`${card.suit}-${card.value}`}
            className={`trick-slot trick-from-${who}`}
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <CardFront card={card} size="md" />
            <span className="trick-label">{PLAYERS[who].name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- My area ----------
function MyArea({
  player, hand, isMyTurn, selected, onSelect, onPlay,
  onHover, hover, playable, trump, highlight, onShowRef,
}) {
  return (
    <div className="me-area">
      <div className={`me-badge ${isMyTurn && highlight ? 'is-turn' : ''}`}>
        <span className="me-avatar" aria-hidden="true">{player.name[0]}</span>
        <span className="me-meta">
          <span className="me-name">
            {player.name}
            {isMyTurn && <span className="me-tag">À toi de jouer</span>}
          </span>
          <span className="me-sub">
            <span className={`team-pip team-${player.team}`} />
            Équipe {player.team} · Elo {player.elo}
          </span>
        </span>

        <span className="me-divider" aria-hidden="true" />

        <span className="me-trump">
          <span className="me-trump-label">Atout</span>
          <span className="me-trump-glyph" style={{ color: suitColor(trump) }}>{SUIT_GLYPH[trump]}</span>
          <span className="me-trump-name">{SUIT_LABEL[trump]}</span>
        </span>
      </div>

      <div className="hand-row">
        {hand.map((card, i) => {
          const can = playable.includes(i);
          const isSel = selected === i;
          const isHov = hover === i;
          // fan layout
          const N = hand.length;
          const mid = (N - 1) / 2;
          const offset = i - mid;
          const rot = offset * 4.5;
          const ty  = Math.abs(offset) * 4;
          return (
            <div
              key={`${card.suit}-${card.value}`}
              className="hand-slot"
              style={{
                transform: `translateY(${ty}px) rotate(${rot}deg)`,
                marginLeft: i === 0 ? 0 : -22,
                zIndex: isSel || isHov ? 50 : i,
                animationDelay: `${i * 80}ms`,
              }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
            >
              <CardFront
                card={card}
                size="lg"
                playable={can}
                faded={!can}
                selected={isSel}
                onClick={() => can && (isSel ? onPlay(i) : onSelect(i))}
              />
            </div>
          );
        })}
      </div>

      <div className="hand-actions">
        <button className="link-btn" onClick={onShowRef}>
          <span className="link-bullet" />Valeur des cartes
        </button>
        <button
          className="primary-btn"
          disabled={selected == null}
          onClick={() => selected != null && onPlay(selected)}
        >
          {selected != null ? 'Jouer cette carte' : 'Sélectionne une carte'}
        </button>
        <button className="secondary-btn">
          Annoncer · belote
        </button>
      </div>
    </div>
  );
}

// ---------- Card reference panel ----------
const TRUMP_ORDER = [
  ['J', 20], ['9', 14], ['A', 11], ['10', 10],
  ['K', 4],  ['Q', 3],  ['8', 0],  ['7', 0],
];
const NON_TRUMP_ORDER = [
  ['A', 11], ['10', 10], ['K', 4], ['Q', 3],
  ['J', 2],  ['9', 0],  ['8', 0], ['7', 0],
];

function CardReferencePanel({ trump, onClose }) {
  return (
    <div className="ref-panel">
      <div className="ref-head">
        <span>Valeur des cartes</span>
        <button className="ref-close" onClick={onClose} aria-label="Fermer">×</button>
      </div>
      <div className="ref-body">
        <div className="ref-col">
          <div className="ref-col-title" style={{ color: suitColor(trump) }}>
            {SUIT_GLYPH[trump]} Atout
          </div>
          {TRUMP_ORDER.map(([v, p]) => (
            <div key={v} className="ref-row">
              <span className="ref-val">{v}</span>
              <span className={`ref-pts ${p === 0 ? 'ref-zero' : ''}`}>{p === 0 ? '—' : `${p} pts`}</span>
            </div>
          ))}
        </div>
        <div className="ref-divider" />
        <div className="ref-col">
          <div className="ref-col-title">Hors atout</div>
          {NON_TRUMP_ORDER.map(([v, p]) => (
            <div key={v} className="ref-row">
              <span className="ref-val">{v}</span>
              <span className={`ref-pts ${p === 0 ? 'ref-zero' : ''}`}>{p === 0 ? '—' : `${p} pts`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Tweaks panel ----------
function TweakControls({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Ambiance">
        <TweakRadio
          label="Couleur du tapis"
          value={tweaks.feltTone}
          onChange={(v) => setTweak('feltTone', v)}
          options={[
            { value: 'emerald',  label: 'Émeraude'  },
            { value: 'forest',   label: 'Forêt'     },
            { value: 'bordeaux', label: 'Bordeaux'  },
            { value: 'navy',     label: 'Marine'    },
          ]}
        />
        <TweakToggle
          label="Ornements dorés"
          value={tweaks.showOrnaments}
          onChange={(v) => setTweak('showOrnaments', v)}
        />
        <TweakToggle
          label="Halo sur le joueur actif"
          value={tweaks.highlightTurn}
          onChange={(v) => setTweak('highlightTurn', v)}
        />
      </TweakSection>

      <TweakSection title="Démo">
        <TweakRadio
          label="Atout"
          value={tweaks.trumpSuit}
          onChange={(v) => setTweak('trumpSuit', v)}
          options={[
            { value: 'spades',   label: '♠' },
            { value: 'hearts',   label: '♥' },
            { value: 'diamonds', label: '♦' },
            { value: 'clubs',    label: '♣' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
