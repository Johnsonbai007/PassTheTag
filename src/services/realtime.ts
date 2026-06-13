import { supabase, isSupabaseConfigured } from './supabase';
import { BroadcastMessage, PlayerState, RoomState } from '@/types/game';

export interface RoomHandlers {
  onMessage: (message: BroadcastMessage) => void;
  onPresenceSync?: (players: PlayerState[]) => void;
  onError?: (error: string) => void;
}

export interface RoomChannelHandle {
  send: (message: BroadcastMessage) => Promise<void>;
  disconnect: () => Promise<void>;
}

export async function createRoomChannel(roomCode: string, playerId: string, handlers: RoomHandlers): Promise<RoomChannelHandle> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      send: async () => undefined,
      disconnect: async () => undefined,
    };
  }

  const channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true },
      presence: { key: playerId },
    },
  });

  const broadcastEvents: BroadcastMessage['type'][] = [
    'player:move',
    'player:join',
    'player:leave',
    'game:start',
    'game:tag',
    'game:round-end',
    'game:host-change',
    'game:state',
  ];

  broadcastEvents.forEach((event) => {
    channel.on('broadcast', { event }, (payload) => {
      handlers.onMessage((payload.payload ?? {}) as BroadcastMessage);
    });
  });

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState() as Record<string, Array<{ player?: PlayerState }>>;
    const players = Object.values(state)
      .flat()
      .map((presence) => presence.player as PlayerState)
      .filter(Boolean);
    handlers.onPresenceSync?.(players);
  });

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') handlers.onError?.('Realtime channel error');
  });

  await channel.track({ player: { id: playerId } as unknown as PlayerState });

  return {
    send: async (message: BroadcastMessage) => {
      await channel.send({ type: 'broadcast', event: message.type, payload: message });
    },
    disconnect: async () => {
      await supabase.removeChannel(channel);
    },
  };
}

export async function sendRoomState(handle: RoomChannelHandle | null, room: RoomState, players: PlayerState[]): Promise<void> {
  if (!handle) return;
  await handle.send({ type: 'game:state', room, players, timestamp: Date.now() });
}
