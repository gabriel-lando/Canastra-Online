import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';

interface PublicRoom {
  code: string;
  playerCount: number;
  players: string[];
}

interface RoomSelectProps {
  playerName: string;
  onJoinRoom: (code: string) => void;
  connecting: boolean;
  onBack: () => void;
}

export const RoomSelect: React.FC<RoomSelectProps> = ({ playerName, onJoinRoom, connecting, onBack }) => {
  const { t, interpolate } = useTranslation();
  const [view, setView] = useState<'main' | 'create' | 'joinCode'>('main');
  const [codeInput, setCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  const fetchPublicRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = (await res.json()) as { rooms: PublicRoom[] };
      setPublicRooms(data.rooms ?? []);
    } catch {
      setPublicRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicRooms();
  }, [fetchPublicRooms]);

  useEffect(() => {
    if (countdown === null || pendingJoinCode === null) return;
    if (countdown <= 0) {
      onJoinRoom(pendingJoinCode);
      setCountdown(null);
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown, pendingJoinCode, onJoinRoom]);

  const handleCreate = async (isPublic: boolean) => {
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });
      const data = (await res.json()) as { code?: string };
      if (data.code) {
        setCreatedCode(data.code);
        setPendingJoinCode(data.code);
        setCountdown(5);
      }
    } catch {
      // error propagates via socket error message
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length < 4) {
      setCodeError(t.roomSelect.codeTooShort);
      return;
    }
    setCodeError('');
    onJoinRoom(code);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const busy = connecting || creating;

  return (
    <div className="room-select">
      <div className="room-select-card">
        <div className="room-select-header">
          <h1>Canastra Online</h1>
          <p className="room-select-greeting">{interpolate(t.roomSelect.greeting, { playerName })}</p>
        </div>

        {/* ── Main view ── */}
        {view === 'main' && (
          <div className="room-select-main">
            <div className="room-actions">
              <button className="btn btn-primary btn-room-action" onClick={() => setView('create')} disabled={busy}>
                {t.roomSelect.createRoom}
              </button>
              <button
                className="btn btn-secondary btn-room-action"
                onClick={() => {
                  setView('joinCode');
                  setCodeInput('');
                  setCodeError('');
                }}
                disabled={busy}
              >
                {t.roomSelect.joinWithCode}
              </button>
            </div>

            <div className="public-rooms-section">
              <div className="public-rooms-header">
                <h3>{t.roomSelect.publicRooms}</h3>
                <button className="btn btn-ghost" onClick={fetchPublicRooms} disabled={loadingRooms || busy}>
                  {loadingRooms ? '…' : t.roomSelect.refresh}
                </button>
              </div>
              {loadingRooms ? (
                <div className="rooms-placeholder">{t.roomSelect.loadingRooms}</div>
              ) : publicRooms.length === 0 ? (
                <div className="rooms-placeholder">{t.roomSelect.noPublicRooms}</div>
              ) : (
                <div className="rooms-list">
                  {publicRooms.map((room) => (
                    <button key={room.code} className="room-list-item" onClick={() => !busy && onJoinRoom(room.code)} disabled={busy}>
                      <div className="room-list-left">
                        <code className="room-list-code">{room.code}</code>
                        <span className="room-list-names">{room.players.join(', ') || '—'}</span>
                      </div>
                      <span className="room-list-count">{room.playerCount}/4</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-ghost room-back-btn" onClick={onBack}>
              {t.roomSelect.back}
            </button>
          </div>
        )}

        {/* ── Create room ── */}
        {view === 'create' && !createdCode && (
          <div className="room-select-sub">
            <h2>{t.roomSelect.createTitle}</h2>
            <p className="room-select-hint">{t.roomSelect.chooseVisibility}</p>
            <button className="btn btn-outline btn-room-action" onClick={() => handleCreate(false)} disabled={busy}>
              <span className="btn-room-label">{t.roomSelect.privateRoom}</span>
              <span className="btn-room-sub">{t.roomSelect.privateRoomDesc}</span>
            </button>
            <button className="btn btn-outline btn-room-action" onClick={() => handleCreate(true)} disabled={busy}>
              <span className="btn-room-label">{t.roomSelect.publicRoom}</span>
              <span className="btn-room-sub">{t.roomSelect.publicRoomDesc}</span>
            </button>
            {creating && <p className="room-select-hint">{t.roomSelect.creating}</p>}
            <button className="btn btn-ghost room-back-btn" onClick={() => setView('main')} disabled={busy}>
              {t.roomSelect.back}
            </button>
          </div>
        )}

        {/* ── Created room — waiting for others ── */}
        {view === 'create' && createdCode && (
          <div className="room-select-sub created-room">
            <h2>{t.roomSelect.roomCreated}</h2>
            <p className="room-select-hint">{t.roomSelect.shareCode}</p>
            <div className="created-code-box">
              <code className="created-code">{createdCode}</code>
              <button className="btn btn-ghost" onClick={() => copyCode(createdCode)}>
                {copied ? t.roomSelect.copied : t.roomSelect.copy}
              </button>
            </div>
            {countdown !== null ? (
              <>
                <p className="room-select-hint connecting-hint room-countdown">{interpolate(t.roomSelect.joiningIn, { seconds: String(countdown) })}</p>
                <button
                  className="btn btn-primary btn-room-action"
                  onClick={() => {
                    setCountdown(0);
                  }}
                >
                  {t.roomSelect.joinNow}
                </button>
              </>
            ) : (
              <p className="room-select-hint connecting-hint">{connecting ? t.roomSelect.waitingInRoom : t.roomSelect.connected}</p>
            )}
          </div>
        )}

        {/* ── Join by code ── */}
        {view === 'joinCode' && (
          <div className="room-select-sub">
            <h2>{t.roomSelect.joinTitle}</h2>
            <div className="code-input-group">
              <input
                type="text"
                className="code-input"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                placeholder={t.roomSelect.codePlaceholder}
                maxLength={8}
                autoFocus
                disabled={busy}
              />
              {codeError && <span className="code-error">{codeError}</span>}
              <button className="btn btn-primary" onClick={handleJoinByCode} disabled={busy || codeInput.trim().length < 4}>
                {connecting ? t.roomSelect.connecting : t.roomSelect.join}
              </button>
            </div>
            <button className="btn btn-ghost room-back-btn" onClick={() => setView('main')} disabled={busy}>
              {t.roomSelect.back}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
