import React, { useState } from 'react';
import type { Meld } from '../types';
import { CardView } from './CardView';
import { useTranslation } from '../i18n';

interface MeldViewProps {
  meld: Meld;
  onAddCards?: (meldId: string) => void;
  canAdd?: boolean;
  onDrop?: (meldId: string) => void;
  canDrop?: boolean;
}

export const MeldView: React.FC<MeldViewProps> = ({ meld, onAddCards, canAdd, onDrop, canDrop }) => {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const label = meld.isCanasta ? (meld.isCleanCanasta ? t.meld.cleanCanasta : t.meld.dirtyCanasta) : meld.type === 'group' ? t.meld.group : t.meld.sequence;

  return (
    <div
      className={`meld${meld.isCanasta ? ' meld-canasta' : ''}${meld.isCleanCanasta ? ' meld-clean' : ''}${dragOver && canDrop ? ' meld-drop-over' : ''}`}
      onDragOver={
        canDrop
          ? (e) => {
              e.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={canDrop ? () => setDragOver(false) : undefined}
      onDrop={
        canDrop && onDrop
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.getData('source') === 'hand') onDrop(meld.id);
            }
          : undefined
      }
    >
      <div className="meld-header">
        <span className="meld-label">{label}</span>
        <span className="meld-count">
          {meld.cards.length} {t.meld.cards}
        </span>
        {canAdd && onAddCards && (
          <button className="btn-sm" onClick={() => onAddCards(meld.id)}>
            {t.meld.addCards}
          </button>
        )}
      </div>
      <div className="meld-cards">
        {meld.cards.map((c) => (
          <CardView key={c.id} card={c} small />
        ))}
      </div>
    </div>
  );
};
