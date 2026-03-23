export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type MeldType = 'group' | 'sequence';

export interface Meld {
  id: string;
  type: MeldType;
  cards: Card[];
  teamId: 0 | 1;
  isCanasta: boolean;
  isCleanCanasta: boolean;
}

export type PlayerStatus = 'waiting' | 'ready' | 'playing';
export type GamePhase = 'lobby' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';

export interface Player {
  id: string;
  publicId: string;
  name: string;
  teamId: 0 | 1;
  seatIndex: 0 | 1 | 2 | 3;
  status: PlayerStatus;
  handCount: number;
  connected: boolean;
}

export interface TeamState {
  id: 0 | 1;
  score: number;
  roundScore: number;
  melds: Meld[];
  hasCanasta: boolean;
  inHole: boolean;
  hasLaidDown: boolean;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  teams: TeamState[];
  currentPlayerIndex: number;
  stockCount: number;
  discardPile: Card[];
  round: number;
  winner?: 0 | 1;
  turnPhase: 'mustDraw' | 'canAct' | 'mustDiscard';
  lastAction?: string;
  leaderId?: string;
  teamNames?: [string, string];
  roundSummary?: RoundSummary;
  lastRoundPublicId?: string;
  takenSingleDiscardCardId?: string;
  disconnectDeadlines?: Record<string, number>; // publicId → deadline timestamp (ms)
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

export type ClientMessage =
  | { type: 'join'; name: string; rejoinToken?: string }
  | { type: 'ready' }
  | { type: 'unready' }
  | { type: 'selectTeam'; teamId: 0 | 1 }
  | { type: 'movePlayer'; targetPublicId: string; teamId: 0 | 1 }
  | { type: 'kickPlayer'; targetPublicId: string }
  | { type: 'renameTeam'; teamId: 0 | 1; name: string }
  | { type: 'swapTeamOrder'; publicIdA: string; publicIdB: string }
  | { type: 'drawFromStock' }
  | { type: 'takeDiscard' }
  | { type: 'layDown'; cardIds: string[]; meldType?: MeldType; targetMeldId?: string }
  | { type: 'addToMeld'; meldId: string; cardIds: string[] }
  | { type: 'discard'; cardId: string }
  | { type: 'goOut'; discardCardId?: string }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'welcome'; playerId: string; publicId: string; rejoinToken: string; gameState: GameState; hand: Card[] }
  | { type: 'gameState'; gameState: GameState; hand: Card[] }
  | { type: 'kicked'; reason: string }
  | { type: 'error'; message: string }
  | { type: 'pong' };
