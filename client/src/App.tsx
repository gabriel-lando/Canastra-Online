import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { socket } from './socket';
import type { Card, ClientMessage, GameState, ServerMessage } from './types';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { RoundEnd, GameOver } from './components/RoundEnd';
import { RoomSelect } from './components/RoomSelect';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from './i18n';

type AppPhase = 'nameEntry' | 'roomSelect' | 'game';

function App() {
  const { t, interpolate } = useTranslation();
  const [appPhase, setAppPhase] = useState<AppPhase>('nameEntry');
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const [pauseCountdown, setPauseCountdown] = useState<string | null>(null);

  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMsg(null), 4000);
  }, []);

  useEffect(() => {
    const unsub = socket.on((msg: ServerMessage) => {
      if (msg.type === 'welcome') {
        setPlayerId(msg.playerId);
        setPublicId(msg.publicId);
        setGameState(msg.gameState);
        setHand(msg.hand);
        setAppPhase('game');
        setConnecting(false);
      } else if (msg.type === 'gameState') {
        setGameState(msg.gameState);
        setHand(msg.hand);
        // Log round summary to browser console when a round ends
        if ((msg.gameState.phase === 'roundEnd' || msg.gameState.phase === 'gameOver') && msg.gameState.roundSummary) {
          const s = msg.gameState.roundSummary;
          console.group(`%c═══ Rodada ${s.round} encerrada — saída: ${s.winner} ═══`, 'font-weight:bold;color:#d4af37');
          for (const team of s.teams) {
            console.group(`%c${team.name}  (rodada: ${team.roundScore >= 0 ? '+' : ''}${team.roundScore} pts | total: ${team.totalScore} pts)`, 'color:#90cdf4');
            for (const meld of team.melds) {
              console.log(`  [${meld.type}] ${meld.cards.join(' ')}  → ${meld.points} pts`);
            }
            for (const p of team.players) {
              if (p.hand.length === 0) {
                console.log(`  ${p.name}: saiu sem cartas`);
              } else {
                console.log(`  ${p.name}: [${p.hand.join(' ')}]  → ${p.handPenalty} pts`);
              }
            }
            console.groupEnd();
          }
          console.log('%cJSON completo:', 'color:#888', s);
          console.groupEnd();
        }
      } else if (msg.type === 'kicked') {
        // Server kicked us — save reason, clear session, go back to name entry
        const reason = msg.reason;
        socket.clearSession();
        socket.disconnect();
        setAppPhase('nameEntry');
        setGameState(null);
        setHand([]);
        setPlayerId(null);
        setPublicId(null);
        setConnecting(false);
        setKickedReason(reason);
        showError(reason);
      } else if (msg.type === 'error') {
        if (msg.message.startsWith('validation.')) {
          const subkey = msg.message.slice('validation.'.length) as keyof typeof t.validation;
          showError(t.validation[subkey] ?? msg.message);
        } else {
          showError(msg.message);
        }
        setConnecting(false);
      }
    });
    return () => {
      unsub();
      socket.disconnect();
    };
  }, [showError]);

  // Countdown timer for the paused-game reconnect deadline
  useEffect(() => {
    const deadlines = gameState?.disconnectDeadlines;
    if (!deadlines || Object.keys(deadlines).length === 0) {
      setPauseCountdown(null);
      return;
    }
    const minDeadline = Math.min(...Object.values(deadlines));
    const tick = () => {
      const remaining = Math.max(0, minDeadline - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setPauseCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameState?.disconnectDeadlines]);

  const handleJoin = () => {
    const name = nameInput.trim();
    if (name.length < 2 || name.length > 20) {
      setNameError(t.nameEntry.error);
      return;
    }
    setNameError('');
    setPlayerName(name);
    setAppPhase('roomSelect');
  };

  const handleJoinRoom = useCallback(
    (code: string) => {
      setRoomCode(code);
      setConnecting(true);
      socket.connect(code, playerName);
    },
    [playerName],
  );

  const send = useCallback((msg: ClientMessage) => socket.send(msg), []);

  if (appPhase === 'nameEntry') {
    return (
      <div className="name-entry">
        <LanguageSwitcher />
        {kickedReason && (
          <div className="kicked-notification" onClick={() => setKickedReason(null)}>
            <strong>{t.paused.cancelledTitle}</strong>
            <span>{kickedReason}</span>
            <span className="kicked-dismiss">✕</span>
          </div>
        )}
        <div className="name-entry-card">
          <h1>Canastra Online</h1>
          <p>{t.nameEntry.subtitle}</p>
          <div className="name-form">
            <label htmlFor="name-input">{t.nameEntry.label}</label>
            <input
              id="name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={t.nameEntry.placeholder}
              maxLength={20}
              disabled={connecting}
              autoFocus
            />
            {nameError && <span className="name-error">{nameError}</span>}
            <button className="btn btn-primary" onClick={handleJoin} disabled={nameInput.trim().length < 2}>
              {t.nameEntry.next}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appPhase === 'roomSelect') {
    return (
      <div className="app">
        <LanguageSwitcher />
        {errorMsg && (
          <div className="global-error" onClick={() => setErrorMsg(null)}>
            ⚠️ {errorMsg}
          </div>
        )}
        <RoomSelect
          playerName={playerName}
          onJoinRoom={handleJoinRoom}
          connecting={connecting}
          onBack={() => {
            setAppPhase('nameEntry');
            setConnecting(false);
            socket.clearSession();
            socket.disconnect();
          }}
        />
      </div>
    );
  }

  if (!gameState || !publicId) return <div className="loading">{t.loading}</div>;

  const handleNextRound = async () => {
    await fetch(`/api/rooms/${roomCode}/next-round`, { method: 'POST' });
  };

  return (
    <div className="app">
      <LanguageSwitcher />
      {errorMsg && (
        <div className="global-error" onClick={() => setErrorMsg(null)}>
          ⚠️ {errorMsg}
        </div>
      )}

      {gameState.phase === 'lobby' && (
        <Lobby
          gameState={gameState}
          myPublicId={publicId}
          myName={playerName}
          roomCode={roomCode}
          onReady={() => send({ type: 'ready' })}
          onUnready={() => send({ type: 'unready' })}
          onSelectTeam={(teamId) => send({ type: 'selectTeam', teamId })}
          onMovePlayer={(targetPublicId, teamId) => send({ type: 'movePlayer', targetPublicId, teamId })}
          onKickPlayer={(targetPublicId) => send({ type: 'kickPlayer', targetPublicId })}
          onRenameTeam={(teamId, name) => send({ type: 'renameTeam', teamId, name })}
          onSwapTeamOrder={(publicIdA, publicIdB) => send({ type: 'swapTeamOrder', publicIdA, publicIdB })}
        />
      )}

      {(gameState.phase === 'playing' || gameState.phase === 'paused') && (
        <>
          {gameState.phase === 'paused' && (
            <div className="paused-overlay">
              <div className="paused-box">
                <h2>{t.paused.title}</h2>
                <p>{t.paused.message}</p>
                <div className="paused-players">
                  {gameState.players
                    .filter((p) => !p.connected)
                    .map((p) => (
                      <span key={p.publicId} className="paused-player-name">
                        ⚠️ {p.name}
                      </span>
                    ))}
                </div>
                {pauseCountdown && <p className="paused-countdown">{interpolate(t.paused.countdown, { time: pauseCountdown })}</p>}
                <p className="paused-hint">
                  {t.paused.roomCode} <code>{roomCode}</code>
                </p>
              </div>
            </div>
          )}
          <GameBoard
            gameState={gameState}
            hand={hand}
            myPublicId={publicId}
            myPlayerId={playerId!}
            onDrawFromStock={() => send({ type: 'drawFromStock' })}
            onTakeDiscard={() => send({ type: 'takeDiscard' })}
            onLayDown={(cardIds) => send({ type: 'layDown', cardIds })}
            onAddToMeld={(meldId, cardIds) => send({ type: 'addToMeld', meldId, cardIds })}
            onDiscard={(cardId) => send({ type: 'discard', cardId })}
            onGoOut={(discardCardId) => send({ type: 'goOut', discardCardId })}
            errorMsg={errorMsg}
          />
        </>
      )}

      {gameState.phase === 'roundEnd' && <RoundEnd gameState={gameState} myPublicId={publicId} onNextRound={handleNextRound} />}

      {gameState.phase === 'gameOver' && <GameOver gameState={gameState} myPublicId={publicId} />}
    </div>
  );
}

export default App;
