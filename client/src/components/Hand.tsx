import React from 'react';
import type { Card } from '../types';
import { CardView } from './CardView';

interface Props {
  cards: Card[];
  selectedIds?: Set<string>;
  onCardClick?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, idx: number, cardId: string) => void;
  onDragOver?: (e: React.DragEvent, idx: number) => void;
  onDrop?: (e: React.DragEvent, idx: number) => void;
  onDragEnd?: () => void;
  dragIdx?: number | null;
  dragOverIdx?: number | null;
  highlightIds?: Set<string>;
  small?: boolean;
  showSort?: boolean;
  onSort?: () => void;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
}

export const Hand: React.FC<Props> = ({ cards, selectedIds, onCardClick, draggable, onDragStart, onDragOver, onDrop, onDragEnd, dragIdx, dragOverIdx, highlightIds, small, showSort, onSort, className, emptyPlaceholder }) => {
  return (
    <>
      {showSort && onSort && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button className="btn btn-ghost btn-sort" onClick={onSort}>
            Sort
          </button>
        </div>
      )}
      <div className={`hand-cards ${className ?? ''}`}>
        {cards.length === 0 && (emptyPlaceholder ?? <span className="first-lay-empty">No cards</span>)}
        {cards.map((card, idx) => {
          const wrapperProps: any = {};
          if (draggable && onDragStart) {
            wrapperProps.draggable = true;
            wrapperProps.onDragStart = (e: React.DragEvent) => onDragStart(e as any, idx, card.id);
            wrapperProps.onDragOver = onDragOver ? (e: React.DragEvent) => onDragOver(e as any, idx) : undefined;
            wrapperProps.onDrop = onDrop ? (e: React.DragEvent) => onDrop(e as any, idx) : undefined;
            wrapperProps.onDragEnd = onDragEnd;
            wrapperProps.className = `card-drag-wrapper${dragIdx === idx ? ' card-dragging' : ''}${dragOverIdx === idx && dragIdx !== idx ? ' card-drag-over' : ''}`;
          }

          return draggable ? (
            <div key={card.id} {...wrapperProps}>
              <CardView card={card} selected={selectedIds ? selectedIds.has(card.id) : false} highlighted={highlightIds ? highlightIds.has(card.id) : false} onClick={() => onCardClick && onCardClick(card.id)} small={small} />
            </div>
          ) : (
            <div key={card.id}>
              <CardView card={card} selected={selectedIds ? selectedIds.has(card.id) : false} highlighted={highlightIds ? highlightIds.has(card.id) : false} small={small} onClick={() => onCardClick && onCardClick(card.id)} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Hand;
