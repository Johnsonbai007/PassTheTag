interface GameHUDProps {
  remainingTime: number;
  currentItName: string;
  connectionState: string;
  roundNumber: number;
}

export function GameHUD({ remainingTime, currentItName, connectionState, roundNumber }: GameHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-4 top-4 glass rounded-2xl px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Current IT</div>
        <div className="font-display text-xl text-red-200">{currentItName}</div>
      </div>
      <div className="absolute left-1/2 top-4 -translate-x-1/2 glass rounded-2xl px-6 py-3 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Remaining Time</div>
        <div className="font-display text-3xl text-white tabular-nums">{remainingTime}s</div>
      </div>
      <div className="absolute right-4 top-4 glass rounded-2xl px-4 py-3 text-right">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Round</div>
        <div className="font-display text-xl text-white">{roundNumber}</div>
        <div className="text-xs text-slate-300">{connectionState}</div>
      </div>
    </div>
  );
}
