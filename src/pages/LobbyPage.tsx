import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { HostControls } from '@/components/HostControls';
import { LobbyPanel } from '@/components/LobbyPanel';
import { updateRoom } from '@/services/rooms';
import { MapId, RoundDuration } from '@/types/game';

interface LobbyPageProps {
  onStartMatch: () => Promise<void>;
  onRestartMatch: () => Promise<void>;
}

export function LobbyPage({ onStartMatch, onRestartMatch }: LobbyPageProps) {
  const room = useGameStore((state) => state.room);
  const players = useGameStore((state) => state.players);
  const isHost = useGameStore((state) => state.isHost);
  const setRoom = useGameStore((state) => state.setRoom);

  const canStart = useMemo(() => players.length >= 2, [players.length]);

  if (!room) return null;

  async function handleMapChange(mapId: MapId): Promise<void> {
    const next = { ...room, selectedMap: mapId };
    setRoom(next);
    await updateRoom(room.id, { selectedMap: mapId });
  }

  async function handleDurationChange(roundDuration: RoundDuration): Promise<void> {
    const next = { ...room, roundDuration };
    setRoom(next);
    await updateRoom(room.id, { roundDuration });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <LobbyPanel room={room} players={players} />
      {isHost && (
        <HostControls
          selectedMap={room.selectedMap}
          roundDuration={room.roundDuration}
          onMapChange={handleMapChange}
          onDurationChange={handleDurationChange}
          onStart={onStartMatch}
          onRestart={onRestartMatch}
          disabled={!canStart}
        />
      )}
    </div>
  );
}
