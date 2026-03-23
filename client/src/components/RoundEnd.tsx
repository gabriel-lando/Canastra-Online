import React, { useState } from 'react';
import type { GameState, RoundSummary } from '../types';
import { useTranslation } from '../i18n';

interface RoundEndProps {
  gameState: GameState;
  myPublicId: string;
  onNextRound: () => void;
}

function cardLabel(card: string): string {
  // Cards in roundSummary are formatted as rank + suit initial, e.g. "2H", "10C", "AS", "QD"
  const suitEmojis: Record<string, string> = { H: '♥', D: '♦', C: '♣', S: '♠' };
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return `${rank}${suitEmojis[suit] ?? suit}`;
}

interface SummaryDetailsProps {
  summary: RoundSummary;
}

const SummaryDetails: React.FC<SummaryDetailsProps> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="round-summary-details">
      {summary.teams.map((team) => {
        const teamWon = team.name === summary.winner;
        return (
          <div key={team.name} className="round-summary-team">
            <h4 className="round-summary-team-name">{team.name}</h4>
            {team.melds.length > 0 && (
              <div className="round-summary-section">
                <span className="round-summary-label">{t.roundEnd.melds}:</span>
                <ul className="round-summary-list">
                  {team.melds.map((meld, i) => (
                    <li key={i} className="round-summary-meld">
                      <span className="round-summary-meld-cards">{meld.cards.map(cardLabel).join(' ')}</span>
                      <span className="round-summary-meld-pts">
                        +{meld.points} {t.roundEnd.pts}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {team.players.map((player) => (
              <div key={player.name} className="round-summary-player">
                <span className="round-summary-player-name">{player.name}</span>
                {player.hand.length > 0 ? (
                  <span className="round-summary-player-hand">
                    {player.hand.map(cardLabel).join(' ')} →{' '}
                    <span className="negative">
                      {player.handPenalty} {t.roundEnd.pts}
                    </span>
                  </span>
                ) : (
                  <span className="round-summary-player-went-out">
                    {t.roundEnd.wentOut}
                    {teamWon && (
                      <span className="round-summary-meld-pts">
                        {' '}
                        (+50 {t.roundEnd.pts} {t.roundEnd.goOutBonus})
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const RoundEnd: React.FC<RoundEndProps> = ({ gameState, myPublicId, onNextRound }) => {
  const { t, interpolate } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const roundWinner = gameState.teams[0].roundScore > gameState.teams[1].roundScore ? 0 : 1;
  const isLeader = myPublicId === gameState.leaderId;

  return (
    <div className="round-end">
      <h2>{interpolate(t.roundEnd.title, { round: gameState.round })}</h2>

      <div className="round-scores">
        {gameState.teams.map((team) => (
          <div key={team.id} className={`round-team-score${team.id === roundWinner ? ' winner' : ''}`}>
            <h3>
              {gameState.teamNames?.[team.id] ?? (team.id === 0 ? t.roundEnd.defaultTeamA : t.roundEnd.defaultTeamB)} {team.id === roundWinner ? '🏆' : ''}
            </h3>
            <div className="round-score-detail">
              <span>{t.roundEnd.roundPoints}</span>
              <strong className={team.roundScore >= 0 ? 'positive' : 'negative'}>
                {team.roundScore >= 0 ? '+' : ''}
                {team.roundScore}
              </strong>
            </div>
            <div className="round-score-detail">
              <span>{t.roundEnd.totalScore}</span>
              <strong>{team.score}</strong>
            </div>
            {team.inHole && <span className="in-hole-badge">{t.roundEnd.inHole}</span>}
          </div>
        ))}
      </div>

      {gameState.roundSummary && (
        <div className="round-summary-expander">
          <button className="btn btn-secondary btn-sm round-summary-toggle" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? t.roundEnd.hideDetails : t.roundEnd.showDetails}
          </button>
          {showDetails && <SummaryDetails summary={gameState.roundSummary} />}
        </div>
      )}

      {gameState.phase !== 'gameOver' &&
        (isLeader ? (
          <button className="btn btn-primary" onClick={onNextRound}>
            {t.roundEnd.nextRound}
          </button>
        ) : (
          <p className="round-waiting-message">{t.roundEnd.waitingForLeader}</p>
        ))}
    </div>
  );
};

export const GameOver: React.FC<{ gameState: GameState; myPublicId: string }> = ({ gameState, myPublicId }) => {
  const { t, interpolate } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const me = gameState.players.find((p) => p.publicId === myPublicId);
  const won = me?.teamId === gameState.winner;
  const winnerTeam = gameState.winner !== undefined ? gameState.teams[gameState.winner] : null;

  return (
    <div className="game-over">
      <div className="game-over-title">{won ? t.roundEnd.gameWon : t.roundEnd.gameLost}</div>
      <h2>{t.roundEnd.gameOver}</h2>
      <p>
        {gameState.winner !== undefined
          ? interpolate(t.roundEnd.winnerMsg, {
              team: gameState.teamNames?.[gameState.winner] ?? (gameState.winner === 0 ? t.roundEnd.defaultTeamA : t.roundEnd.defaultTeamB),
              score: winnerTeam?.score ?? 0,
            })
          : ''}
      </p>

      <div className="final-scores">
        {gameState.teams.map((team) => (
          <div key={team.id} className={`final-team${team.id === gameState.winner ? ' winner' : ''}`}>
            <h3>
              {gameState.teamNames?.[team.id] ?? (team.id === 0 ? t.roundEnd.defaultTeamA : t.roundEnd.defaultTeamB)} {team.id === gameState.winner ? '🏆' : ''}
            </h3>
            <strong>
              {team.score} {t.roundEnd.pts}
            </strong>
          </div>
        ))}
      </div>

      {gameState.roundSummary && (
        <div className="round-summary-expander">
          <button className="btn btn-secondary btn-sm round-summary-toggle" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? t.roundEnd.hideDetails : t.roundEnd.showDetails}
          </button>
          {showDetails && <SummaryDetails summary={gameState.roundSummary} />}
        </div>
      )}

      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        {t.roundEnd.newGame}
      </button>
    </div>
  );
};
