import { MapId, RoundDuration } from '@/types/game';
import { MAPS, ROUND_DURATIONS } from '@/utils/constants';

interface HostControlsProps {
  selectedMap: MapId;
  roundDuration: RoundDuration;
  onMapChange: (mapId: MapId) => void;
  onDurationChange: (duration: RoundDuration) => void;
  onStart: () => void;
  onRestart: () => void;
  disabled?: boolean;
}

export function HostControls({
  selectedMap,
  roundDuration,
  onMapChange,
  onDurationChange,
  onStart,
  onRestart,
  disabled,
}: HostControlsProps) {
  return (
    <div className="glass space-y-4 rounded-3xl p-4 shadow-glow">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Host Controls</div>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Map</span>
        <select
          value={selectedMap}
          onChange={(event) => onMapChange(event.target.value as MapId)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
          disabled={disabled}
        >
          {Object.values(MAPS).map((map) => (
            <option key={map.id} value={map.id}>
              {map.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-sm text-slate-300">Round Duration</span>
        <div className="grid grid-cols-3 gap-2">
          {ROUND_DURATIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => onDurationChange(duration)}
              className={`rounded-2xl border px-3 py-2 text-sm transition ${
                roundDuration === duration ? 'border-sky-400/40 bg-sky-400/15 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300'
              }`}
              disabled={disabled}
            >
              {duration}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onStart} disabled={disabled} className="rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
          Start Game
        </button>
        <button onClick={onRestart} disabled={disabled} className="rounded-2xl bg-white/10 px-4 py-3 font-medium text-white transition hover:bg-white/15 disabled:opacity-50">
          Restart
        </button>
      </div>
    </div>
  );
}
