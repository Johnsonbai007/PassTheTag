export type MapId = 'grassland' | 'winterArena' | 'desertRuins';
export type RoomStatus = 'lobby' | 'running' | 'paused' | 'ended';
export type RoundDuration = 60 | 120 | 180;
export type ConnectionState = 'offline' | 'connecting' | 'connected' | 'error';

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState extends Vector2 {
  id: string;
  roomId: string;
  nickname: string;
  isHost: boolean;
  isIt: boolean;
  score: number;
  connected: boolean;
  ready: boolean;
  color: string;
  speedBoostUntil: number;
  lastUpdatedAt: number;
}

export interface RoomState {
  id: string;
  roomCode: string;
  hostId: string;
  selectedMap: MapId;
  roundDuration: RoundDuration;
  status: RoomStatus;
  roundNumber: number;
  remainingTime: number;
  currentItId: string | null;
  createdAt: string;
}

export interface MatchResult {
  id: string;
  roomId: string;
  loserId: string;
  roundNumber: number;
  createdAt: string;
}

export type BroadcastMessage =
  | { type: 'player:move'; playerId: string; x: number; y: number; vx: number; vy: number; speedBoostUntil: number; timestamp: number }
  | { type: 'player:join'; player: PlayerState }
  | { type: 'player:leave'; playerId: string }
  | { type: 'game:start'; room: RoomState; players: PlayerState[] }
  | { type: 'game:tag'; roomId: string; taggedPlayerId: string; previousItId: string; timestamp: number }
  | { type: 'game:round-end'; roomId: string; loserId: string; nextItId: string; roundNumber: number; scores: Record<string, number>; timestamp: number }
  | { type: 'game:host-change'; roomId: string; newHostId: string; timestamp: number }
  | { type: 'game:state'; room: RoomState; players: PlayerState[]; timestamp: number };

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BouncePad {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  impulseX: number;
  impulseY: number;
}

export interface Teleporter {
  id: string;
  pairId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapDefinition {
  id: MapId;
  name: string;
  width: number;
  height: number;
  theme: string;
  background: string;
  walls: MapObstacle[];
  bouncePads: BouncePad[];
  teleporters: Teleporter[];
  spawnPoints: Vector2[];
}

export interface ClientSession {
  playerId: string;
  nickname: string;
  roomCode: string | null;
}

export interface RoomSnapshot {
  room: RoomState | null;
  players: PlayerState[];
  matchResults: MatchResult[];
  connectionState: ConnectionState;
  error?: string;
}
