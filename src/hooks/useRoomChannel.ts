import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoomChannel, RoomChannelHandle } from '@/services/realtime';
import { BroadcastMessage } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';

interface UseRoomChannelArgs {
  roomCode: string | null;
  playerId: string;
  onMessage: (message: BroadcastMessage) => void;
}

export function useRoomChannel({ roomCode, playerId, onMessage }: UseRoomChannelArgs): RoomChannelHandle | null {
  const handleRef = useRef<RoomChannelHandle | null>(null);
  const [handle, setHandle] = useState<RoomChannelHandle | null>(null);
  const setConnectionState = useGameStore((state) => state.setConnectionState);

  const stableOnMessage = useMemo(() => onMessage, [onMessage]);

  useEffect(() => {
    if (!roomCode) return;
    let disposed = false;

    setConnectionState('connecting');
    createRoomChannel(roomCode, playerId, {
      onMessage: stableOnMessage,
      onError: (error) => setConnectionState('error', error),
    })
      .then((handle) => {
        if (disposed) {
          handle.disconnect();
          return;
        }
        handleRef.current = handle;
        setHandle(handle);
        setConnectionState('connected');
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to connect to room';
        setConnectionState('error', message);
      });

    return () => {
      disposed = true;
      void handleRef.current?.disconnect();
      handleRef.current = null;
      setHandle(null);
      setConnectionState('offline');
    };
  }, [playerId, roomCode, setConnectionState, stableOnMessage]);

  return handle;
}
