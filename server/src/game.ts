import { v4 as uuidv4 } from 'uuid';
import { Card, GameState, GamePhase, Meld, MeldType, Player, PlayerPrivate, TeamState, RoundSummary } from './types.js';
import { createDoubleDeck, shuffle, cardPoints, validateGroup, validateSequence, detectMeldType, sortSequenceCards, classifyCanasta, meldPoints, rankValue } from './cards.js';

export interface FullGameState {
  public: GameState;
  players: PlayerPrivate[];
  stock: Card[];
}

export class Game {
  private state: FullGameState;

  constructor(gameId: string) {
    this.state = {
      public: {
        id: gameId,
        phase: 'lobby',
        players: [],
        teams: [
          { id: 0, score: 0, roundScore: 0, melds: [], hasCanasta: false, inHole: false, hasLaidDown: false },
          { id: 1, score: 0, roundScore: 0, melds: [], hasCanasta: false, inHole: false, hasLaidDown: false },
        ],
        currentPlayerIndex: 0,
        stockCount: 0,
        discardPile: [],
        round: 0,
        turnPhase: 'mustDraw',
      },
      players: [],
      stock: [],
    };
  }

  getPublicState(): GameState {
    return this.state.public;
  }

  getPlayerState(playerId: string): PlayerPrivate | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  private updateSyncedPlayer(p: PlayerPrivate) {
    const pub = this.state.public.players.find((x: Player) => x.id === p.id);
    if (pub) {
      pub.handCount = p.hand.length;
      pub.connected = p.connected;
      pub.status = p.status;
    }
  }

  addPlayer(id: string, publicId: string, name: string): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.gameAlreadyStarted' };
    if (this.state.players.length >= 4) return { success: false, error: 'errors.gameFull' };
    if (this.state.players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'errors.nameTaken' };
    }

    const seatIndex = this.state.players.length as 0 | 1 | 2 | 3;
    // Assign to the team with fewer players; prefer team A (0) on tie
    const teamACount = this.state.public.players.filter((p) => p.teamId === 0).length;
    const teamBCount = this.state.public.players.filter((p) => p.teamId === 1).length;
    const teamId = (teamBCount < teamACount ? 1 : 0) as 0 | 1;

    const privatePlayer: PlayerPrivate = {
      id,
      publicId,
      name,
      teamId,
      seatIndex,
      status: 'waiting',
      handCount: 0,
      connected: true,
      hand: [],
    };

    this.state.players.push(privatePlayer);
    this.state.public.players.push({
      id,
      publicId,
      name,
      teamId,
      seatIndex,
      status: 'waiting',
      handCount: 0,
      connected: true,
    });

    return { success: true };
  }

  reconnectPlayer(playerId: string): boolean {
    const p = this.state.players.find((x) => x.id === playerId);
    if (!p) return false;
    p.connected = true;
    this.updateSyncedPlayer(p);
    return true;
  }

  disconnectPlayer(playerId: string) {
    const p = this.state.players.find((x) => x.id === playerId);
    if (!p) return;
    p.connected = false;
    this.updateSyncedPlayer(p);
  }

  setReady(playerId: string, ready: boolean): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.notInLobby' };
    const p = this.state.players.find((x) => x.id === playerId);
    if (!p) return { success: false, error: 'errors.playerNotFound' };
    p.status = ready ? 'ready' : 'waiting';
    this.updateSyncedPlayer(p);
    return { success: true };
  }

  selectTeam(playerId: string, teamId: 0 | 1): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.notInLobby' };
    const p = this.state.players.find((x) => x.id === playerId);
    if (!p) return { success: false, error: 'errors.playerNotFound' };

    // Check team size (max 2 per team)
    const teamCount = this.state.players.filter((x) => x.id !== playerId && x.teamId === teamId).length;
    if (teamCount >= 2) return { success: false, error: 'errors.teamFull' };

    p.teamId = teamId;
    const pub = this.state.public.players.find((x: Player) => x.id === playerId);
    if (pub) pub.teamId = teamId;
    return { success: true };
  }

  /** Leader moves any player to a different team (no capacity limit — leader has full control). */
  movePlayerToTeam(targetPublicId: string, teamId: 0 | 1): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.notInLobby' };
    const p = this.state.players.find((x) => x.publicId === targetPublicId);
    if (!p) return { success: false, error: 'errors.playerNotFound' };
    p.teamId = teamId;
    const pub = this.state.public.players.find((x: Player) => x.publicId === targetPublicId);
    if (pub) pub.teamId = teamId;
    return { success: true };
  }

  /** Leader swaps the within-team seat order of two players (defines turn order). */
  swapTeamOrder(publicIdA: string, publicIdB: string): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.notInLobby' };
    const pA = this.state.players.find((x) => x.publicId === publicIdA);
    const pB = this.state.players.find((x) => x.publicId === publicIdB);
    if (!pA || !pB) return { success: false, error: 'errors.playerNotFound' };
    if (pA.teamId !== pB.teamId) return { success: false, error: 'errors.playersSameTeam' };
    const tmpSeat = pA.seatIndex;
    pA.seatIndex = pB.seatIndex;
    pB.seatIndex = tmpSeat;
    const pubA = this.state.public.players.find((x: Player) => x.publicId === publicIdA);
    const pubB = this.state.public.players.find((x: Player) => x.publicId === publicIdB);
    if (pubA && pubB) {
      const tmpPubSeat = pubA.seatIndex;
      pubA.seatIndex = pubB.seatIndex;
      pubB.seatIndex = tmpPubSeat;
    }
    return { success: true };
  }

  /** Leader removes a player from the lobby. */
  removePlayer(targetPublicId: string): { success: boolean; error?: string } {
    if (this.state.public.phase !== 'lobby') return { success: false, error: 'errors.kickOnlyInLobby' };
    const idx = this.state.players.findIndex((x) => x.publicId === targetPublicId);
    if (idx === -1) return { success: false, error: 'errors.playerNotFound' };
    this.state.players.splice(idx, 1);
    this.state.public.players = this.state.public.players.filter((x: Player) => x.publicId !== targetPublicId);
    return { success: true };
  }

  /** Pause the game (player disconnected mid-round). */
  pauseGame() {
    if (this.state.public.phase === 'playing') {
      this.state.public.phase = 'paused';
    }
  }

  /** Resume from paused state. */
  resumeGame() {
    if (this.state.public.phase === 'paused') {
      this.state.public.phase = 'playing';
    }
  }

  canStart(): boolean {
    if (this.state.players.length !== 4) return false;
    if (!this.state.players.every((p) => p.status === 'ready')) return false;
    // Check teams are balanced (2 per team)
    const team0 = this.state.players.filter((p) => p.teamId === 0).length;
    const team1 = this.state.players.filter((p) => p.teamId === 1).length;
    return team0 === 2 && team1 === 2;
  }

  startRound() {
    const gs = this.state.public;
    gs.phase = 'playing';
    gs.round++;

    // Reset round state
    gs.teams[0].melds = [];
    gs.teams[0].roundScore = 0;
    gs.teams[0].hasCanasta = false;
    gs.teams[0].hasLaidDown = false;
    gs.teams[1].melds = [];
    gs.teams[1].roundScore = 0;
    gs.teams[1].hasCanasta = false;
    gs.teams[1].hasLaidDown = false;

    // Update in-hole status
    gs.teams[0].inHole = gs.teams[0].score >= 1000;
    gs.teams[1].inHole = gs.teams[1].score >= 1000;

    // Deal 13 cards per player
    const deck = shuffle(createDoubleDeck());
    for (const p of this.state.players) {
      p.hand = deck.splice(0, 13);
      p.handCount = p.hand.length;
      p.status = 'playing';
      this.updateSyncedPlayer(p);
    }
    this.state.stock = deck;
    gs.stockCount = deck.length;

    // Start with empty discard pile — first player must draw from stock
    gs.discardPile = [];
    gs.lastRoundPublicId = undefined;
    gs.takenSingleDiscardCardId = undefined;

    // Re-assign seatIndex to guarantee A→B→A→B interleaved turn order.
    // Sort each team by *current* seatIndex so the leader's lobby ordering is preserved:
    // the player with the lower seatIndex is "player 1" of that team.
    const teamA = this.state.players.filter((p) => p.teamId === 0).sort((a, b) => a.seatIndex - b.seatIndex);
    const teamB = this.state.players.filter((p) => p.teamId === 1).sort((a, b) => a.seatIndex - b.seatIndex);
    // Fixed seats: A1=0, B1=1, A2=2, B2=3
    teamA[0].seatIndex = 0;
    teamB[0].seatIndex = 1;
    teamA[1].seatIndex = 2;
    teamB[1].seatIndex = 3;
    // Sync to public player list
    for (const p of this.state.players) {
      const pub = gs.players.find((x: Player) => x.id === p.id);
      if (pub) pub.seatIndex = p.seatIndex;
    }

    // Sort players by seat index for turn order
    this.state.players.sort((a, b) => a.seatIndex - b.seatIndex);
    gs.players.sort((a: Player, b: Player) => a.seatIndex - b.seatIndex);

    // Rotate starting player each round:
    // Round 1 → seat 0 (A1), Round 2 → seat 1 (B1), Round 3 → seat 2 (A2), Round 4 → seat 3 (B2), repeat.
    gs.currentPlayerIndex = (gs.round - 1) % 4;
    gs.turnPhase = 'mustDraw';
    gs.lastAction = 'Round started!';
  }

  private getCurrentPlayer(): PlayerPrivate | undefined {
    const idx = this.state.public.currentPlayerIndex;
    return this.state.players.find((p) => p.seatIndex === idx);
  }

  private advanceTurn() {
    const gs = this.state.public;
    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % 4;
    gs.turnPhase = 'mustDraw';
    gs.takenSingleDiscardCardId = undefined;
  }

  drawFromStock(playerId: string): { success: boolean; error?: string } {
    const gs = this.state.public;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { success: false, error: 'errors.notYourTurn' };
    if (gs.turnPhase !== 'mustDraw') return { success: false, error: 'errors.alreadyDrew' };

    if (this.state.stock.length === 0) {
      return { success: false, error: 'errors.deckEmpty' };
    }

    const card = this.state.stock.pop()!;
    gs.stockCount = this.state.stock.length;
    current.hand.push(card);
    current.handCount = current.hand.length;
    this.updateSyncedPlayer(current);
    gs.turnPhase = 'canAct';

    if (gs.stockCount === 0) {
      gs.lastRoundPublicId = current.publicId;
      gs.lastAction = `${current.name} comprou a última carta! Última jogada antes do fim da rodada.`;
    } else {
      gs.lastAction = `${current.name} drew from stock`;
    }
    return { success: true };
  }

  takeDiscard(playerId: string): { success: boolean; error?: string } {
    const gs = this.state.public;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { success: false, error: 'errors.notYourTurn' };
    if (gs.turnPhase !== 'mustDraw') return { success: false, error: 'errors.alreadyDrew' };
    if (gs.discardPile.length === 0) return { success: false, error: 'errors.discardEmpty' };

    // Special case: only 1 card in hand and only 1 card in discard -> must draw from stock
    if (current.hand.length === 1 && gs.discardPile.length === 1) {
      return { success: false, error: 'errors.mustDrawFromStock' };
    }

    const pile = [...gs.discardPile];
    current.hand.push(...pile);
    current.handCount = current.hand.length;
    gs.discardPile = [];
    // Track the taken card so the player can't immediately discard it back (single-card pile only)
    gs.takenSingleDiscardCardId = pile.length === 1 ? pile[0].id : undefined;
    this.updateSyncedPlayer(current);
    gs.turnPhase = 'canAct';
    gs.lastAction = `${current.name} took the discard pile (${pile.length} cards)`;
    return { success: true };
  }

  layDown(playerId: string, cardIds: string[], meldType?: MeldType, targetMeldId?: string): { success: boolean; error?: string } {
    const gs = this.state.public;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { success: false, error: 'errors.notYourTurn' };
    if (gs.turnPhase === 'mustDraw') return { success: false, error: 'errors.mustDrawFirst' };

    const team = gs.teams[current.teamId];

    // Find cards in hand
    const cards = cardIds.map((id) => current.hand.find((c: Card) => c.id === id)).filter(Boolean) as Card[];
    if (cards.length !== cardIds.length) return { success: false, error: 'errors.cardsNotInHand' };

    if (targetMeldId) {
      // Add to existing meld
      return this.addToExistingMeld(current, team, cards, targetMeldId);
    }

    // Auto-detect meld type if not provided
    let resolvedType: MeldType;
    if (meldType) {
      resolvedType = meldType;
      const validation = meldType === 'group' ? validateGroup(cards) : validateSequence(cards);
      if (!validation.valid) return { success: false, error: validation.reason };
    } else {
      const detected = detectMeldType(cards);
      if (!detected.type) return { success: false, error: detected.error };
      resolvedType = detected.type;
    }

    // Check first lay-down rules
    if (!team.hasLaidDown) {
      const err = this.validateFirstLayDown(current.teamId, [cards]);
      if (err) return { success: false, error: err };
      team.hasLaidDown = true;
    }

    const { isCanasta, isClean } = classifyCanasta(cards, resolvedType);
    const orderedCards = resolvedType === 'sequence' ? sortSequenceCards(cards) : cards;

    // Enforce minimum-hand rule: without a canasta, at least 2 cards must remain after laying down
    // (so the player can still discard and keep 1). Exception: creating a canasta now is fine.
    const willHaveCanasta = team.hasCanasta || isCanasta;
    if (!willHaveCanasta && current.hand.length - cardIds.length < 1) {
      return { success: false, error: 'errors.noCanastaNeedCard' };
    }

    const meld: Meld = {
      id: uuidv4(),
      type: resolvedType,
      cards: orderedCards,
      teamId: current.teamId,
      isCanasta,
      isCleanCanasta: isClean,
    };

    team.melds.push(meld);
    if (isCanasta) team.hasCanasta = true;

    // Remove from hand
    const cardIdSet = new Set(cardIds);
    current.hand = current.hand.filter((c: Card) => !cardIdSet.has(c.id));
    current.handCount = current.hand.length;
    this.updateSyncedPlayer(current);

    // Auto go-out: team has a canasta and player played every card
    if (team.hasCanasta && current.hand.length === 0) {
      gs.lastAction = `${current.name} baixou e saiu! Fim da rodada.`;
      this.endRound(current.teamId);
      return { success: true };
    }

    gs.lastAction = `${current.name} laid down a ${resolvedType}`;
    return { success: true };
  }

  private addToExistingMeld(player: PlayerPrivate, team: TeamState, cards: Card[], meldId: string): { success: boolean; error?: string } {
    const meld = team.melds.find((m: Meld) => m.id === meldId);
    if (!meld) return { success: false, error: 'errors.meldNotFound' };

    const combined = [...meld.cards, ...cards];
    let validation;
    if (meld.type === 'group') {
      validation = validateGroup(combined);
    } else {
      validation = validateSequence(combined);
    }
    if (!validation.valid) return { success: false, error: validation.reason };

    const { isCanasta, isClean } = classifyCanasta(combined, meld.type);

    // Enforce minimum-hand rule before committing
    const willHaveCanasta = team.hasCanasta || isCanasta;
    if (!willHaveCanasta && player.hand.length - cards.length < 1) {
      return { success: false, error: 'errors.noCanastaNeedCard' };
    }

    meld.cards = meld.type === 'sequence' ? sortSequenceCards(combined) : combined;
    meld.isCanasta = isCanasta;
    meld.isCleanCanasta = isClean;
    if (isCanasta) team.hasCanasta = true;

    const cardIdSet = new Set(cards.map((c: Card) => c.id));
    player.hand = player.hand.filter((c: Card) => !cardIdSet.has(c.id));
    player.handCount = player.hand.length;
    this.updateSyncedPlayer(player);

    // Auto go-out: team now has a canasta and player has no cards left
    if (team.hasCanasta && player.hand.length === 0) {
      this.state.public.lastAction = `${player.name} adicionou e saiu! Fim da rodada.`;
      this.endRound(player.teamId);
      return { success: true };
    }

    this.state.public.lastAction = `${player.name} added to a ${meld.type}`;
    return { success: true };
  }

  private validateFirstLayDown(teamId: 0 | 1, cardGroups: Card[][]): string | null {
    const team = this.state.public.teams[teamId];

    if (!team.inHole) {
      // Fora do buraco: any valid combination works
      return null;
    }

    // No buraco: first lay-down must sum >= 100 pts (including canasta bonuses)
    let total = 0;
    for (const cards of cardGroups) {
      const meldType = this.inferMeldType(cards);
      const { isCanasta, isClean } = classifyCanasta(cards, meldType);
      total += meldPoints(cards, isCanasta, isClean);
    }

    if (total < 100) {
      return 'errors.firstLayDownMinScore';
    }
    return null;
  }

  private inferMeldType(cards: Card[]): 'group' | 'sequence' {
    const naturals = cards.filter((c) => c.rank !== '2');
    if (naturals.length === 0) return 'group';
    const suits = new Set(naturals.map((c) => c.suit));
    return suits.size === 1 ? 'sequence' : 'group';
  }

  discard(playerId: string, cardId: string): { success: boolean; error?: string } {
    const gs = this.state.public;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { success: false, error: 'errors.notYourTurn' };
    if (gs.turnPhase === 'mustDraw') return { success: false, error: 'errors.mustDrawFirst' };

    const cardIndex = current.hand.findIndex((c: Card) => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'errors.cardNotInHand' };

    // Cannot discard a card that was just taken as the sole card from the discard pile
    if (gs.takenSingleDiscardCardId && gs.takenSingleDiscardCardId === cardId) {
      return { success: false, error: 'errors.cannotDiscardTakenCard' };
    }

    const team = gs.teams[current.teamId];

    // Without a canasta the player cannot empty their hand by discarding
    if (!team.hasCanasta && current.hand.length <= 1) {
      return { success: false, error: 'errors.noCanastaNeedCard' };
    }

    const [card] = current.hand.splice(cardIndex, 1);
    current.handCount = current.hand.length;
    gs.discardPile.push(card);
    this.updateSyncedPlayer(current);

    // Auto go-out: team has canasta and player just discarded their last card
    if (team.hasCanasta && current.hand.length === 0) {
      gs.lastAction = `${current.name} descartou e saiu! Fim da rodada.`;
      this.endRound(current.teamId);
      return { success: true };
    }

    // Deck-out last round: this player drew the last stock card; their discard ends the round
    if (gs.lastRoundPublicId === current.publicId) {
      gs.lastAction = `${current.name} descartou. Baralho esgotado — fim da rodada!`;
      this.endRound(null);
      return { success: true };
    }

    gs.lastAction = `${current.name} discarded ${card.rank} of ${card.suit}`;
    this.advanceTurn();
    return { success: true };
  }

  goOut(playerId: string, discardCardId?: string): { success: boolean; error?: string } {
    const gs = this.state.public;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { success: false, error: 'errors.notYourTurn' };
    if (gs.turnPhase === 'mustDraw') return { success: false, error: 'errors.mustDrawFirst' };

    const team = gs.teams[current.teamId];
    if (!team.hasCanasta) {
      return { success: false, error: 'errors.needCanastaToGoOut' };
    }

    // Optionally discard
    if (discardCardId) {
      const cardIndex = current.hand.findIndex((c: Card) => c.id === discardCardId);
      if (cardIndex === -1) return { success: false, error: 'errors.cardNotInHand' };
      const [card] = current.hand.splice(cardIndex, 1);
      gs.discardPile.push(card);
    }

    // Must have empty hand (or only the optional discard handles it)
    if (current.hand.length > 0) {
      // Put card back if we removed it
      return { success: false, error: 'errors.mustPlayAllCards' };
    }

    current.handCount = 0;
    this.updateSyncedPlayer(current);

    gs.lastAction = `${current.name} went out! Round over.`;
    this.endRound(current.teamId);
    return { success: true };
  }

  private endRound(winnerTeamId: 0 | 1 | null) {
    const gs = this.state.public;
    gs.phase = 'roundEnd';

    // Calculate scores
    for (let t = 0; t < 2; t++) {
      const team = gs.teams[t];
      let score = 0;

      // Points from melds
      for (const meld of team.melds) {
        score += meldPoints(meld.cards, meld.isCanasta, meld.isCleanCanasta);
      }

      // Subtract cards remaining in hand for players who didn't go out
      for (const player of this.state.players) {
        if (player.teamId === t) {
          // Only the going-out player has empty hand; partner still has cards
          if (player.hand.length > 0) {
            for (const card of player.hand) {
              score -= cardPoints(card);
            }
          }
        }
      }

      // Bonus for going out (not awarded when round ends due to empty deck)
      if (winnerTeamId !== null && t === winnerTeamId) {
        score += 50;
      }

      team.roundScore = score;
      team.score += score;
    }

    // ── Build roundSummary for browser-side debug logging ─────────────────
    const teamNames = (gs as any).teamNames ?? ['Time A', 'Time B'];
    const summary: RoundSummary = {
      round: gs.round,
      winner: winnerTeamId !== null ? teamNames[winnerTeamId] : 'Baralho esgotado',

      teams: [0, 1].map((t) => ({
        name: teamNames[t],
        roundScore: gs.teams[t].roundScore,
        totalScore: gs.teams[t].score,
        melds: gs.teams[t].melds.map((m: Meld) => ({
          type: m.isCleanCanasta ? 'canastra-limpa' : m.isCanasta ? 'canastra-suja' : m.type,
          cards: m.cards.map((c: Card) => `${c.rank}${c.suit[0].toUpperCase()}`),
          points: meldPoints(m.cards, m.isCanasta, m.isCleanCanasta),
        })),
        players: this.state.players
          .filter((p) => p.teamId === t)
          .map((p) => ({
            name: p.name,
            hand: p.hand.map((c: Card) => `${c.rank}${c.suit[0].toUpperCase()}`),
            handPenalty: -p.hand.reduce((sum: number, c: Card) => sum + cardPoints(c), 0),
          })),
      })),
    };
    gs.roundSummary = summary;
    // ── end roundSummary ───────────────────────────────────────────────────

    // Check game over
    const maxScore = Math.max(gs.teams[0].score, gs.teams[1].score);
    if (maxScore >= 2000) {
      gs.phase = 'gameOver';
      gs.winner = gs.teams[0].score >= gs.teams[1].score ? 0 : 1;
    }
  }

  startNextRound() {
    if (this.state.public.phase !== 'roundEnd') return;
    // Reset ready status
    for (const p of this.state.players) {
      p.status = 'ready';
      this.updateSyncedPlayer(p);
    }
    this.startRound();
  }

  get playerCount(): number {
    return this.state.players.length;
  }

  hasPlayer(playerId: string): boolean {
    return this.state.players.some((p) => p.id === playerId);
  }

  getPhase(): GamePhase {
    return this.state.public.phase;
  }
}
