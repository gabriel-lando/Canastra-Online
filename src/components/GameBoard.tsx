import React, { useState, useRef, useEffect } from 'react';
import type { Card, GameState } from '../types';
import { CardView } from './CardView';
import { MeldView } from './MeldView';
import { isMyTurn, detectMeldType } from '../socket';

interface GameBoardProps {
  gameState: GameState;
  hand: Card[];
  myPublicId: string;
  myPlayerId: string;
  onDrawFromStock: () => void;
  onTakeDiscard: () => void;
  onLayDown: (cardIds: string[]) => void;
  onAddToMeld: (meldId: string, cardIds: string[]) => void;
  onDiscard: (cardId: string) => void;
  onGoOut: (discardCardId?: string) => void;
  errorMsg: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, hand, myPublicId, onDrawFromStock, onTakeDiscard, onLayDown, onAddToMeld, onDiscard, onGoOut: _onGoOut, errorMsg }) => {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [discardExpanded, setDiscardExpanded] = useState(false);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const prevHandIdsRef = useRef<Set<string>>(new Set());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentIds = new Set(hand.map((c) => c.id));
    const added = new Set([...currentIds].filter((id) => !prevHandIdsRef.current.has(id)));
    prevHandIdsRef.current = currentIds;
    if (added.size === 0) return;
    setNewCardIds(added);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setNewCardIds(new Set()), 1500);
  }, [hand]);

  const myTurn = isMyTurn(gameState, myPublicId);
  const me = gameState.players.find((p) => p.publicId === myPublicId);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const toggleCard = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCardIds(new Set());
  };

  const handleLayDown = () => {
    if (selectedCardIds.size < 3) return;
    onLayDown([...selectedCardIds]);
    clearSelection();
  };

  const handleAddToMeld = (meldId: string) => {
    if (selectedCardIds.size === 0) return;
    onAddToMeld(meldId, [...selectedCardIds]);
    clearSelection();
  };

  const handleDiscard = (cardId: string) => {
    onDiscard(cardId);
    clearSelection();
  };

  // --- Hand ordering (alternating colour: spades→hearts→clubs→diamonds, then rank) ---
  const SUIT_SORT: Record<string, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
  const RANK_SORT: Record<string, number> = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
  const defaultSortHand = (cards: Card[]) =>
    [...cards].sort((a, b) => {
      const sd = SUIT_SORT[a.suit] - SUIT_SORT[b.suit];
      return sd !== 0 ? sd : RANK_SORT[a.rank] - RANK_SORT[b.rank];
    });

  const [handOrder, setHandOrder] = useState<string[]>(() => defaultSortHand(hand).map((c) => c.id));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [discardDragOver, setDiscardDragOver] = useState(false);
  // Ref to pass dragged cardId into meld drop handler without stale closures
  const dragCardIdRef = useRef<string | null>(null);

  // Keep handOrder in sync: preserve custom order for existing cards, append new ones sorted.
  useEffect(() => {
    setHandOrder((prev) => {
      const currentIds = new Set(hand.map((c) => c.id));
      const filtered = prev.filter((id) => currentIds.has(id));
      const prevSet = new Set(filtered);
      const incoming = hand.filter((c) => !prevSet.has(c.id));
      return [...filtered, ...defaultSortHand(incoming).map((c) => c.id)];
    });
  }, [hand]);

  const displayHand = handOrder.map((id) => hand.find((c) => c.id === id)).filter((c): c is Card => c !== undefined);

  const handleDragStart = (e: React.DragEvent, idx: number, cardId: string) => {
    e.dataTransfer.setData('source', 'hand');
    e.dataTransfer.setData('cardId', cardId);
    dragCardIdRef.current = cardId;
    setDragIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    if (e.dataTransfer.getData('source') === 'hand' && e.dataTransfer.getData('cardId')) {
      // dropped on another hand card — reorder
    }
    if (dragIdx === null || dragIdx === idx) return;
    setHandOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
    dragCardIdRef.current = null;
  };

  /** Cards to act with: the dragged card + any other currently selected cards. */
  const dragActionCards = (cardId: string): string[] => (selectedCardIds.has(cardId) ? [...selectedCardIds] : [cardId]);

  const handleDropOnDiscard = (e: React.DragEvent) => {
    e.preventDefault();
    setDiscardDragOver(false);
    if (e.dataTransfer.getData('source') !== 'hand') return;
    if (!myTurn || gameState.turnPhase === 'mustDraw') return;
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;
    const cards = dragActionCards(cardId);
    if (cards.length === 1) handleDiscard(cards[0]);
  };

  const handleDropOnMeld = (meldId: string) => {
    const cardId = dragCardIdRef.current;
    if (!cardId || !myTurn || gameState.turnPhase === 'mustDraw') return;
    const cards = dragActionCards(cardId);
    onAddToMeld(meldId, cards);
    clearSelection();
  };

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-header">
        <div className="score-display">
          <div className={`score-team${me?.teamId === 0 ? ' score-mine' : ''}`}>
            <span>{gameState.teamNames?.[0] ?? 'Time A'}</span>
            <strong>{gameState.teams[0].score}</strong>
            {gameState.teams[0].inHole && <span className="in-hole-badge">🕳 No Buraco</span>}
          </div>
          <div className="score-sep">×</div>
          <div className={`score-team${me?.teamId === 1 ? ' score-mine' : ''}`}>
            <span>{gameState.teamNames?.[1] ?? 'Time B'}</span>
            <strong>{gameState.teams[1].score}</strong>
            {gameState.teams[1].inHole && <span className="in-hole-badge">🕳 No Buraco</span>}
          </div>
        </div>
        <div className="turn-indicator">
          {myTurn ? (
            <span className="my-turn">✨ Sua vez!</span>
          ) : (
            <span>
              Vez de: <strong>{currentPlayer?.name}</strong>
            </span>
          )}
          <span className="turn-phase">{gameState.turnPhase === 'mustDraw' ? '— Comprar' : gameState.turnPhase === 'canAct' ? '— Agir/Descartar' : '— Descartar'}</span>
        </div>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      {gameState.lastAction && <div className="last-action">{gameState.lastAction}</div>}

      {/* Other players */}
      <div className="other-players">
        {gameState.players
          .filter((p) => p.publicId !== myPublicId)
          .map((p) => {
            const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.publicId === p.publicId;
            return (
              <div key={p.publicId} className={`other-player${isCurrentTurn ? ' active-player' : ''}`}>
                <div className="other-player-info">
                  <span className={`team-dot team-dot-${p.teamId}`} />
                  <strong>{p.name}</strong>
                  <span className="hand-count">{p.handCount} cartas</span>
                  {!p.connected && <span className="offline-badge">offline</span>}
                  {isCurrentTurn && <span className="active-badge">▶ jogando</span>}
                </div>
                <div className="other-player-cards">
                  {Array.from({ length: Math.min(p.handCount, 13) }).map((_, i) => (
                    <div key={i} className="card card-back card-mini" />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Center: stock + discard */}
      <div className="game-center">
        <div className="stock-area">
          <div className={`card card-back${myTurn && gameState.turnPhase === 'mustDraw' ? ' card-clickable' : ''}`} onClick={() => myTurn && gameState.turnPhase === 'mustDraw' && onDrawFromStock()} title="Comprar do monte">
            <span className="stock-count">{gameState.stockCount}</span>
          </div>
          <span className="pile-label">Monte</span>
        </div>

        <div
          className={`discard-area${discardDragOver && myTurn && gameState.turnPhase !== 'mustDraw' ? ' discard-drop-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (myTurn && gameState.turnPhase !== 'mustDraw') setDiscardDragOver(true);
          }}
          onDragLeave={() => setDiscardDragOver(false)}
          onDrop={handleDropOnDiscard}
        >
          <div
            className={`discard-top-card${gameState.discardPile.length > 0 ? ' card-clickable' : ''}`}
            onClick={() => {
              if (gameState.discardPile.length === 0) return;
              if (myTurn && gameState.turnPhase === 'mustDraw') {
                onTakeDiscard();
              } else {
                setDiscardExpanded((v) => !v);
              }
            }}
            title={gameState.discardPile.length > 0 ? (myTurn && gameState.turnPhase === 'mustDraw' ? 'Pegar descarte' : 'Ver descarte') : 'Descarte vazio'}
          >
            {gameState.discardPile.length > 0 ? <CardView card={gameState.discardPile[gameState.discardPile.length - 1]} /> : <div className="card card-empty" />}
          </div>
          <span className="pile-label">
            Descarte ({gameState.discardPile.length})
            {gameState.discardPile.length > 1 && (
              <button className="btn-expand" onClick={() => setDiscardExpanded((v) => !v)}>
                {discardExpanded ? '▲' : '▼'}
              </button>
            )}
          </span>
          {discardExpanded && gameState.discardPile.length > 0 && (
            <div className="discard-expanded">
              <div className="discard-expanded-header">
                <span>Pilha de descarte ({gameState.discardPile.length} cartas)</span>
                <button className="btn-expand" onClick={() => setDiscardExpanded(false)}>
                  ✕
                </button>
              </div>
              <div className="discard-expanded-cards">
                {[...gameState.discardPile].reverse().map((card, i) => (
                  <CardView key={`${card.id}-${i}`} card={card} small />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table melds */}
      <div className="table-melds">
        <div className="table-melds-section">
          <h3>
            {gameState.teamNames?.[0] ?? 'Time A'}
            {me?.teamId === 0 ? ' (seu)' : ''}
          </h3>
          <div className="melds-list">
            {gameState.teams[0].melds.map((m) => (
              <MeldView
                key={m.id}
                meld={m}
                canAdd={myTurn && gameState.turnPhase !== 'mustDraw' && me?.teamId === 0 && selectedCardIds.size > 0}
                onAddCards={() => handleAddToMeld(m.id)}
                canDrop={myTurn && gameState.turnPhase !== 'mustDraw' && me?.teamId === 0}
                onDrop={handleDropOnMeld}
              />
            ))}
            {gameState.teams[0].melds.length === 0 && <span className="no-melds">Nenhuma combinação ainda</span>}
          </div>
        </div>
        <div className="table-melds-section">
          <h3>
            {gameState.teamNames?.[1] ?? 'Time B'}
            {me?.teamId === 1 ? ' (seu)' : ''}
          </h3>
          <div className="melds-list">
            {gameState.teams[1].melds.map((m) => (
              <MeldView
                key={m.id}
                meld={m}
                canAdd={myTurn && gameState.turnPhase !== 'mustDraw' && me?.teamId === 1 && selectedCardIds.size > 0}
                onAddCards={() => handleAddToMeld(m.id)}
                canDrop={myTurn && gameState.turnPhase !== 'mustDraw' && me?.teamId === 1}
                onDrop={handleDropOnMeld}
              />
            ))}
            {gameState.teams[1].melds.length === 0 && <span className="no-melds">Nenhuma combinação ainda</span>}
          </div>
        </div>
      </div>

      {/* My hand */}
      <div className="my-hand-area">
        <div className="hand-header">
          <h3>Sua mão ({hand.length} cartas)</h3>
          <div className="hand-header-right">
            {selectedCardIds.size > 0 && <span className="selected-info">{selectedCardIds.size} selecionada(s)</span>}
            <button className="btn btn-ghost btn-sort" title="Ordenar cartas" onClick={() => setHandOrder(defaultSortHand(hand).map((c) => c.id))}>
              ⇅ Ordenar
            </button>
          </div>
        </div>
        <div className="hand-cards">
          {displayHand.map((card, idx) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx, card.id)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`card-drag-wrapper${dragIdx === idx ? ' card-dragging' : ''}${dragOverIdx === idx && dragIdx !== idx ? ' card-drag-over' : ''}`}
            >
              <CardView card={card} selected={selectedCardIds.has(card.id)} highlighted={newCardIds.has(card.id)} onClick={() => toggleCard(card.id)} />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {myTurn && (
          <div className="hand-actions">
            {gameState.turnPhase === 'mustDraw' && (
              <div className="action-group">
                <button className="btn btn-primary" onClick={onDrawFromStock}>
                  📥 Comprar do Monte
                </button>
                {gameState.discardPile.length > 0 && (
                  <button className="btn btn-secondary" onClick={onTakeDiscard}>
                    🗑 Pegar Descarte ({gameState.discardPile.length})
                  </button>
                )}
              </div>
            )}

            {gameState.turnPhase !== 'mustDraw' && (
              <div className="action-group">
                {selectedCardIds.size >= 3 &&
                  (() => {
                    const selectedCards = hand.filter((c) => selectedCardIds.has(c.id));
                    const detected = detectMeldType(selectedCards);
                    const label = detected === 'group' ? '🃏 Baixar Grupo' : detected === 'sequence' ? '🔗 Baixar Sequência' : '🃏 Baixar';
                    return (
                      <button className="btn btn-success" onClick={handleLayDown} disabled={detected === null} title={detected === null ? 'Seleção inválida para grupo ou sequência' : undefined}>
                        {label}
                      </button>
                    );
                  })()}
                {selectedCardIds.size === 1 && (
                  <button className="btn btn-warning" onClick={() => handleDiscard([...selectedCardIds][0])}>
                    ↩ Descartar carta selecionada
                  </button>
                )}
                {selectedCardIds.size === 0 && <span className="hint">Selecione cartas para baixar, ou 1 para descartar</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
