import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePhaserGame } from '@/hooks/usePhaserGame';
import { GameHUD } from './GameHUD';
import { Leaderboard } from './Leaderboard';
import { PlayMode, RoomState } from '@/types/game';

interface GameCanvasProps {
  mode: PlayMode;
  room: RoomState | null;
  onMove: (playerId: string, x: number, y: number) => void;
  onTag: (actorId: string, taggedPlayerId: string) => void;
  onTeleport: (playerId: string, x: number, y: number) => void;
  onBounce: (playerId: string, impulseX: number, impulseY: number) => void;
}

export function GameCanvas({ mode, room, onMove, onTag, onTeleport, onBounce }: GameCanvasProps) {
  const players = useGameStore((state) => state.players);
  const localPlayerId = useGameStore((state) => state.localPlayerId);
  const connectionState = useGameStore((state) => state.connectionState);
  const [hudTime, setHudTime] = useState(room?.remainingTime ?? 0);

  useEffect(() => {
    setHudTime(room?.remainingTime ?? 0);
  }, [room?.remainingTime]);

  const currentIt = useMemo(() => players.find((player) => player.isIt) ?? null, [players]);

  usePhaserGame({
    containerId: 'game-canvas',
    mode,
    room,
    players,
    localPlayerId,
    onMove,
    onTag,
    onTeleport,
    onBounce,
  });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80">
      <div id="game-canvas" className="h-full w-full" />
      {room && <GameHUD remainingTime={hudTime} currentItName={currentIt?.nickname ?? 'Waiting...'} connectionState={connectionState} roundNumber={room.roundNumber} />}
      <div className="absolute right-4 top-24 w-72 max-w-[calc(100vw-2rem)]">
        <Leaderboard players={players} />
      </div>
    </div>
  );
}
