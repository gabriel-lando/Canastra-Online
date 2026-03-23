import React, { useState, useEffect, useCallback } from 'react';

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
  const [view, setView] = useState<'main' | 'create' | 'joinCode'>('main');
  const [codeInput, setCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

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
        onJoinRoom(data.code);
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
      setCodeError('Código muito curto');
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
          <p className="room-select-greeting">
            Olá, <strong>{playerName}</strong>! Escolha uma sala:
          </p>
        </div>

        {/* ── Main view ── */}
        {view === 'main' && (
          <div className="room-select-main">
            <div className="room-actions">
              <button className="btn btn-primary btn-room-action" onClick={() => setView('create')} disabled={busy}>
                🆕 Criar Sala
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
                🔑 Entrar com Código
              </button>
            </div>

            <div className="public-rooms-section">
              <div className="public-rooms-header">
                <h3>Salas Públicas</h3>
                <button className="btn btn-ghost" onClick={fetchPublicRooms} disabled={loadingRooms || busy}>
                  {loadingRooms ? '…' : '↻ Atualizar'}
                </button>
              </div>
              {loadingRooms ? (
                <div className="rooms-placeholder">Carregando salas...</div>
              ) : publicRooms.length === 0 ? (
                <div className="rooms-placeholder">Nenhuma sala pública disponível</div>
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
              ← Voltar
            </button>
          </div>
        )}

        {/* ── Create room ── */}
        {view === 'create' && !createdCode && (
          <div className="room-select-sub">
            <h2>Criar Sala</h2>
            <p className="room-select-hint">Escolha a visibilidade:</p>
            <button className="btn btn-outline btn-room-action" onClick={() => handleCreate(false)} disabled={busy}>
              <span className="btn-room-label">🔒 Privada</span>
              <span className="btn-room-sub">Acessível apenas com código</span>
            </button>
            <button className="btn btn-outline btn-room-action" onClick={() => handleCreate(true)} disabled={busy}>
              <span className="btn-room-label">🌐 Pública</span>
              <span className="btn-room-sub">Aparece na lista de salas públicas</span>
            </button>
            {creating && <p className="room-select-hint">Criando sala...</p>}
            <button className="btn btn-ghost room-back-btn" onClick={() => setView('main')} disabled={busy}>
              ← Voltar
            </button>
          </div>
        )}

        {/* ── Created room — waiting for others ── */}
        {view === 'create' && createdCode && (
          <div className="room-select-sub created-room">
            <h2>✅ Sala Criada!</h2>
            <p className="room-select-hint">Compartilhe este código com os outros jogadores:</p>
            <div className="created-code-box">
              <code className="created-code">{createdCode}</code>
              <button className="btn btn-ghost" onClick={() => copyCode(createdCode)}>
                {copied ? '✅ Copiado!' : '📋 Copiar'}
              </button>
            </div>
            <p className="room-select-hint connecting-hint">{connecting ? '⏳ Aguardando na sala...' : '✅ Conectado!'}</p>
          </div>
        )}

        {/* ── Join by code ── */}
        {view === 'joinCode' && (
          <div className="room-select-sub">
            <h2>Entrar com Código</h2>
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
                placeholder="Ex: ABC123"
                maxLength={8}
                autoFocus
                disabled={busy}
              />
              {codeError && <span className="code-error">{codeError}</span>}
              <button className="btn btn-primary" onClick={handleJoinByCode} disabled={busy || codeInput.trim().length < 4}>
                {connecting ? '⏳ Conectando...' : 'Entrar'}
              </button>
            </div>
            <button className="btn btn-ghost room-back-btn" onClick={() => setView('main')} disabled={busy}>
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
