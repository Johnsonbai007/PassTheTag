import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '@/scenes/GameScene';
import { MAPS } from '@/utils/constants';
import { MapId, PlayerState, RoomState } from '@/types/game';

interface UsePhaserGameArgs {
  containerId: string;
  room: RoomState | null;
  players: PlayerState[];
  localPlayerId: string | null;
  onMove: (x: number, y: number) => void;
  onTag: (taggedPlayerId: string) => void;
  onTeleport: (playerId: string, x: number, y: number) => void;
  onBounce: (playerId: string, impulseX: number, impulseY: number) => void;
}

export function usePhaserGame({
  containerId,
  room,
  players,
  localPlayerId,
  onMove,
  onTag,
  onTeleport,
  onBounce,
}: UsePhaserGameArgs): void {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const parent = document.getElementById(containerId);
    if (!parent || !room) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: '#07111f',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        width: 1280,
        height: 720,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [
        new GameScene({
          map: MAPS[room.selectedMap as MapId],
          room,
          players,
          localPlayerId,
          onMove,
          onTag,
          onTeleport,
          onBounce,
        }),
      ],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [containerId, room?.id, room?.selectedMap]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    scene?.setSnapshot({ room, players, localPlayerId, onMove, onTag, onTeleport, onBounce });
  }, [localPlayerId, onBounce, onMove, onTag, onTeleport, players, room]);
}
