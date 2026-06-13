import { supabase } from './supabase';
import { createRoomCode } from '@/utils/roomCode';
import { PlayerState, RoomState, RoundDuration, MapId, MatchResult } from '@/types/game';

export async function createRoom(hostId: string, mapId: MapId, roundDuration: RoundDuration): Promise<RoomState> {
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      roomCode: createRoomCode(),
      hostId,
      selectedMap: mapId,
      roundDuration,
      status: 'lobby',
      roundNumber: 1,
      remainingTime: roundDuration,
      currentItId: null,
      createdAt: new Date().toISOString(),
    };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = createRoomCode();
    const payload = {
      room_code: roomCode,
      host_id: hostId,
      selected_map: mapId,
      round_duration: roundDuration,
      status: 'lobby',
    };
    const { data, error } = await supabase.from('rooms').insert(payload).select('*').single();
    if (!error && data) {
      return {
        id: data.id,
        roomCode: data.room_code,
        hostId: data.host_id,
        selectedMap: data.selected_map,
        roundDuration: data.round_duration,
        status: data.status,
        roundNumber: 1,
        remainingTime: data.round_duration,
        currentItId: null,
        createdAt: data.created_at,
      };
    }

    if (error?.code !== '23505' || attempt === 4) {
      throw error;
    }
  }

  throw new Error('Failed to create room');
}

export async function getRoomByCode(roomCode: string): Promise<RoomState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('rooms').select('*').eq('room_code', roomCode).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    roomCode: data.room_code,
    hostId: data.host_id,
    selectedMap: data.selected_map,
    roundDuration: data.round_duration,
    status: data.status,
    roundNumber: 1,
    remainingTime: data.round_duration,
    currentItId: null,
    createdAt: data.created_at,
  };
}

export async function updateRoom(roomId: string, patch: Partial<RoomState>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = {};
  if (patch.hostId) payload.host_id = patch.hostId;
  if (patch.selectedMap) payload.selected_map = patch.selectedMap;
  if (patch.roundDuration) payload.round_duration = patch.roundDuration;
  if (patch.status) payload.status = patch.status;
  await supabase.from('rooms').update(payload).eq('id', roomId);
}

export async function createOrUpdatePlayer(player: PlayerState): Promise<void> {
  if (!supabase) return;
  await supabase.from('players').upsert({
    id: player.id,
    room_id: player.roomId,
    nickname: player.nickname,
    is_host: player.isHost,
    score: player.score,
    connected: player.connected,
  });
}

export async function setPlayerConnection(playerId: string, connected: boolean): Promise<void> {
  if (!supabase) return;
  await supabase.from('players').update({ connected }).eq('id', playerId);
}

export async function listPlayers(roomId: string): Promise<PlayerState[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('players').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
  return (data ?? []).map((row, index) => ({
    id: row.id,
    roomId: row.room_id,
    nickname: row.nickname,
    isHost: row.is_host,
    isIt: false,
    score: row.score,
    connected: row.connected,
    ready: true,
    color: ['#7dd3fc', '#86efac', '#fcd34d', '#fda4af', '#c4b5fd', '#f59e0b', '#fb7185', '#60a5fa'][index % 8],
    x: 0,
    y: 0,
    speedBoostUntil: 0,
    lastUpdatedAt: Date.now(),
  }));
}

export async function insertMatchResult(result: Omit<MatchResult, 'id' | 'createdAt'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('match_results').insert({
    room_id: result.roomId,
    loser_id: result.loserId,
    round_number: result.roundNumber,
  });
}
