import React from 'react';
import type { GameState } from '../types';
import { useTranslation } from '../i18n';

interface RoundEndProps {
  gameState: GameState;
  myPublicId: string;
  onNextRound: () => void;
}

export const RoundEnd: React.FC<RoundEndProps> = ({ gameState, onNextRound }) => {
  const { t, interpolate } = useTranslation();
  const roundWinner = gameState.teams[0].roundScore > gameState.teams[1].roundScore ? 0 : 1;

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

      {gameState.phase !== 'gameOver' && (
        <button className="btn btn-primary" onClick={onNextRound}>
          {t.roundEnd.nextRound}
        </button>
      )}
    </div>
  );
};

export const GameOver: React.FC<{ gameState: GameState; myPublicId: string }> = ({ gameState, myPublicId }) => {
  const { t, interpolate } = useTranslation();
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

      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        {t.roundEnd.newGame}
      </button>
    </div>
  );
};
