export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // unique card id like "A-hearts-0"
}

export type MeldType = 'group' | 'sequence';

export interface Meld {
  id: string;
  type: MeldType;
  cards: Card[];
  teamId: 0 | 1;
  isCanasta: boolean;
  isCleanCanasta: boolean; // limpa
}

export type PlayerStatus = 'waiting' | 'ready' | 'playing';
export type GamePhase = 'lobby' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';

export interface Player {
  id: string; // UUID - private, used for WebSocket auth
  publicId: string; // short public ID visible to others
  name: string;
  teamId: 0 | 1;
  seatIndex: 0 | 1 | 2 | 3; // turn order
  status: PlayerStatus;
  handCount: number; // visible to others
  connected: boolean;
}

export interface PlayerPrivate extends Player {
  hand: Card[];
}

export interface TeamState {
  id: 0 | 1;
  score: number;
  roundScore: number;
  melds: Meld[];
  hasCanasta: boolean;
  inHole: boolean; // "no buraco" - has >= 1000 pts
  hasLaidDown: boolean; // made first lay this round
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[]; // public info only (no hand)
  teams: TeamState[];
  currentPlayerIndex: number; // seat index of whose turn it is
  stockCount: number;
  discardPile: Card[]; // full discard pile visible to all
  round: number;
  winner?: 0 | 1; // team id
  turnPhase: 'mustDraw' | 'canAct' | 'mustDiscard';
  lastAction?: string;
  leaderId?: string; // publicId of the room leader
  teamNames?: [string, string]; // custom team names, defaults to ["Time A", "Time B"]
  roundSummary?: RoundSummary; // populated when phase transitions to roundEnd
  lastRoundPublicId?: string; // set when last stock card is drawn; that player's discard ends the round
  takenSingleDiscardCardId?: string; // set when a player takes a single-card discard pile; cannot discard that card back
  disconnectDeadlines?: Record<string, number>; // publicId → deadline timestamp (ms) for reconnect timer
}

export interface RoundSummary {
  round: number;
  winner: string;
  teams: {
    name: string;
    roundScore: number;
    totalScore: number;
    melds: { type: string; cards: string[]; points: number }[];
    players: { name: string; hand: string[]; handPenalty: number }[];
  }[];
}

// Messages from client to server
export type ClientMessage =
  | { type: 'join'; name: string; rejoinToken?: string }
  | { type: 'ready' }
  | { type: 'unready' }
  | { type: 'selectTeam'; teamId: 0 | 1 }
  | { type: 'movePlayer'; targetPublicId: string; teamId: 0 | 1 } // leader only
  | { type: 'kickPlayer'; targetPublicId: string } // leader only
  | { type: 'renameTeam'; teamId: 0 | 1; name: string } // leader only
  | { type: 'swapTeamOrder'; publicIdA: string; publicIdB: string } // leader only
  | { type: 'drawFromStock' }
  | { type: 'takeDiscard' }
  | { type: 'layDown'; cardIds: string[]; meldType?: MeldType; targetMeldId?: string }
  | { type: 'addToMeld'; meldId: string; cardIds: string[] }
  | { type: 'discard'; cardId: string }
  | { type: 'goOut'; discardCardId?: string } // bater
  | { type: 'ping' };

// Messages from server to client
export type ServerMessage =
  | { type: 'welcome'; playerId: string; publicId: string; rejoinToken: string; gameState: GameState; hand: Card[] }
  | { type: 'gameState'; gameState: GameState; hand: Card[] }
  | { type: 'kicked'; reason: string }
  | { type: 'error'; message: string }
  | { type: 'pong' };
