import type { Card, ClientMessage, GameState, ServerMessage } from './types';

type Listener = (msg: ServerMessage) => void;

class GameSocket {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private roomCode: string | null = null;
  private playerName: string | null = null;
  private rejoinToken: string | null = null;

  connect(roomCode: string, playerName: string, rejoinToken?: string) {
    this.closed = false;
    this.roomCode = roomCode;
    this.playerName = playerName;
    // Prefer explicit token, then sessionStorage (survives page refresh), then null
    this.rejoinToken = rejoinToken ?? sessionStorage.getItem(`canastra_rejoin_${roomCode}`) ?? null;
    this.doConnect();
  }

  /** Call when the player intentionally leaves a room (back button, kicked). */
  clearSession() {
    this.rejoinToken = null;
    if (this.roomCode) sessionStorage.removeItem(`canastra_rejoin_${this.roomCode}`);
  }

  private doConnect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/api/ws?room=${this.roomCode}`;
    this.ws = new WebSocket(url);

    let didOpen = false;
    this.ws.onopen = () => {
      didOpen = true;
      const joinMsg: ClientMessage = this.rejoinToken ? { type: 'join', name: this.playerName ?? '', rejoinToken: this.rejoinToken } : { type: 'join', name: this.playerName ?? '' };
      this.send(joinMsg);
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMessage;
        // Save rejoin token in memory and sessionStorage on welcome
        if (msg.type === 'welcome') {
          this.rejoinToken = msg.rejoinToken;
          if (this.roomCode) sessionStorage.setItem(`canastra_rejoin_${this.roomCode}`, msg.rejoinToken);
        }
        this.listeners.forEach((l) => l(msg));
      } catch {
        // ignore
      }
    };

    this.ws.onclose = () => {
      if (!didOpen) {
        // Failed to connect — room not found or server unreachable
        this.listeners.forEach((l) => l({ type: 'error', message: 'errors.roomNotFound' }));
        return;
      }
      if (!this.closed) {
        this.reconnectTimer = setTimeout(() => this.doConnect(), 2000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const socket = new GameSocket();

// Helpers
export function cardPoints(card: Card): number {
  if (card.rank === 'A') return 15;
  if (card.rank === '2') return 10;
  if (['7', '8', '9', '10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
  return 5;
}

export function suitSymbol(suit: Card['suit']): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function suitColor(suit: Card['suit']): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#e53e3e' : '#1a202c';
}

export function isMyTurn(gs: GameState, myPublicId: string): boolean {
  const currentPlayer = gs.players[gs.currentPlayerIndex];
  return currentPlayer?.publicId === myPublicId;
}

const RANK_ORDER: Record<string, number> = {
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

/**
 * Client-side meld type detection (mirrors server logic).
 * Returns 'group', 'sequence', or null if the selection is not a valid meld.
 */
export function detectMeldType(cards: Card[]): 'group' | 'sequence' | null {
  if (cards.length < 3) return null;
  const naturals = cards.filter((c) => c.rank !== '2');
  const wildcards = cards.filter((c) => c.rank === '2');
  const isGroupOf2s = cards.every((c) => c.rank === '2');

  // --- Try group ---
  if (isGroupOf2s) return 'group';
  const groupRanks = new Set(naturals.map((c) => c.rank));
  if (groupRanks.size === 1 && wildcards.length <= 1) return 'group';

  // --- Try sequence ---
  const suits = new Set(naturals.map((c) => c.suit));
  if (suits.size === 1 && wildcards.length <= 2) {
    const seqSuit = naturals[0].suit;
    const trySeq = (valueOf: (c: Card) => number, maxPossible: number, wcCount: number): boolean => {
      if (wcCount > 1) return false; // at most one wildcard (2) per meld
      const vals = naturals.map(valueOf);
      const unique = new Set(vals);
      if (unique.size !== naturals.length) return false; // duplicate ranks
      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      const gaps = maxV - minV + 1 - naturals.length;
      if (gaps > wcCount) return false;
      const ext = wcCount - gaps;
      return ext <= minV - 1 + (maxPossible - maxV);
    };
    // Low ace (A=1), all 2s as wildcards
    if (trySeq((c) => RANK_ORDER[c.rank], 13, wildcards.length)) return 'sequence';
    // Promote one same-suit 2 to natural rank-2 (low ace only)
    const hasSameSuit2 = wildcards.some((c) => c.suit === seqSuit);
    const promotedWcCount = wildcards.length - 1;
    if (hasSameSuit2 && !naturals.some((c) => c.rank === '2') && promotedWcCount <= 1) {
      const promotedVals = [...naturals.map((c) => RANK_ORDER[c.rank]), 2];
      const uniquePromoted = new Set(promotedVals);
      if (uniquePromoted.size === promotedVals.length) {
        const minV = Math.min(...promotedVals);
        const maxV = Math.max(...promotedVals);
        const gaps = maxV - minV + 1 - promotedVals.length;
        if (gaps <= promotedWcCount && promotedWcCount - gaps <= minV - 1 + (13 - maxV)) return 'sequence';
      }
    }
    // High ace (A=14): covers Q K A, 10 J Q K A, etc.
    if (naturals.some((c) => c.rank === 'A')) {
      if (trySeq((c) => (c.rank === 'A' ? 14 : RANK_ORDER[c.rank]), 14, wildcards.length)) return 'sequence';
    }
  }

  return null;
}
