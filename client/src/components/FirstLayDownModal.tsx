import React, { useState } from 'react';
import type { Card, MeldType, TeamState } from '../types';
import { CardView } from './CardView';
import { Hand } from './Hand';
import { detectMeldType, cardPoints } from '../socket';
import { useTranslation } from '../i18n';

interface StagedMeld {
  id: string;
  cards: Card[];
  meldType: MeldType;
  points: number;
  isCanasta: boolean;
}

interface Props {
  hand: Card[];
  team: TeamState;
  onConfirm: (melds: { cardIds: string[]; meldType: MeldType }[]) => void;
  onClose: () => void;
}

function classifyMeld(cards: Card[], meldType: MeldType): { isCanasta: boolean; isClean: boolean } {
  if (cards.length < 7) return { isCanasta: false, isClean: false };
  const isGroupOf2s = meldType === 'group' && cards.every((c) => c.rank === '2');
  if (isGroupOf2s) return { isCanasta: true, isClean: true };
  const wildcards = cards.filter((c) => c.rank === '2');
  const naturals = cards.filter((c) => c.rank !== '2');
  if (wildcards.length >= naturals.length) return { isCanasta: false, isClean: false };
  return { isCanasta: true, isClean: wildcards.length === 0 };
}

function calcMeldPoints(cards: Card[], isCanasta: boolean, isClean: boolean): number {
  const base = cards.reduce((sum, c) => sum + cardPoints(c), 0);
  if (isCanasta) return base + (isClean ? 200 : 100);
  return base;
}

export const FirstLayDownModal: React.FC<Props> = ({ hand, team, onConfirm, onClose }) => {
  const { t, interpolate } = useTranslation();
  const [stagedMelds, setStagedMelds] = useState<StagedMeld[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stageError, setStageError] = useState<string | null>(null);

  // Local hand ordering inside modal (does not affect global hand order unless confirmed)
  const SUIT_SORT: Record<string, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
  const RANK_SORT: Record<string, number> = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
  const defaultSortHand = (cards: Card[]) =>
    [...cards].sort((a, b) => {
      const sd = SUIT_SORT[a.suit] - SUIT_SORT[b.suit];
      return sd !== 0 ? sd : (RANK_SORT as any)[a.rank] - (RANK_SORT as any)[b.rank];
    });

  const [handOrder, setHandOrder] = useState<string[]>(() => hand.map((c) => c.id));

  // Reset modal order when the provided hand changes (e.g., new cards)
  React.useEffect(() => {
    setHandOrder(hand.map((c) => c.id));
    setSelectedIds(new Set());
    setStagedMelds([]);
  }, [hand]);

  const usedIds = new Set(stagedMelds.flatMap((m) => m.cards.map((c) => c.id)));
  const orderedHand = handOrder.map((id) => hand.find((c) => c.id === id)).filter((c): c is Card => !!c);
  const availableHand = orderedHand.filter((c) => !usedIds.has(c.id));
  const totalPts = stagedMelds.reduce((sum, m) => sum + m.points, 0);
  const willCreateCanasta = stagedMelds.some((m) => m.isCanasta);
  const willHaveCanasta = team.hasCanasta || willCreateCanasta;
  const remainingCards = hand.length - usedIds.size;
  const canConfirm = stagedMelds.length > 0 && totalPts >= 100 && (willHaveCanasta || remainingCards >= 1);

  const selectedCards = availableHand.filter((c) => selectedIds.has(c.id));
  const detectedType = selectedCards.length >= 3 ? detectMeldType(selectedCards) : null;

  const handleToggleCard = (cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    setStageError(null);
  };

  const handleStageMeld = () => {
    if (selectedCards.length < 3) {
      setStageError(t.firstLayDown.needAtLeast3);
      return;
    }
    const meldType = detectMeldType(selectedCards);
    if (!meldType) {
      setStageError(t.firstLayDown.invalidMeld);
      return;
    }
    const { isCanasta, isClean } = classifyMeld(selectedCards, meldType);
    const points = calcMeldPoints(selectedCards, isCanasta, isClean);
    setStagedMelds((prev) => [...prev, { id: `staged-${Date.now()}-${Math.random()}`, cards: selectedCards, meldType, points, isCanasta }]);
    setSelectedIds(new Set());
    setStageError(null);
  };

  const handleRemoveMeld = (meldId: string) => {
    setStagedMelds((prev) => prev.filter((m) => m.id !== meldId));
  };

  const handleConfirm = () => {
    onConfirm(stagedMelds.map((m) => ({ cardIds: m.cards.map((c) => c.id), meldType: m.meldType })));
  };

  const pointsLeft = Math.max(0, 100 - totalPts);

  return (
    <div className="first-lay-overlay" onClick={onClose}>
      <div className="first-lay-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="first-lay-header">
          <h2>{t.firstLayDown.title}</h2>
          <p className="first-lay-subtitle">{t.firstLayDown.subtitle}</p>
        </div>

        {/* Summary bar */}
        <div className="first-lay-summary">
          <span className={`first-lay-total${totalPts >= 100 ? ' first-lay-total-ok' : ''}`}>
            {interpolate(t.firstLayDown.total, { pts: totalPts })}
            {totalPts < 100 && <span className="first-lay-needed"> / 100</span>}
          </span>
          <span className="first-lay-remaining">{interpolate(t.firstLayDown.remaining, { count: availableHand.length })}</span>
        </div>

        {/* Staged melds */}
        <div className="first-lay-staged">
          <div className="first-lay-staged-label">{t.firstLayDown.stagedLabel}</div>
          {stagedMelds.length === 0 ? (
            <p className="first-lay-empty">{t.firstLayDown.noMelds}</p>
          ) : (
            <div className="first-lay-staged-list">
              {stagedMelds.map((m) => (
                <div key={m.id} className={`first-lay-meld${m.isCanasta ? ' first-lay-meld-canasta' : ''}`}>
                  <div className="first-lay-meld-header">
                    <span className="first-lay-meld-type">{m.meldType === 'group' ? t.meld.group : t.meld.sequence}</span>
                    {m.isCanasta && <span className="first-lay-canasta-badge">★</span>}
                    <span className="first-lay-meld-pts">{interpolate(t.firstLayDown.meldPts, { pts: m.points })}</span>
                    <button className="first-lay-remove" onClick={() => handleRemoveMeld(m.id)} title={t.firstLayDown.removeMeld}>
                      ✕
                    </button>
                  </div>
                  <div className="first-lay-meld-cards">
                    {m.cards.map((c) => (
                      <CardView key={c.id} card={c} small />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hand */}
        <div className="first-lay-hand">
          <div className="first-lay-hand-label">
            <span>{interpolate(t.firstLayDown.selectFromHand, { count: selectedIds.size })}</span>
            <button className="btn btn-ghost btn-sort first-lay-sort" onClick={() => setHandOrder(defaultSortHand(hand).map((c) => c.id))} title={t.firstLayDown.sortHand}>
              {t.firstLayDown.sortBtn}
            </button>
          </div>
          <div className="first-lay-hand-cards">
            <Hand cards={availableHand} selectedIds={selectedIds} onCardClick={(id) => handleToggleCard(id)} draggable={false} small emptyPlaceholder={<span className="first-lay-empty">{t.firstLayDown.handEmpty}</span>} />
          </div>
        </div>

        {/* Stage action */}
        {selectedIds.size > 0 && (
          <div className="first-lay-stage-action">
            <button className="btn btn-success" onClick={handleStageMeld} disabled={selectedCards.length < 3 || detectedType === null} title={detectedType === null && selectedCards.length >= 3 ? t.firstLayDown.invalidMeld : undefined}>
              {selectedCards.length < 3 ? t.firstLayDown.stageBtn : detectedType === 'group' ? t.game.layDownGroup : detectedType === 'sequence' ? t.game.layDownSequence : t.firstLayDown.stageBtn}
            </button>
            {stageError && <span className="first-lay-error">{stageError}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="first-lay-footer">
          <div className="first-lay-warnings">
            {stagedMelds.length > 0 && pointsLeft > 0 && <span className="first-lay-warn">{interpolate(t.firstLayDown.tooFewPoints, { remaining: pointsLeft })}</span>}
            {!willHaveCanasta && remainingCards < 1 && stagedMelds.length > 0 && <span className="first-lay-warn">{t.firstLayDown.noCardsLeft}</span>}
          </div>
          <div className="first-lay-buttons">
            <button className="btn btn-secondary" onClick={onClose}>
              {t.firstLayDown.cancelBtn}
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={!canConfirm}>
              {t.firstLayDown.confirmBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
