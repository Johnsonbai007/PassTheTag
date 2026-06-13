import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { HostControls } from '@/components/HostControls';
import { LobbyPanel } from '@/components/LobbyPanel';
import { updateRoom } from '@/services/rooms';
import { MapId, RoundDuration, RoomState } from '@/types/game';

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
  const currentRoom = room;

  async function handleMapChange(mapId: MapId): Promise<void> {
    const next: RoomState = {
      id: currentRoom.id,
      roomCode: currentRoom.roomCode,
      hostId: currentRoom.hostId,
      selectedMap: mapId,
      roundDuration: currentRoom.roundDuration,
      status: currentRoom.status,
      roundNumber: currentRoom.roundNumber,
      remainingTime: currentRoom.remainingTime,
      currentItId: currentRoom.currentItId,
      createdAt: currentRoom.createdAt,
    };
    setRoom(next);
    await updateRoom(currentRoom.id, { selectedMap: mapId });
  }

  async function handleDurationChange(roundDuration: RoundDuration): Promise<void> {
    const next: RoomState = {
      id: currentRoom.id,
      roomCode: currentRoom.roomCode,
      hostId: currentRoom.hostId,
      selectedMap: currentRoom.selectedMap,
      roundDuration,
      status: currentRoom.status,
      roundNumber: currentRoom.roundNumber,
      remainingTime: currentRoom.remainingTime,
      currentItId: currentRoom.currentItId,
      createdAt: currentRoom.createdAt,
    };
    setRoom(next);
    await updateRoom(currentRoom.id, { roundDuration });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <LobbyPanel room={currentRoom} players={players} />
      {isHost && (
        <HostControls
          selectedMap={currentRoom.selectedMap}
          roundDuration={currentRoom.roundDuration}
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
