import React, { useState } from 'react';
import type { GameState, Player } from '../types';
import { useTranslation } from '../i18n';

interface LobbyProps {
  gameState: GameState;
  myPublicId: string;
  myName: string;
  roomCode: string;
  onReady: () => void;
  onUnready: () => void;
  onSelectTeam: (teamId: 0 | 1) => void;
  onMovePlayer: (targetPublicId: string, teamId: 0 | 1) => void;
  onKickPlayer: (targetPublicId: string) => void;
  onRenameTeam: (teamId: 0 | 1, name: string) => void;
  onSwapTeamOrder: (publicIdA: string, publicIdB: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ gameState, myPublicId, roomCode, onReady, onUnready, onSelectTeam, onMovePlayer, onKickPlayer, onRenameTeam, onSwapTeamOrder }) => {
  const { t, interpolate } = useTranslation();
  const me = gameState.players.find((p) => p.publicId === myPublicId);
  const isReady = me?.status === 'ready';
  const isLeader = gameState.leaderId === myPublicId;

  // Sort by seatIndex so displayed order matches turn order
  const team0 = gameState.players.filter((p) => p.teamId === 0).sort((a, b) => a.seatIndex - b.seatIndex);
  const team1 = gameState.players.filter((p) => p.teamId === 1).sort((a, b) => a.seatIndex - b.seatIndex);

  const readyCount = gameState.players.filter((p) => p.status === 'ready').length;
  const canStart = readyCount === 4 && team0.length === 2 && team1.length === 2;

  const [dragOverTeam, setDragOverTeam] = useState<0 | 1 | null>(null);
  const teamNames = gameState.teamNames ?? [t.lobby.defaultTeamA, t.lobby.defaultTeamB];

  const handleDragStart = (e: React.DragEvent, publicId: string, fromTeam: 0 | 1) => {
    e.dataTransfer.setData('publicId', publicId);
    e.dataTransfer.setData('fromTeam', String(fromTeam));
  };

  // Drop on the team panel background → move to that team (only if from a different team)
  const handleTeamPanelDrop = (e: React.DragEvent, targetTeamId: 0 | 1) => {
    e.preventDefault();
    setDragOverTeam(null);
    const fromTeam = Number(e.dataTransfer.getData('fromTeam')) as 0 | 1;
    const draggedPublicId = e.dataTransfer.getData('publicId');
    if (!draggedPublicId) return;
    if (fromTeam !== targetTeamId) {
      onMovePlayer(draggedPublicId, targetTeamId);
    }
  };

  // Drop on a specific player slot → swap (same team) or move (different team)
  const handleSlotDrop = (e: React.DragEvent, slotPublicId: string, slotTeamId: 0 | 1) => {
    e.preventDefault();
    e.stopPropagation(); // prevent bubbling to team panel
    const fromTeam = Number(e.dataTransfer.getData('fromTeam')) as 0 | 1;
    const draggedPublicId = e.dataTransfer.getData('publicId');
    if (!draggedPublicId || draggedPublicId === slotPublicId) return;
    if (fromTeam === slotTeamId) {
      onSwapTeamOrder(draggedPublicId, slotPublicId);
    } else {
      onMovePlayer(draggedPublicId, slotTeamId);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>Canastra Online</h1>
        <p className="lobby-subtitle">{interpolate(t.lobby.waiting, { count: gameState.players.length })}</p>
        <div className="lobby-room-code">
          <span>{t.lobby.roomCode}</span>
          <code>{roomCode}</code>
          <button className="btn btn-ghost" style={{ padding: '0.1rem 0.4rem', fontSize: '0.8rem' }} onClick={() => navigator.clipboard.writeText(roomCode).catch(() => {})}>
            📋
          </button>
        </div>
        {isLeader && <span className="leader-badge">{t.lobby.youAreLeader}</span>}
      </div>

      <div className="teams-grid">
        <TeamPanel
          teamId={0}
          teamName={teamNames[0]}
          players={team0}
          myPublicId={myPublicId}
          isLeader={isLeader}
          canJoin={team0.length < 2 && me?.teamId !== 0}
          isDragOver={dragOverTeam === 0}
          onJoin={() => onSelectTeam(0)}
          onDragStart={(e, publicId) => handleDragStart(e, publicId, 0)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTeam(0);
          }}
          onDragLeave={() => setDragOverTeam(null)}
          onDrop={(e) => handleTeamPanelDrop(e, 0)}
          onDropSlot={(e, slotPublicId) => handleSlotDrop(e, slotPublicId, 0)}
          onKick={onKickPlayer}
          onRenameTeam={(name) => onRenameTeam(0, name)}
        />
        <div className="teams-vs">{t.lobby.vs}</div>
        <TeamPanel
          teamId={1}
          teamName={teamNames[1]}
          players={team1}
          myPublicId={myPublicId}
          isLeader={isLeader}
          canJoin={team1.length < 2 && me?.teamId !== 1}
          isDragOver={dragOverTeam === 1}
          onJoin={() => onSelectTeam(1)}
          onDragStart={(e, publicId) => handleDragStart(e, publicId, 1)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTeam(1);
          }}
          onDragLeave={() => setDragOverTeam(null)}
          onDrop={(e) => handleTeamPanelDrop(e, 1)}
          onDropSlot={(e, slotPublicId) => handleSlotDrop(e, slotPublicId, 1)}
          onKick={onKickPlayer}
          onRenameTeam={(name) => onRenameTeam(1, name)}
        />
      </div>

      {isLeader && <p className="leader-hint">{t.lobby.leaderHint}</p>}

      <div className="lobby-actions">
        {!isReady ? (
          <button className="btn btn-primary" onClick={onReady} disabled={!me}>
            {t.lobby.ready}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={onUnready}>
            {t.lobby.cancelReady}
          </button>
        )}
      </div>

      {canStart && <div className="lobby-starting">{t.lobby.allReady}</div>}

      <div className="lobby-players-status">
        <h3>{t.lobby.playersStatus}</h3>
        {gameState.players.map((p) => (
          <div key={p.publicId} className={`player-status-row${p.publicId === myPublicId ? ' is-me' : ''}`}>
            <span className="player-name">
              {p.name} {p.publicId === myPublicId ? t.lobby.you : ''}
              {gameState.leaderId === p.publicId && ' 👑'}
            </span>
            <span className={`status-badge status-${p.status}`}>{p.status === 'ready' ? t.lobby.readyStatus : t.lobby.waitingStatus}</span>
            <span className={`team-badge team-${p.teamId}`}>{teamNames[p.teamId]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TeamPanelProps {
  teamId: 0 | 1;
  teamName: string;
  players: Player[];
  myPublicId: string;
  isLeader: boolean;
  canJoin: boolean;
  isDragOver: boolean;
  onJoin: () => void;
  onDragStart: (e: React.DragEvent, publicId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDropSlot: (e: React.DragEvent, slotPublicId: string) => void;
  onKick: (publicId: string) => void;
  onRenameTeam: (name: string) => void;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ teamId, teamName, players, myPublicId, isLeader, canJoin, isDragOver, onJoin, onDragStart, onDragOver, onDragLeave, onDrop, onDropSlot, onKick, onRenameTeam }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(teamName);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Keep draft in sync when team name changes from server (another client renamed)
  React.useEffect(() => {
    if (!editing) setDraft(teamName);
  }, [teamName, editing]);

  const commitRename = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== teamName) onRenameTeam(trimmed);
    else setDraft(teamName);
  };

  return (
    <div className={`team-panel team-panel-${teamId}${isDragOver ? ' team-panel-drag-over' : ''}`} onDragOver={isLeader ? onDragOver : undefined} onDragLeave={isLeader ? onDragLeave : undefined} onDrop={isLeader ? onDrop : undefined}>
      {editing ? (
        <input
          className="team-name-input"
          value={draft}
          maxLength={20}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setEditing(false);
              setDraft(teamName);
            }
          }}
        />
      ) : (
        <h2
          className={isLeader ? 'team-name-editable' : ''}
          title={isLeader ? t.lobby.clickToRename : undefined}
          onClick={
            isLeader
              ? () => {
                  setDraft(teamName);
                  setEditing(true);
                }
              : undefined
          }
        >
          {teamName}
          {isLeader && <span className="team-name-edit-icon">✏️</span>}
        </h2>
      )}
      <div className="team-slots">
        {players.map((p, idx) => (
          <div
            key={p.publicId}
            className={`team-slot filled${p.publicId === myPublicId ? ' is-me' : ''}${isLeader ? ' leader-draggable' : ''}${dragOverSlot === p.publicId ? ' slot-drag-over' : ''}`}
            draggable={isLeader}
            onDragStart={isLeader ? (e) => onDragStart(e, p.publicId) : undefined}
            onDragOver={
              isLeader
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSlot(p.publicId);
                  }
                : undefined
            }
            onDragLeave={isLeader ? () => setDragOverSlot(null) : undefined}
            onDrop={
              isLeader
                ? (e) => {
                    setDragOverSlot(null);
                    onDropSlot(e, p.publicId);
                  }
                : undefined
            }
          >
            <span className="slot-order">{idx + 1}.</span>
            <span className="slot-name">{p.name}</span>
            <div className="slot-right">
              <span className={`slot-connected${p.connected ? '' : ' offline'}`}>{p.connected ? '🟢' : '🔴'}</span>
              {isLeader && p.publicId !== myPublicId && (
                <button className="btn-kick" title={t.lobby.kickPlayer} onClick={() => onKick(p.publicId)}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        {Array.from({ length: 2 - players.length }).map((_, i) => (
          <div key={i} className="team-slot empty">
            <span>{t.lobby.emptySlot}</span>
          </div>
        ))}
      </div>
      {canJoin && (
        <button className="btn btn-outline" onClick={onJoin}>
          {t.lobby.joinTeam}
        </button>
      )}
    </div>
  );
};
