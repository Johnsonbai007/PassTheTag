import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionState, MapId, PlayerState, RoomSnapshot, RoomState, RoundDuration } from '@/types/game';
import { MAP_IDS } from '@/utils/constants';

const defaultPlayerColor = '#7dd3fc';

interface GameStore extends RoomSnapshot {
  localPlayerId: string | null;
  availableMaps: MapId[];
  selectedMap: MapId;
  roundDuration: RoundDuration;
  isHost: boolean;
  roomCode: string | null;
  setConnectionState: (state: ConnectionState, error?: string) => void;
  setRoom: (room: RoomState | null) => void;
  setPlayers: (players: PlayerState[]) => void;
  mergePlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  setRoomCode: (roomCode: string | null) => void;
  setLocalPlayerId: (playerId: string | null) => void;
  setSelectedMap: (map: MapId) => void;
  setRoundDuration: (duration: RoundDuration) => void;
  setHost: (isHost: boolean) => void;
  setMatchResults: (results: RoomSnapshot['matchResults']) => void;
  resetRoom: () => void;
}

const initial = {
  room: null,
  players: [],
  matchResults: [],
  connectionState: 'offline' as ConnectionState,
  availableMaps: MAP_IDS,
  selectedMap: 'grassland' as MapId,
  roundDuration: 120 as RoundDuration,
  isHost: false,
  roomCode: null as string | null,
  localPlayerId: null as string | null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,
      setConnectionState: (connectionState, error) => set({ connectionState, error }),
      setRoom: (room) =>
        set((state) => ({
          room,
          roomCode: room?.roomCode ?? state.roomCode,
          selectedMap: room?.selectedMap ?? state.selectedMap,
          roundDuration: room?.roundDuration ?? state.roundDuration,
          isHost: room ? state.localPlayerId === room.hostId : false,
        })),
      setPlayers: (players) => set({ players }),
      mergePlayer: (player) =>
        set((state) => {
          const index = state.players.findIndex((existing) => existing.id === player.id);
          if (index === -1) return { players: [...state.players, { ...player, color: player.color || defaultPlayerColor }] };
          const next = [...state.players];
          next[index] = { ...next[index], ...player };
          return { players: next };
        }),
      removePlayer: (playerId) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== playerId),
        })),
      setRoomCode: (roomCode) => set({ roomCode }),
      setLocalPlayerId: (localPlayerId) =>
        set((state) => ({
          localPlayerId,
          isHost: state.room ? localPlayerId === state.room.hostId : false,
        })),
      setSelectedMap: (selectedMap) => set({ selectedMap }),
      setRoundDuration: (roundDuration) => set({ roundDuration }),
      setHost: (isHost) => set({ isHost }),
      setMatchResults: (matchResults) => set({ matchResults }),
      resetRoom: () =>
        set({
          room: null,
          players: [],
          matchResults: [],
          roomCode: null,
          isHost: false,
          selectedMap: 'grassland',
          roundDuration: 120,
          error: undefined,
        }),
    }),
    { name: 'passthetag-game' },
  ),
);
