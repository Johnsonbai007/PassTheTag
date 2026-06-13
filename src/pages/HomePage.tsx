import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { createRoom, getRoomByCode, listPlayers, createOrUpdatePlayer } from '@/services/rooms';
import { PlayerState } from '@/types/game';
import { MAP_IDS, ROUND_DURATIONS } from '@/utils/constants';
import { isRoomCode } from '@/utils/roomCode';

interface HomePageProps {
  onEnteredRoom: (roomCode: string) => void;
}

export function HomePage({ onEnteredRoom }: HomePageProps) {
  const nickname = useSessionStore((state) => state.nickname);
  const setNickname = useSessionStore((state) => state.setNickname);
  const playerId = useSessionStore((state) => state.playerId);
  const setRoomCode = useSessionStore((state) => state.setRoomCode);
  const setLocalPlayerId = useGameStore((state) => state.setLocalPlayerId);
  const setRoom = useGameStore((state) => state.setRoom);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreateRoom(): Promise<void> {
    const room = await createRoom(playerId, MAP_IDS[0], ROUND_DURATIONS[1]);
    const hostPlayer: PlayerState = {
      id: playerId,
      roomId: room.id,
      nickname,
      isHost: true,
      isIt: false,
      score: 0,
      connected: true,
      ready: true,
      color: '#7dd3fc',
      x: 220,
      y: 220,
      speedBoostUntil: 0,
      lastUpdatedAt: Date.now(),
    };
    await createOrUpdatePlayer(hostPlayer);
    setRoom(room);
    setPlayers([hostPlayer]);
    setRoomCode(room.roomCode);
    setLocalPlayerId(playerId);
    onEnteredRoom(room.roomCode);
  }

  async function handleJoinRoom(): Promise<void> {
    const code = joinCode.trim().toUpperCase();
    if (!isRoomCode(code)) {
      setError('Enter a valid 6-character room code.');
      return;
    }

    const room = await getRoomByCode(code);
    if (!room) {
      setError('Room not found.');
      return;
    }

    const existingPlayers = await listPlayers(room.id);
    if (existingPlayers.length >= 8) {
      setError('That room is full.');
      return;
    }

    const player: PlayerState = {
      id: playerId,
      roomId: room.id,
      nickname,
      isHost: room.hostId === playerId,
      isIt: false,
      score: 0,
      connected: true,
      ready: true,
      color: '#86efac',
      x: 220,
      y: 220,
      speedBoostUntil: 0,
      lastUpdatedAt: Date.now(),
    };

    await createOrUpdatePlayer(player);
    const players = await listPlayers(room.id);
    setRoom(room);
    setPlayers(players.length ? players : [player]);
    setRoomCode(room.roomCode);
    setLocalPlayerId(playerId);
    onEnteredRoom(room.roomCode);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl items-center px-4 py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-[36px] border border-white/10 bg-black/30 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300">
            PassTheTag
          </div>
          <h1 className="font-display text-5xl leading-tight text-white sm:text-6xl">
            A fast, realtime
            <span className="block text-sky-300">multiplayer tag arena</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-300">
            Create a room, invite up to eight players, and chase the IT marker across maps with bounce pads, teleporters, and round-based scoring.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={handleCreateRoom} className="rounded-2xl bg-sky-400 px-5 py-4 font-display text-lg text-slate-950 transition hover:bg-sky-300">
              Create Room
            </button>
            <button
              onClick={handleJoinRoom}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-display text-lg text-white transition hover:bg-white/10"
            >
              Join Room
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            No login required. Supabase Realtime keeps movement, tags, host changes, and round transitions synced across clients.
          </div>
        </div>

        <div className="glass space-y-5 rounded-[36px] p-8 shadow-glow">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Nickname</label>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={16}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Room Code</label>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              placeholder="AB12CD"
            />
          </div>

          {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}

          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl bg-white/5 px-4 py-3">Minimum 2 players, maximum 8 players.</div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">Host picks map and round duration before starting.</div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">IT changes instantly when touched or when the timer expires.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
