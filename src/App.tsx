import { useEffect, useMemo, useState } from 'react';
import { HomePage } from '@/pages/HomePage';
import { LobbyPage } from '@/pages/LobbyPage';
import { GameCanvas } from '@/components/GameCanvas';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useRoomChannel } from '@/hooks/useRoomChannel';
import { BroadcastMessage, PlayerState } from '@/types/game';
import { createLocalRoom, insertMatchResult, setPlayerConnection, updateRoom } from '@/services/rooms';

type ViewState = 'home' | 'lobby' | 'game';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const room = useGameStore((state) => state.room);
  const players = useGameStore((state) => state.players);
  const setRoom = useGameStore((state) => state.setRoom);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const mergePlayer = useGameStore((state) => state.mergePlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const setHost = useGameStore((state) => state.setHost);
  const setLocalPlayerId = useGameStore((state) => state.setLocalPlayerId);
  const localPlayerId = useGameStore((state) => state.localPlayerId);
  const roomCode = useSessionStore((state) => state.roomCode);
  const playerId = useSessionStore((state) => state.playerId);
  const playMode = useSessionStore((state) => state.playMode);

  const handleMessage = useMemo(() => {
    return async (message: BroadcastMessage): Promise<void> => {
      const state = useGameStore.getState();
      const latestRoom = state.room;
      const latestPlayers = state.players;
      switch (message.type) {
        case 'player:move': {
          const existing = latestPlayers.find((player) => player.id === message.playerId);
          state.mergePlayer({
            id: message.playerId,
            roomId: latestRoom?.id ?? existing?.roomId ?? '',
            nickname: existing?.nickname ?? 'Player',
            isHost: existing?.isHost ?? false,
            isIt: existing?.isIt ?? false,
            score: existing?.score ?? 0,
            connected: true,
            ready: true,
            color: existing?.color ?? '#7dd3fc',
            x: message.x,
            y: message.y,
            speedBoostUntil: message.speedBoostUntil,
            lastUpdatedAt: message.timestamp,
            controlScheme: existing?.controlScheme,
          });
          break;
        }
        case 'player:join':
          state.mergePlayer(message.player);
          break;
        case 'player:leave':
          state.removePlayer(message.playerId);
          break;
        case 'game:start':
        case 'game:state':
          setRoom(message.room);
          setPlayers(message.players);
          setHost(Boolean(message.players.find((player) => player.id === playerId)?.isHost));
          setView('game');
          break;
        case 'game:tag':
          setPlayers(
            latestPlayers.map((player) =>
              player.id === message.previousItId
                ? { ...player, isIt: false }
                : player.id === message.taggedPlayerId
                  ? { ...player, isIt: true }
                  : player,
            ),
          );
          setRoom(latestRoom ? { ...latestRoom, currentItId: message.taggedPlayerId } : latestRoom);
          break;
        case 'game:round-end':
          setPlayers(
            latestPlayers.map((player) => ({
              ...player,
              score: message.scores[player.id] ?? player.score,
              isIt: player.id === message.nextItId,
            })),
          );
          setRoom(
            latestRoom
              ? { ...latestRoom, currentItId: message.nextItId, roundNumber: message.roundNumber + 1, remainingTime: latestRoom.roundDuration }
              : latestRoom,
          );
          break;
        case 'game:host-change':
          setRoom(latestRoom ? { ...latestRoom, hostId: message.newHostId } : latestRoom);
          setHost(message.newHostId === playerId);
          break;
      }
    };
  }, [playerId, setHost, setPlayers, setRoom]);

  const roomChannel = useRoomChannel(
    playMode === 'online'
      ? {
          roomCode,
          playerId,
          onMessage: (message) => {
            void handleMessage(message);
          },
        }
      : {
          roomCode: null,
          playerId,
          onMessage: () => undefined,
        },
  );

  useEffect(() => {
    if (!roomCode || !room) return;
    setView(room.status === 'running' ? 'game' : 'lobby');
    setLocalPlayerId(playerId);
  }, [playerId, room, roomCode, setLocalPlayerId]);

  useEffect(() => {
    if (playMode !== 'online') return;
    const handleDisconnect = (): void => {
      if (playerId) void setPlayerConnection(playerId, false);
    };
    window.addEventListener('beforeunload', handleDisconnect);
    return () => window.removeEventListener('beforeunload', handleDisconnect);
  }, [playerId, playMode]);

  useEffect(() => {
    if (playMode !== 'online') return;
    const handlePageHide = (): void => {
      if (!roomChannel) return;
      void roomChannel.send({ type: 'player:leave', playerId });
      void setPlayerConnection(playerId, false);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [playerId, playMode, roomChannel]);

  useEffect(() => {
    if (!room || room.status !== 'running') return;
    if (room.hostId !== localPlayerId) return;

    const tick = window.setInterval(() => {
      const nextRemaining = Math.max(0, room.remainingTime - 1);
      if (nextRemaining <= 0) {
        void endRound();
        return;
      }
      setRoom({ ...room, remainingTime: nextRemaining });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [localPlayerId, room, setRoom]);

  async function broadcast(message: BroadcastMessage): Promise<void> {
    if (!roomChannel) return;
    await roomChannel.send(message);
  }

  useEffect(() => {
    if (playMode !== 'online') return;
    if (!room || players.length === 0) return;
    if (players.some((player) => player.id === room.hostId)) return;

    const nextHost = players.find((player) => player.connected) ?? players[0];
    if (!nextHost) return;

    const nextRoom = { ...room, hostId: nextHost.id };
    setRoom(nextRoom);
    setHost(nextHost.id === playerId);
    void broadcast({
      type: 'game:host-change',
      roomId: room.id,
      newHostId: nextHost.id,
      timestamp: Date.now(),
    });
  }, [broadcast, playerId, playMode, players, room, setHost, setRoom]);

  async function endRound(): Promise<void> {
    if (!room) return;
    const loser = players.find((player) => player.isIt) ?? null;
    if (!loser) return;

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const nextIt = shuffled[0] ?? loser;
    const nextPlayers = players.map((player) => ({
      ...player,
      score: player.id === loser.id ? player.score : player.score + 1,
      isIt: player.id === nextIt.id,
    }));

    const nextRoom = {
      ...room,
      status: 'running' as const,
      roundNumber: room.roundNumber + 1,
      remainingTime: room.roundDuration,
      currentItId: nextIt.id,
    };

    setPlayers(nextPlayers);
    setRoom(nextRoom);

    if (playMode === 'online') {
      await insertMatchResult({ roomId: room.id, loserId: loser.id, roundNumber: room.roundNumber });
      await updateRoom(room.id, { status: 'running' });
      await broadcast({
        type: 'game:round-end',
        roomId: room.id,
        loserId: loser.id,
        nextItId: nextIt.id,
        roundNumber: room.roundNumber,
        scores: Object.fromEntries(nextPlayers.map((player) => [player.id, player.score])),
        timestamp: Date.now(),
      });
    }
  }

  async function handleMove(playerIdToMove: string, x: number, y: number): Promise<void> {
    if (!room) return;
    const me = players.find((player) => player.id === playerIdToMove);
    if (!me) return;
    mergePlayer({ ...me, x, y, lastUpdatedAt: Date.now() });

    if (playMode === 'online' && playerIdToMove === playerId) {
      await broadcast({ type: 'player:move', playerId: playerIdToMove, x, y, vx: 0, vy: 0, speedBoostUntil: me.speedBoostUntil, timestamp: Date.now() });
    }
  }

  async function handleTag(actorId: string, taggedPlayerId: string): Promise<void> {
    if (!room) return;
    const currentIt = players.find((player) => player.id === actorId);
    const tagged = players.find((player) => player.id === taggedPlayerId);
    if (!currentIt || !tagged) return;

    const updated = players.map((player) =>
      player.id === actorId
        ? { ...player, isIt: false, score: player.score + 1 }
        : player.id === taggedPlayerId
          ? { ...player, isIt: true }
          : player,
    );
    setPlayers(updated);
    setRoom({ ...room, currentItId: taggedPlayerId });

    if (playMode === 'online' && actorId === playerId) {
      await broadcast({
        type: 'game:tag',
        roomId: room.id,
        taggedPlayerId,
        previousItId: actorId,
        timestamp: Date.now(),
      });
    }
  }

  async function handleTeleport(playerIdToMove: string, x: number, y: number): Promise<void> {
    if (!room) return;
    const me = players.find((player) => player.id === playerIdToMove);
    if (!me) return;
    mergePlayer({ ...me, x, y, lastUpdatedAt: Date.now(), speedBoostUntil: me.speedBoostUntil });
    if (playMode === 'online' && playerIdToMove === playerId) {
      await broadcast({ type: 'player:move', playerId: playerIdToMove, x, y, vx: 0, vy: 0, speedBoostUntil: me.speedBoostUntil, timestamp: Date.now() });
    }
  }

  async function handleBounce(playerIdToMove: string, impulseX: number, impulseY: number): Promise<void> {
    if (!room) return;
    const me = players.find((player) => player.id === playerIdToMove);
    if (!me) return;
    const boosted = {
      ...me,
      x: me.x + impulseX * 0.02,
      y: me.y + impulseY * 0.02,
      speedBoostUntil: Date.now() + 1500,
      lastUpdatedAt: Date.now(),
    };
    mergePlayer(boosted);
    if (playMode === 'online' && playerIdToMove === playerId) {
      await broadcast({
        type: 'player:move',
        playerId: playerIdToMove,
        x: boosted.x,
        y: boosted.y,
        vx: impulseX,
        vy: impulseY,
        speedBoostUntil: boosted.speedBoostUntil,
        timestamp: Date.now(),
      });
    }
  }

  async function startMatch(): Promise<void> {
    if (!room) return;
    if (players.length < 2) return;
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const startingIt = shuffled[0];
    const updatedPlayers: PlayerState[] = players.map((player, index) => ({
      ...player,
      isIt: player.id === startingIt.id,
      x: 180 + index * 50,
      y: 180 + index * 40,
      ready: true,
      connected: true,
    }));

    const nextRoom = {
      ...room,
      status: 'running' as const,
      currentItId: startingIt.id,
      remainingTime: room.roundDuration,
    };

    setRoom(nextRoom);
    setPlayers(updatedPlayers);
    setView('game');

    if (playMode === 'online') {
      await updateRoom(room.id, { status: 'running' });
      await broadcast({ type: 'game:start', room: nextRoom, players: updatedPlayers });
    }
  }

  async function restartMatch(): Promise<void> {
    if (!room) return;
    const resetPlayers = players.map((player, index) => ({
      ...player,
      isIt: false,
      score: 0,
      x: 180 + index * 40,
      y: 180 + index * 40,
    }));
    const nextRoom = { ...room, status: 'lobby' as const, currentItId: null };
    setRoom(nextRoom);
    setPlayers(resetPlayers);
    setView('lobby');

    if (playMode === 'online') {
      await updateRoom(room.id, { status: 'lobby' });
      await broadcast({ type: 'game:state', room: nextRoom, players: resetPlayers, timestamp: Date.now() });
    }
  }

  function handleEnteredRoom(): void {
    setView('lobby');
  }

  const content =
    view === 'home' ? (
      <HomePage onEnteredRoom={handleEnteredRoom} />
    ) : view === 'lobby' ? (
      <LobbyPage onStartMatch={startMatch} onRestartMatch={restartMatch} />
    ) : (
      <div className="h-full p-4">
        <GameCanvas mode={playMode} room={room} onMove={handleMove} onTag={handleTag} onTeleport={handleTeleport} onBounce={handleBounce} />
      </div>
    );

  return <div className="h-full">{content}</div>;
}
