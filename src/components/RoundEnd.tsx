import React from 'react';
import type { GameState } from '../types';

interface RoundEndProps {
  gameState: GameState;
  myPublicId: string;
  onNextRound: () => void;
}

export const RoundEnd: React.FC<RoundEndProps> = ({ gameState, onNextRound }) => {
  const roundWinner = gameState.teams[0].roundScore > gameState.teams[1].roundScore ? 0 : 1;

  return (
    <div className="round-end">
      <h2>Fim da Rodada {gameState.round}</h2>

      <div className="round-scores">
        {gameState.teams.map((t) => (
          <div key={t.id} className={`round-team-score${t.id === roundWinner ? ' winner' : ''}`}>
            <h3>
              {gameState.teamNames?.[t.id] ?? (t.id === 0 ? 'Time A' : 'Time B')} {t.id === roundWinner ? '🏆' : ''}
            </h3>
            <div className="round-score-detail">
              <span>Pontos da rodada:</span>
              <strong className={t.roundScore >= 0 ? 'positive' : 'negative'}>
                {t.roundScore >= 0 ? '+' : ''}
                {t.roundScore}
              </strong>
            </div>
            <div className="round-score-detail">
              <span>Placar total:</span>
              <strong>{t.score}</strong>
            </div>
            {t.inHole && <span className="in-hole-badge">🕳 No Buraco</span>}
          </div>
        ))}
      </div>

      {gameState.phase !== 'gameOver' && (
        <button className="btn btn-primary" onClick={onNextRound}>
          ▶ Próxima Rodada
        </button>
      )}
    </div>
  );
};

export const GameOver: React.FC<{ gameState: GameState; myPublicId: string }> = ({ gameState, myPublicId }) => {
  const me = gameState.players.find((p) => p.publicId === myPublicId);
  const won = me?.teamId === gameState.winner;
  const winnerTeam = gameState.winner !== undefined ? gameState.teams[gameState.winner] : null;

  return (
    <div className="game-over">
      <div className="game-over-title">{won ? '🎉 Você Ganhou!' : '😞 Você Perdeu!'}</div>
      <h2>Fim de Jogo!</h2>
      <p>
        {gameState.winner !== undefined ? (gameState.teamNames?.[gameState.winner] ?? (gameState.winner === 0 ? 'Time A' : 'Time B')) : ''} venceu com {winnerTeam?.score} pontos!
      </p>

      <div className="final-scores">
        {gameState.teams.map((t) => (
          <div key={t.id} className={`final-team${t.id === gameState.winner ? ' winner' : ''}`}>
            <h3>
              {gameState.teamNames?.[t.id] ?? (t.id === 0 ? 'Time A' : 'Time B')} {t.id === gameState.winner ? '🏆' : ''}
            </h3>
            <strong>{t.score} pts</strong>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        🔄 Novo Jogo
      </button>
    </div>
  );
};
