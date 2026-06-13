import { RoomState, PlayerState } from '@/types/game';
import { RoomCodeBadge } from './RoomCodeBadge';
import { PlayerList } from './PlayerList';

interface LobbyPanelProps {
  room: RoomState | null;
  players: PlayerState[];
}

export function LobbyPanel({ room, players }: LobbyPanelProps) {
  if (!room) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass rounded-[32px] p-6 shadow-glow">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Room Code</div>
        <RoomCodeBadge code={room.roomCode} />
        <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 px-4 py-3">Players: {players.length}/8</div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">Map: {room.selectedMap}</div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">Duration: {room.roundDuration}s</div>
        </div>
      </div>

      <div className="glass rounded-[32px] p-6 shadow-glow">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Players</div>
        <PlayerList players={players} currentItId={room.currentItId} />
      </div>
    </div>
  );
}
