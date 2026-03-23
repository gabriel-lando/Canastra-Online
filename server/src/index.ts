import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Game } from './game.js';
import type { ClientMessage, ServerMessage } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const server = http.createServer(app);

// ─── Room management ─────────────────────────────────────────────────────────
interface ReconnectEntry {
  playerId: string; // the original UUID
  publicId: string;
  name: string;
  teamId: 0 | 1;
}

interface Room {
  game: Game;
  code: string;
  isPublic: boolean;
  leaderId: string; // publicId of the room creator
  connections: Map<string, WebSocket>; // playerId → ws
  publicToPrivate: Map<string, string>; // publicId → playerId
  reconnectTokens: Map<string, ReconnectEntry>; // token → entry
  teamNames: [string, string];
  createdAt: number;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>; // playerId → timer
  disconnectDeadlines: Map<string, number>; // playerId → deadline timestamp (ms)
}

const rooms = new Map<string, Room>();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return rooms.has(code) ? generateCode() : code;
}

function createRoom(isPublic: boolean): Room {
  const code = generateCode();
  const room: Room = {
    game: new Game(uuidv4()),
    code,
    isPublic,
    leaderId: '',
    teamNames: ['Time A', 'Time B'],
    connections: new Map(),
    publicToPrivate: new Map(),
    reconnectTokens: new Map(),
    disconnectTimers: new Map(),
    disconnectDeadlines: new Map(),
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

/** Kick all remaining players and remove the room. */
function dissolveRoom(room: Room, reason: string) {
  for (const ws of room.connections.values()) {
    send(ws, { type: 'kicked', reason });
  }
  for (const timer of room.disconnectTimers.values()) clearTimeout(timer);
  room.disconnectTimers.clear();
  room.disconnectDeadlines.clear();
  rooms.delete(room.code);
}

// Cleanup empty rooms older than 4 h
setInterval(
  () => {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000;
    for (const [code, room] of rooms) {
      if (room.connections.size === 0 && room.createdAt < cutoff) rooms.delete(code);
    }
  },
  30 * 60 * 1000,
);

// ─── WebSocket ────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const reqUrl = new URL(req.url!, 'http://localhost');
  if (reqUrl.pathname === '/api/ws') {
    const code = reqUrl.searchParams.get('room')?.toUpperCase();
    if (!code || !rooms.has(code)) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  // Retrieve the room from the request URL (already validated in upgrade handler)
  const reqUrl = new URL(req.url!, 'http://localhost');
  const code = reqUrl.searchParams.get('room')!.toUpperCase();
  const room = rooms.get(code)!;

  let playerId: string | null = null;

  function broadcastRoom() {
    const gs = room.game.getPublicState();
    gs.leaderId = room.leaderId;
    gs.teamNames = room.teamNames;
    // Attach reconnect deadlines (publicId → timestamp) so clients can show a countdown
    const deadlines: Record<string, number> = {};
    for (const [pid, dl] of room.disconnectDeadlines) {
      const pub = [...room.publicToPrivate.entries()].find(([, priv]) => priv === pid)?.[0];
      if (pub) deadlines[pub] = dl;
    }
    gs.disconnectDeadlines = Object.keys(deadlines).length > 0 ? deadlines : undefined;
    for (const [pid, conn] of room.connections) {
      const playerState = room.game.getPlayerState(pid);
      if (!playerState) continue;
      send(conn, {
        type: 'gameState',
        gameState: gs,
        hand: playerState.hand,
      });
    }
  }

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send(ws, { type: 'error', message: 'errors.invalidMessageFormat' });
      return;
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong' });
      return;
    }

    // ── Join / Rejoin ──────────────────────────────────────────────────────
    if (msg.type === 'join') {
      const rejoinToken = msg.rejoinToken?.trim();

      // ── Rejoin path ──
      if (rejoinToken && room.reconnectTokens.has(rejoinToken)) {
        const entry = room.reconnectTokens.get(rejoinToken)!;

        // Prevent duplicate active connection for the same player
        const existingWs = room.connections.get(entry.playerId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
          send(ws, { type: 'error', message: 'errors.playerAlreadyConnected' });
          return;
        }

        playerId = entry.playerId;
        room.connections.set(playerId, ws);
        room.game.reconnectPlayer(playerId);

        // Cancel any pending disconnect timer for this player
        const timer = room.disconnectTimers.get(playerId);
        if (timer) {
          clearTimeout(timer);
          room.disconnectTimers.delete(playerId);
          room.disconnectDeadlines.delete(playerId);
        }

        // If game was paused due to disconnects, resume once all players show as connected
        const gs = room.game.getPublicState();
        if (gs.phase === 'paused' && gs.players.every((p) => p.connected)) {
          room.game.resumeGame();
        }

        const playerState = room.game.getPlayerState(playerId)!;
        const fullGs = room.game.getPublicState();
        fullGs.leaderId = room.leaderId;
        fullGs.teamNames = room.teamNames;
        send(ws, {
          type: 'welcome',
          playerId,
          publicId: entry.publicId,
          rejoinToken,
          gameState: fullGs,
          hand: playerState.hand,
        });
        broadcastRoom();
        return;
      }

      // ── New join path ──
      const name = msg.name?.trim();
      if (!name || name.length < 2 || name.length > 20) {
        send(ws, { type: 'error', message: 'errors.nameLength' });
        return;
      }

      // Sanitize name
      const safeName = name.replace(/[<>&"']/g, '');

      // Check for active duplicate (different socket, same name, same room)
      const existingPrivate = room.game.getPublicState().players.find((p) => p.name.toLowerCase() === safeName.toLowerCase());
      if (existingPrivate) {
        const existingConn = room.connections.get(room.publicToPrivate.get(existingPrivate.publicId) ?? '');
        if (existingConn && existingConn.readyState === WebSocket.OPEN) {
          send(ws, { type: 'error', message: 'errors.nameInUse' });
          return;
        }
      }

      // Generate UUID + public ID
      const newId = uuidv4();
      const newPublicId = uuidv4().slice(0, 8);

      const result = room.game.addPlayer(newId, newPublicId, safeName);
      if (!result.success) {
        send(ws, { type: 'error', message: result.error! });
        return;
      }

      // First player becomes leader
      if (!room.leaderId) room.leaderId = newPublicId;

      // Generate a reconnect token for this player
      const token = uuidv4();
      room.reconnectTokens.set(token, { playerId: newId, publicId: newPublicId, name: safeName, teamId: 0 });

      playerId = newId;
      room.connections.set(playerId, ws);
      room.publicToPrivate.set(newPublicId, newId);

      const playerState = room.game.getPlayerState(playerId)!;
      const fullGs = room.game.getPublicState();
      fullGs.leaderId = room.leaderId;
      fullGs.teamNames = room.teamNames;
      send(ws, {
        type: 'welcome',
        playerId: newId,
        publicId: newPublicId,
        rejoinToken: token,
        gameState: fullGs,
        hand: playerState.hand,
      });
      broadcastRoom();
      return;
    }

    // All other messages require an authenticated player
    if (!playerId) {
      send(ws, { type: 'error', message: 'errors.mustJoinFirst' });
      return;
    }

    // Helper: is this player the leader?
    const myPublicId = room.game.getPlayerState(playerId)?.publicId ?? '';
    const isLeader = myPublicId === room.leaderId;

    switch (msg.type) {
      case 'ready': {
        const r = room.game.setReady(playerId, true);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        if (room.game.canStart()) {
          room.game.startRound();
          // Update reconnect token teamIds after teams are locked in
          for (const [token, entry] of room.reconnectTokens) {
            const p = room.game.getPlayerState(entry.playerId);
            if (p) entry.teamId = p.teamId;
          }
        }
        broadcastRoom();
        break;
      }

      case 'unready': {
        const r = room.game.setReady(playerId, false);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'selectTeam': {
        const r = room.game.selectTeam(playerId, msg.teamId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'movePlayer': {
        if (!isLeader) {
          send(ws, { type: 'error', message: 'errors.leaderOnlyMove' });
          return;
        }
        const r = room.game.movePlayerToTeam(msg.targetPublicId, msg.teamId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'kickPlayer': {
        if (!isLeader) {
          send(ws, { type: 'error', message: 'errors.leaderOnlyKick' });
          return;
        }
        const targetPrivId = room.publicToPrivate.get(msg.targetPublicId);
        if (!targetPrivId) {
          send(ws, { type: 'error', message: 'errors.playerNotFound' });
          return;
        }
        const r = room.game.removePlayer(msg.targetPublicId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        // Notify the kicked player
        const targetWs = room.connections.get(targetPrivId);
        if (targetWs) send(targetWs, { type: 'kicked', reason: 'errors.kickedByLeader' });
        // Clean up
        room.connections.delete(targetPrivId);
        room.publicToPrivate.delete(msg.targetPublicId);
        // Remove their reconnect token
        for (const [token, entry] of room.reconnectTokens) {
          if (entry.publicId === msg.targetPublicId) {
            room.reconnectTokens.delete(token);
            break;
          }
        }
        broadcastRoom();
        break;
      }

      case 'renameTeam': {
        if (!isLeader) {
          send(ws, { type: 'error', message: 'errors.leaderOnlyRename' });
          return;
        }
        const safeName = msg.name
          .trim()
          .replace(/[<>&"']/g, '')
          .slice(0, 20);
        if (!safeName) return;
        room.teamNames[msg.teamId] = safeName;
        broadcastRoom();
        break;
      }

      case 'swapTeamOrder': {
        if (!isLeader) {
          send(ws, { type: 'error', message: 'errors.leaderOnlyReorder' });
          return;
        }
        const r = room.game.swapTeamOrder(msg.publicIdA, msg.publicIdB);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'drawFromStock': {
        const r = room.game.drawFromStock(playerId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'takeDiscard': {
        const r = room.game.takeDiscard(playerId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'layDown': {
        const r = room.game.layDown(playerId, msg.cardIds, msg.meldType, msg.targetMeldId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'addToMeld': {
        const r = room.game.layDown(playerId, msg.cardIds, 'group', msg.meldId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'discard': {
        const r = room.game.discard(playerId, msg.cardId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'goOut': {
        const r = room.game.goOut(playerId, msg.discardCardId);
        if (!r.success) {
          send(ws, { type: 'error', message: r.error! });
          return;
        }
        broadcastRoom();
        break;
      }

      case 'nextRound': {
        if (!isLeader) {
          send(ws, { type: 'error', message: 'errors.leaderOnlyNextRound' });
          return;
        }
        if (room.game.getPublicState().phase !== 'roundEnd') {
          send(ws, { type: 'error', message: 'errors.notInRoundEnd' });
          return;
        }
        room.game.startNextRound();
        // Update reconnect token teamIds after teams are locked in
        for (const [, entry] of room.reconnectTokens) {
          const p = room.game.getPlayerState(entry.playerId);
          if (p) entry.teamId = p.teamId;
        }
        broadcastRoom();
        break;
      }

      default:
        send(ws, { type: 'error', message: 'errors.unknownMessageType' });
    }
  });

  ws.on('close', () => {
    if (playerId) {
      room.game.disconnectPlayer(playerId);
      room.connections.delete(playerId);

      const phase = room.game.getPublicState().phase;
      const leavingPublicId =
        room.game.getPublicState().players.find((p) => {
          const priv = room.publicToPrivate.get(p.publicId);
          return priv === playerId;
        })?.publicId ?? '';

      if (phase === 'lobby') {
        // If the leader leaves the lobby, dissolve the room immediately
        if (leavingPublicId === room.leaderId) {
          dissolveRoom(room, 'errors.leaderLeft');
          return;
        }
        broadcastRoom();
        return;
      }

      // Game is running (playing / paused / roundEnd) — pause and start a 10-min timer
      if (phase === 'playing') {
        room.game.pauseGame();
      }

      const TIMEOUT_MS = 10 * 60 * 1000;
      const deadline = Date.now() + TIMEOUT_MS;
      const t = setTimeout(() => {
        room.disconnectTimers.delete(playerId!);
        room.disconnectDeadlines.delete(playerId!);
        dissolveRoom(room, 'errors.reconnectTimeout');
      }, TIMEOUT_MS);
      room.disconnectTimers.set(playerId, t);
      room.disconnectDeadlines.set(playerId, deadline);

      broadcastRoom();
    }
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
  });
});

// ─── REST API ─────────────────────────────────────────────────────────────────

// Create a new room
app.post('/api/rooms', (req, res) => {
  const isPublic = req.body?.isPublic === true;
  const room = createRoom(isPublic);
  res.json({ code: room.code });
});

// List public rooms with open slots
app.get('/api/rooms', (_req, res) => {
  const list: { code: string; playerCount: number; players: string[] }[] = [];
  for (const room of rooms.values()) {
    const gs = room.game.getPublicState();
    if (room.isPublic && gs.phase === 'lobby' && gs.players.length < 4) {
      list.push({ code: room.code, playerCount: gs.players.length, players: gs.players.map((p) => p.name) });
    }
  }
  res.json({ rooms: list });
});

// Advance to next round
app.post('/api/rooms/:code/next-round', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  const gs = room.game.getPublicState();
  if (gs.phase !== 'roundEnd') {
    res.status(400).json({ error: 'Not in round-end state' });
    return;
  }
  room.game.startNextRound();
  for (const [pid, conn] of room.connections) {
    const playerState = room.game.getPlayerState(pid);
    if (!playerState) continue;
    if (conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify({ type: 'gameState', gameState: room.game.getPublicState(), hand: playerState.hand }));
    }
  }
  res.json({ ok: true });
});

// ─── Static frontend ──────────────────────────────────────────────────────────

const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
  console.log(`Canastra server running on http://0.0.0.0:${PORT}`);
});
