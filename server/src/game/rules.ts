import type { Card, Suit, CardValue } from './deck'

export interface TrickCard {
  playerId: string
  card: Card
}

// Hiérarchie force (index 0 = plus fort)
export const TRUMP_STRENGTH: CardValue[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7']
export const NON_TRUMP_STRENGTH: CardValue[] = ['A', '10', 'K', 'Q', 'J', '9', '8', '7']

export const TRUMP_POINTS: Record<CardValue, number> = {
  J: 20, '9': 14, A: 11, '10': 10, K: 4, Q: 3, '8': 0, '7': 0,
}
export const NON_TRUMP_POINTS: Record<CardValue, number> = {
  A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0,
}

export function trumpStrength(value: CardValue): number {
  return TRUMP_STRENGTH.length - TRUMP_STRENGTH.indexOf(value)
}

export function nonTrumpStrength(value: CardValue): number {
  return NON_TRUMP_STRENGTH.length - NON_TRUMP_STRENGTH.indexOf(value)
}

function getHighestTrumpInTrick(trick: TrickCard[], trump: Suit): CardValue | null {
  const trumps = trick.filter(t => t.card.suit === trump)
  if (trumps.length === 0) return null
  return trumps.reduce((best, cur) =>
    trumpStrength(cur.card.value) > trumpStrength(best.card.value) ? cur : best
  ).card.value
}

function getCurrentWinnerTeam(trick: TrickCard[], trump: Suit, playerTeams: Record<string, 1 | 2>): 1 | 2 {
  const winnerId = getTrickWinner(trick, trump)
  return playerTeams[winnerId]
}

// Retourne les indices des cartes jouables dans la main
export function getPlayableIndices(
  hand: Card[],
  trick: TrickCard[],
  trump: Suit,
  myTeam: 1 | 2,
  playerTeams: Record<string, 1 | 2>
): number[] {
  const all = hand.map((_, i) => i)

  // Pas encore de carte jouée : tout est jouable
  if (trick.length === 0) return all

  const ledSuit = trick[0].card.suit
  const followIndices = hand.reduce<number[]>((acc, c, i) => {
    if (c.suit === ledSuit) acc.push(i)
    return acc
  }, [])

  // Doit suivre la couleur si possible
  if (followIndices.length > 0) {
    // Si la couleur menée est l'atout : obligation de monter si possible
    if (ledSuit === trump) {
      const highestTrump = getHighestTrumpInTrick(trick, trump)
      if (highestTrump) {
        const overtrumpIndices = followIndices.filter(
          i => trumpStrength(hand[i].value) > trumpStrength(highestTrump)
        )
        if (overtrumpIndices.length > 0) return overtrumpIndices
      }
      return followIndices
    }
    return followIndices
  }

  // Impossible de suivre la couleur
  const trumpIndices = hand.reduce<number[]>((acc, c, i) => {
    if (c.suit === trump) acc.push(i)
    return acc
  }, [])

  // Vérifier si le partenaire est en train de gagner le pli
  const partnerWinning = getCurrentWinnerTeam(trick, trump, playerTeams) === myTeam

  if (trumpIndices.length > 0 && !partnerWinning) {
    // Doit couper, et surmonter si possible
    const highestTrump = getHighestTrumpInTrick(trick, trump)
    if (highestTrump) {
      const overtrumpIndices = trumpIndices.filter(
        i => trumpStrength(hand[i].value) > trumpStrength(highestTrump)
      )
      if (overtrumpIndices.length > 0) return overtrumpIndices
    }
    return trumpIndices
  }

  // Partenaire gagne ou pas d'atout : jouer n'importe quoi
  return all
}

export function getTrickWinner(trick: TrickCard[], trump: Suit): string {
  const ledSuit = trick[0].card.suit
  const trumpsPlayed = trick.filter(t => t.card.suit === trump)

  if (trumpsPlayed.length > 0) {
    return trumpsPlayed.reduce((best, cur) =>
      trumpStrength(cur.card.value) > trumpStrength(best.card.value) ? cur : best
    ).playerId
  }

  const ledCards = trick.filter(t => t.card.suit === ledSuit)
  return ledCards.reduce((best, cur) =>
    nonTrumpStrength(cur.card.value) > nonTrumpStrength(best.card.value) ? cur : best
  ).playerId
}

export function getTrickPoints(trick: TrickCard[], trump: Suit): number {
  return trick.reduce((sum, { card }) => {
    const pts = card.suit === trump ? TRUMP_POINTS[card.value] : NON_TRUMP_POINTS[card.value]
    return sum + pts
  }, 0)
}
