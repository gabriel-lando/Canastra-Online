import { Card, Suit, Rank } from './types.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(deckIndex: number): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank, id: `${rank}-${suit}-${deckIndex}` });
    }
  }
  return cards;
}

export function createDoubleDeck(): Card[] {
  return [...createDeck(0), ...createDeck(1)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardPoints(card: Card): number {
  if (card.rank === 'A') return 15;
  if (card.rank === '2') return 10;
  if (['7', '8', '9', '10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
  // 3,4,5,6
  return 5;
}

const RANK_ORDER: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
};

export function rankValue(rank: Rank): number {
  return RANK_ORDER[rank];
}

/**
 * Returns true if the card is acting as a wildcard (coringa) in a meld context.
 * A 2 is natural (not wildcard) when:
 *   - It's in a group of 2s (all same rank=2)
 *   - It's in a sequence and the rank 2 slot is being filled naturally by it
 */
export function isWildcard(card: Card, inGroupOf2s: boolean, inSequenceAt2Slot: boolean): boolean {
  if (card.rank !== '2') return false;
  if (inGroupOf2s) return false;
  if (inSequenceAt2Slot) return false;
  return true;
}

export type ValidationResult = { valid: true } | { valid: false; reason: string };

/**
 * Validate a group meld (same rank).
 */
export function validateGroup(cards: Card[]): ValidationResult {
  if (cards.length < 3) return { valid: false, reason: 'A group needs at least 3 cards' };

  const isGroupOf2s = cards.every((c) => c.rank === '2');

  if (isGroupOf2s) {
    // special: group of 2s, all natural, valid
    return { valid: true };
  }

  // Check all ranks are the same (non-2 rank)
  const naturalCards = cards.filter((c) => c.rank !== '2');
  const ranks = new Set(naturalCards.map((c) => c.rank));
  if (ranks.size > 1) return { valid: false, reason: 'Group must have same rank' };

  const wildcards = cards.filter((c) => c.rank === '2');
  if (wildcards.length >= naturalCards.length) {
    return { valid: false, reason: 'Wildcards cannot be majority in a group' };
  }

  return { valid: true };
}

/**
 * Validate a sequence meld (consecutive same suit).
 * Wildcards can fill internal gaps or extend borders.
 */
export function validateSequence(cards: Card[]): ValidationResult {
  if (cards.length < 3) return { valid: false, reason: 'A sequence needs at least 3 cards' };

  const non2Cards = cards.filter((c) => c.rank !== '2');
  const twos = cards.filter((c) => c.rank === '2');

  if (non2Cards.length === 0) return { valid: false, reason: 'Need at least one natural card' };

  // All non-2 natural cards must be same suit
  const suits = new Set(non2Cards.map((c) => c.suit));
  if (suits.size > 1) return { valid: false, reason: 'Sequence must be same suit' };

  // No duplicate ranks among non-2 cards
  const non2Values = new Set(non2Cards.map((c) => rankValue(c.rank)));
  if (non2Values.size !== non2Cards.length) {
    return { valid: false, reason: 'Duplicate natural cards in sequence' };
  }

  // Inner helper: check whether a given set of natural ranks + wildcard count forms a valid sequence.
  // maxPossibleRank is 13 normally, or 14 when treating Ace as high (after K).
  const tryValidate = (naturalRanks: Set<number>, wildcardCount: number, maxPossibleRank = 13): boolean => {
    if (wildcardCount >= naturalRanks.size) return false; // wildcards must be minority
    const minR = Math.min(...naturalRanks);
    const maxR = Math.max(...naturalRanks);
    let gapsInSpan = 0;
    for (let v = minR; v <= maxR; v++) {
      if (!naturalRanks.has(v)) gapsInSpan++;
    }
    if (gapsInSpan > wildcardCount) return false;
    const extensions = wildcardCount - gapsInSpan;
    const leftRoom = minR - 1;
    const rightRoom = maxPossibleRank - maxR;
    if (extensions > leftRoom + rightRoom) return false;
    return true;
  };

  // Attempt 1: all 2s are wildcards, Ace is low (rank 1)
  if (tryValidate(non2Values, twos.length)) return { valid: true };

  // Attempt 2: promote ONE 2 to be the natural rank-2 card (Ace low).
  if (twos.length > 0 && !non2Values.has(2)) {
    const promotedNaturals = new Set([...non2Values, 2]);
    if (tryValidate(promotedNaturals, twos.length - 1)) return { valid: true };
  }

  // Attempt 3: Ace is high (rank 14), all 2s as wildcards.
  // Covers sequences like Q K A or 10 J Q K A.
  if (non2Values.has(1)) {
    const highAceValues = new Set([...non2Values].map((v) => (v === 1 ? 14 : v)));
    if (tryValidate(highAceValues, twos.length, 14)) return { valid: true };
  }

  // Return the most helpful error for the failed case
  const minR = Math.min(...non2Values);
  const maxR = Math.max(...non2Values);
  let gapsInSpan = 0;
  for (let v = minR; v <= maxR; v++) {
    if (!non2Values.has(v)) gapsInSpan++;
  }
  if (gapsInSpan > twos.length) return { valid: false, reason: 'Not enough wildcards to fill gaps in sequence' };
  if (twos.length >= non2Cards.length) return { valid: false, reason: 'Wildcards cannot be majority in a sequence' };
  return { valid: false, reason: 'Invalid sequence combination' };
}

/**
 * Sort cards in a sequence meld into their correct positional order (A→2→3…→K).
 * Natural cards go to their rank slot; wildcards fill internal gaps first,
 * then border extensions (right side first, left side if right is full).
 */
/** Determine whether an Ace in a sequence acts as high (rank 14, after K) or low (rank 1, before 2). */
function seqAceIsHigh(naturals: Card[], wildcardCount: number): boolean {
  if (!naturals.some((c) => c.rank === 'A')) return false;
  const checkSpan = (values: Set<number>, maxPossible: number): boolean => {
    if (wildcardCount >= values.size) return false;
    const min = Math.min(...values);
    const max = Math.max(...values);
    let gaps = 0;
    for (let v = min; v <= max; v++) if (!values.has(v)) gaps++;
    if (gaps > wildcardCount) return false;
    const ext = wildcardCount - gaps;
    return ext <= min - 1 + (maxPossible - max);
  };
  const lowValues = new Set(naturals.map((c) => rankValue(c.rank)));
  const highValues = new Set(naturals.map((c) => (c.rank === 'A' ? 14 : rankValue(c.rank))));
  const highValid = checkSpan(highValues, 14);
  const lowValid = checkSpan(lowValues, 13);
  if (highValid && !lowValid) return true;
  if (highValid && lowValid) {
    // Both valid — prefer the smaller span
    return 14 - Math.min(...highValues) < Math.max(...lowValues) - 1;
  }
  return false;
}

export function sortSequenceCards(cards: Card[]): Card[] {
  const naturals = cards.filter((c) => c.rank !== '2');
  const wildcardPool = [...cards.filter((c) => c.rank === '2')];

  if (naturals.length === 0) return cards;

  const aceIsHigh = seqAceIsHigh(naturals, wildcardPool.length);
  const effectiveValue = (c: Card): number => (c.rank === 'A' && aceIsHigh ? 14 : rankValue(c.rank));

  const sortedNaturals = [...naturals].sort((a, b) => effectiveValue(a) - effectiveValue(b));
  const minRank = effectiveValue(sortedNaturals[0]);
  const maxRank = effectiveValue(sortedNaturals[sortedNaturals.length - 1]);

  const naturalByRank = new Map<number, Card>(sortedNaturals.map((c) => [effectiveValue(c), c]));

  // Fill the span [minRank..maxRank], using wildcards for gaps
  const result: Card[] = [];
  let wi = 0;
  for (let v = minRank; v <= maxRank; v++) {
    if (naturalByRank.has(v)) {
      result.push(naturalByRank.get(v)!);
    } else {
      result.push(wildcardPool[wi++]);
    }
  }

  // Remaining wildcards are border extensions
  const extensions = wildcardPool.slice(wi);
  if (extensions.length === 0) return result;

  const maxPossibleRank = aceIsHigh ? 14 : 13;
  const rightRoom = maxPossibleRank - maxRank;
  const leftRoom = minRank - 1;
  const seqSuit = sortedNaturals[0].suit;

  // Prefer placing a same-suit 2 at rank-2 as a natural left-border extension over
  // pushing everything to the right end.
  // Condition: rank-2 is not already occupied, minRank > 2, and remaining other extensions
  // can fill the gap ranks (3..minRank-1) between rank-2 and the first natural.
  if (minRank > 2 && !naturalByRank.has(2)) {
    const sameSuit2Idx = extensions.findIndex((c) => c.suit === seqSuit);
    if (sameSuit2Idx >= 0) {
      const gapsBetween = minRank - 3; // ranks 3..(minRank-1) need to be filled by other wildcards
      const otherExtCount = extensions.length - 1;
      if (gapsBetween >= 0 && gapsBetween <= otherExtCount) {
        const sameSuit2 = extensions[sameSuit2Idx];
        const otherExts = extensions.filter((_, i) => i !== sameSuit2Idx);
        const leftFill = otherExts.slice(0, gapsBetween);
        const rightFill = otherExts.slice(gapsBetween);
        return [[sameSuit2, ...leftFill], result, rightFill].flat();
      }
    }
  }

  // Default: fill right first, then left
  if (rightRoom >= extensions.length) {
    return [...result, ...extensions];
  } else if (leftRoom >= extensions.length) {
    return [...extensions, ...result];
  } else {
    const rightExt = extensions.slice(0, rightRoom);
    const leftExt = extensions.slice(rightRoom);
    return [...leftExt, ...result, ...rightExt];
  }
}

/**
 * Auto-detect whether cards form a valid group or sequence.
 * Prefers group when both are valid (e.g. three 2s).
 * Returns the meld type or an error message.
 */
export function detectMeldType(cards: Card[]): { type: 'group' | 'sequence'; error?: never } | { type?: never; error: string } {
  const groupResult = validateGroup(cards);
  if (groupResult.valid) return { type: 'group' };
  const seqResult = validateSequence(cards);
  if (seqResult.valid) return { type: 'sequence' };
  // Neither valid — return the most helpful error
  const naturals = cards.filter((c) => c.rank !== '2');
  const suits = new Set(naturals.map((c) => c.suit));
  if (suits.size <= 1) return { error: seqResult.reason };
  return { error: groupResult.reason };
}

/**
 * Check if a meld (group or sequence) qualifies as a canasta (7+ cards)
 * and whether it's clean or dirty.
 */
export function classifyCanasta(
  cards: Card[],
  meldType: 'group' | 'sequence',
): {
  isCanasta: boolean;
  isClean: boolean;
} {
  if (cards.length < 7) return { isCanasta: false, isClean: false };

  const isGroupOf2s = meldType === 'group' && cards.every((c) => c.rank === '2');

  // Count wildcards acting as wildcards
  let wildcoarCount = 0;
  if (!isGroupOf2s) {
    if (meldType === 'sequence') {
      // At most ONE 2 can be natural in a sequence (the card filling the rank-2 slot).
      // All other 2s are wildcards.
      const non2Cards = cards.filter((c) => c.rank !== '2');
      const sequenceTwos = cards.filter((c) => c.rank === '2');
      if (sequenceTwos.length > 0) {
        const aceIsHigh = seqAceIsHigh(non2Cards, sequenceTwos.length);
        const effectiveValues = new Set(non2Cards.map((c) => (c.rank === 'A' && aceIsHigh ? 14 : rankValue(c.rank))));
        const minV = effectiveValues.size > 0 ? Math.min(...effectiveValues) : 99;
        const maxV = effectiveValues.size > 0 ? Math.max(...effectiveValues) : 0;
        const seqSuit = non2Cards.length > 0 ? non2Cards[0].suit : null;
        const maxPoss = aceIsHigh ? 14 : 13;

        // A 2 is natural at rank-2 when it fills that position in the sequence.
        // Case 1: rank-2 falls within the non-2 natural span (e.g. A 2 3...)
        // Case 2: a same-suit 2 is a natural left-border extension at rank-2 —
        //         verify that treating it as rank-2 leaves the rest of the sequence valid.
        let naturalTwos = 0;
        if (minV <= 2 && 2 <= maxV) {
          naturalTwos = 1;
        } else if (seqSuit && !effectiveValues.has(2)) {
          const sameSuitTwo = sequenceTwos.find((c) => c.suit === seqSuit);
          if (sameSuitTwo) {
            const promotedNaturals = new Set([...effectiveValues, 2]);
            const remainingWildcards = sequenceTwos.length - 1;
            const pMin = Math.min(...promotedNaturals);
            const pMax = Math.max(...promotedNaturals);
            let gaps = 0;
            for (let v = pMin; v <= pMax; v++) {
              if (!promotedNaturals.has(v)) gaps++;
            }
            if (gaps <= remainingWildcards && remainingWildcards < promotedNaturals.size && remainingWildcards - gaps <= pMin - 1 + (maxPoss - pMax)) {
              naturalTwos = 1;
            }
          }
        }
        wildcoarCount += sequenceTwos.length - naturalTwos;
      }
    } else {
      // group: all 2s are wildcards (since not a group-of-2s)
      for (const c of cards) {
        if (c.rank === '2') wildcoarCount++;
      }
    }
  }

  return {
    isCanasta: true,
    isClean: wildcoarCount === 0,
  };
}

export function canastraBonus(isClean: boolean): number {
  return isClean ? 200 : 100;
}

export function meldPoints(cards: Card[], isCanasta: boolean, isClean: boolean): number {
  const base = cards.reduce((sum, c) => sum + cardPoints(c), 0);
  const bonus = isCanasta ? canastraBonus(isClean) : 0;
  return base + bonus;
}
