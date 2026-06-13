import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClientSession } from '@/types/game';

interface SessionStore extends ClientSession {
  setNickname: (nickname: string) => void;
  setPlayerId: (playerId: string) => void;
  setRoomCode: (roomCode: string | null) => void;
}

const createInitialPlayerId = (): string => `p_${crypto.randomUUID()}`;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      playerId: createInitialPlayerId(),
      nickname: 'Player',
      roomCode: null,
      setNickname: (nickname) => set({ nickname }),
      setPlayerId: (playerId) => set({ playerId }),
      setRoomCode: (roomCode) => set({ roomCode }),
    }),
    { name: 'passthetag-session' },
  ),
);
