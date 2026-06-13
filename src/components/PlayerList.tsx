import clsx from 'clsx';
import { PlayerState } from '@/types/game';

interface PlayerListProps {
  players: PlayerState[];
  currentItId: string | null;
}

export function PlayerList({ players, currentItId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={clsx(
            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
            player.id === currentItId ? 'border-red-300/30 bg-red-400/10' : 'border-white/10 bg-white/5',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: player.color }} />
            <span className="font-medium">{player.nickname}</span>
            {player.isHost && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] uppercase tracking-widest text-amber-200">Host</span>}
            {player.id === currentItId && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] uppercase tracking-widest text-red-100">IT</span>}
          </div>
          <div className="text-slate-300">Score {player.score}</div>
        </div>
      ))}
    </div>
  );
}
