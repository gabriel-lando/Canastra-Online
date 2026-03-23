import React from 'react';
import type { Card } from '../types';
import { suitSymbol, suitColor } from '../socket';

interface CardViewProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  highlighted?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({ card, selected, onClick, faceDown, small, highlighted }) => {
  if (faceDown) {
    return <div className={`card card-back${small ? ' card-small' : ''}`} onClick={onClick} title="Unknown card" />;
  }

  const color = suitColor(card.suit);
  const symbol = suitSymbol(card.suit);
  const isWild = card.rank === '2';

  return (
    <div
      className={`card${selected ? ' card-selected' : ''}${small ? ' card-small' : ''}${isWild ? ' card-wild' : ''}${highlighted ? ' card-new' : ''}${onClick ? ' card-clickable' : ''}`}
      onClick={onClick}
      style={{ color }}
      title={`${card.rank}${symbol}`}
    >
      <span className="card-rank-top">{card.rank}</span>
      <span className="card-suit">{symbol}</span>
      <span className="card-rank-bottom">{card.rank}</span>
    </div>
  );
};
