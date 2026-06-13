import { PlayerState } from '@/types/game';

interface LeaderboardProps {
  players: PlayerState[];
}

export function Leaderboard({ players }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="glass rounded-3xl p-4 shadow-glow">
      <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Leaderboard</div>
      <div className="space-y-2">
        {sorted.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm text-slate-300">{index + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: player.color }} />
              <span className="text-sm">{player.nickname}</span>
            </div>
            <span className="font-display text-lg text-white">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
