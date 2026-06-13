import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClientSession, PlayMode } from '@/types/game';

interface SessionStore extends ClientSession {
  setNickname: (nickname: string) => void;
  setPlayerId: (playerId: string) => void;
  setRoomCode: (roomCode: string | null) => void;
  setPlayMode: (mode: PlayMode) => void;
}

const createInitialPlayerId = (): string => `p_${crypto.randomUUID()}`;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      playerId: createInitialPlayerId(),
      nickname: 'Player',
      roomCode: null,
      playMode: 'home',
      setNickname: (nickname) => set({ nickname }),
      setPlayerId: (playerId) => set({ playerId }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setPlayMode: (playMode) => set({ playMode }),
    }),
    { name: 'passthetag-session' },
  ),
);
