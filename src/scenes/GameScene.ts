import Phaser from 'phaser';
import { ControlScheme, MapDefinition, PlayMode, PlayerState, RoomState } from '@/types/game';
import { clamp, rectsOverlap } from '@/utils/math';

interface GameSceneConfig {
  mode: PlayMode;
  map: MapDefinition;
  room: RoomState;
  players: PlayerState[];
  localPlayerId: string | null;
  onMove: (playerId: string, x: number, y: number) => void;
  onTag: (actorId: string, taggedPlayerId: string) => void;
  onTeleport: (playerId: string, x: number, y: number) => void;
  onBounce: (playerId: string, impulseX: number, impulseY: number) => void;
}

type SpriteEntry = {
  body: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
  crown?: Phaser.GameObjects.Text;
  baseTint: number;
};

type KeyGroup = {
  W?: Phaser.Input.Keyboard.Key;
  A?: Phaser.Input.Keyboard.Key;
  S?: Phaser.Input.Keyboard.Key;
  D?: Phaser.Input.Keyboard.Key;
  UP?: Phaser.Input.Keyboard.Key;
  LEFT?: Phaser.Input.Keyboard.Key;
  DOWN?: Phaser.Input.Keyboard.Key;
  RIGHT?: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private configData: GameSceneConfig;
  private readonly playerSprites = new Map<string, SpriteEntry>();
  private readonly wallRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly bouncePadRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly teleporterRects = new Map<string, Phaser.GameObjects.Rectangle>();
  private keyGroup: KeyGroup = {};
  private lastBroadcastAt = new Map<string, number>();
  private lastSpecialAt = new Map<string, number>();
  private lastTagAt = 0;

  constructor(configData: GameSceneConfig) {
    super('GameScene');
    this.configData = configData;
  }

  create(): void {
    const { map } = this.configData;
    this.cameras.main.setBackgroundColor(map.theme === 'ice' ? '#091724' : map.theme === 'sand' ? '#24170b' : '#08150d');

    this.createPlayerTexture();
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0x08111f, 0.22);
    this.drawArenaBounds(map);
    this.createWalls(map);
    this.createBouncePads(map);
    this.createTeleporters(map);

    this.configData.players.forEach((player, index) => this.spawnOrUpdatePlayer(player, index));
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.keyGroup = this.input.keyboard?.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as KeyGroup;
  }

  update(): void {
    const { players, localPlayerId, map, onMove, onTag, onBounce, onTeleport, mode, room } = this.configData;

    if (mode === 'local') {
      players.forEach((player, index) => {
        const sprite = this.playerSprites.get(player.id);
        if (!sprite) return;

        const velocity = this.getVelocityForPlayer(player.controlScheme ?? (index === 0 ? 'wasd' : 'arrows'));
        const speed = player.speedBoostUntil > Date.now() ? 300 : 210;
        this.applyMovement(player, sprite, map, velocity, speed, onMove);
        this.handleEnvironmentForPlayer(player, sprite, map, onBounce, onTeleport);
        this.handleTaggingForPlayer(player, sprite, players, onTag, mode);
        this.syncLabel(sprite, isIt(player));
        if (index === 0) {
          this.cameras.main.centerOn(sprite.body.x, sprite.body.y);
        }
      });
      return;
    }

    const localPlayer = localPlayerId ? players.find((player) => player.id === localPlayerId) : null;
    if (!localPlayer) return;

    const sprite = this.playerSprites.get(localPlayer.id);
    if (!sprite) return;

    const velocity = this.getVelocityForPlayer(localPlayer.controlScheme ?? 'wasd');
    const speed = localPlayer.speedBoostUntil > Date.now() ? 300 : 210;
    this.applyMovement(localPlayer, sprite, map, velocity, speed, onMove);
    this.handleEnvironmentForPlayer(localPlayer, sprite, map, onBounce, onTeleport);
    this.handleTaggingForPlayer(localPlayer, sprite, players, onTag, mode, room.currentItId);
    this.syncLabel(sprite, isIt(localPlayer));
    this.cameras.main.centerOn(sprite.body.x, sprite.body.y);
  }

  setSnapshot(next: Partial<GameSceneConfig>): void {
    this.configData = { ...this.configData, ...next };
    if (next.players) {
      const incomingIds = new Set(next.players.map((player) => player.id));
      for (const [playerId, sprite] of this.playerSprites.entries()) {
        if (!incomingIds.has(playerId)) {
          sprite.body.destroy();
          sprite.label.destroy();
          sprite.crown?.destroy();
          this.playerSprites.delete(playerId);
        }
      }
      next.players.forEach((player, index) => this.spawnOrUpdatePlayer(player, index));
    }
  }

  private getVelocityForPlayer(controlScheme: ControlScheme): Phaser.Math.Vector2 {
    const vector = new Phaser.Math.Vector2();
    if (controlScheme === 'wasd') {
      if (this.keyGroup.W?.isDown) vector.y -= 1;
      if (this.keyGroup.S?.isDown) vector.y += 1;
      if (this.keyGroup.A?.isDown) vector.x -= 1;
      if (this.keyGroup.D?.isDown) vector.x += 1;
    } else {
      if (this.keyGroup.UP?.isDown) vector.y -= 1;
      if (this.keyGroup.DOWN?.isDown) vector.y += 1;
      if (this.keyGroup.LEFT?.isDown) vector.x -= 1;
      if (this.keyGroup.RIGHT?.isDown) vector.x += 1;
    }
    return vector;
  }

  private applyMovement(
    player: PlayerState,
    sprite: SpriteEntry,
    map: MapDefinition,
    velocity: Phaser.Math.Vector2,
    speed: number,
    onMove: GameSceneConfig['onMove'],
  ): void {
    if (velocity.length() > 1) velocity.normalize();
    sprite.body.setVelocity(velocity.x * speed, velocity.y * speed);
    sprite.body.x = clamp(sprite.body.x, 18, map.width - 18);
    sprite.body.y = clamp(sprite.body.y, 18, map.height - 18);
    this.syncLabel(sprite, player.isIt);

    const now = Date.now();
    const previous = this.lastBroadcastAt.get(player.id) ?? 0;
    if (now - previous >= 50) {
      this.lastBroadcastAt.set(player.id, now);
      onMove(player.id, sprite.body.x, sprite.body.y);
    }
  }

  private handleEnvironmentForPlayer(
    player: PlayerState,
    sprite: SpriteEntry,
    map: MapDefinition,
    onBounce: GameSceneConfig['onBounce'],
    onTeleport: GameSceneConfig['onTeleport'],
  ): void {
    const playerBounds = sprite.body.getBounds();
    this.wallRects.forEach((wall) => {
      const bounds = wall.getBounds();
      if (rectsOverlap(playerBounds, bounds)) {
        this.resolveWallCollision(sprite.body, bounds);
      }
    });

    this.bouncePadRects.forEach((pad) => {
      const bounds = pad.getBounds();
      if (!rectsOverlap(sprite.body.getBounds(), bounds)) return;
      const lastHit = this.lastSpecialAt.get(`${player.id}:bounce`) ?? 0;
      if (Date.now() - lastHit < 300) return;
      const entry = map.bouncePads.find((item) => item.x === pad.x && item.y === pad.y);
      if (entry) {
        this.lastSpecialAt.set(`${player.id}:bounce`, Date.now());
        onBounce(player.id, entry.impulseX, entry.impulseY);
      }
    });

    this.teleporterRects.forEach((teleporter, id) => {
      if (!rectsOverlap(sprite.body.getBounds(), teleporter.getBounds())) return;
      const lastHit = this.lastSpecialAt.get(`${player.id}:teleport`) ?? 0;
      if (Date.now() - lastHit < 500) return;
      const source = map.teleporters.find((entry) => entry.id === id);
      if (!source) return;
      const target = map.teleporters.find((entry) => entry.id === source.pairId);
      if (target) {
        this.lastSpecialAt.set(`${player.id}:teleport`, Date.now());
        onTeleport(player.id, target.x + target.width / 2, target.y + target.height / 2);
      }
    });

  }

  private handleTaggingForPlayer(
    player: PlayerState,
    sprite: SpriteEntry,
    players: PlayerState[],
    onTag: GameSceneConfig['onTag'],
    mode: PlayMode,
    currentItId?: string | null,
  ): void {
    if (Date.now() - this.lastTagAt < 300) return;
    const attackerId = mode === 'local' ? (player.isIt ? player.id : null) : currentItId === player.id ? player.id : null;
    if (!attackerId) return;

    const attackerBounds = sprite.body.getBounds();
    for (const target of players) {
      if (target.id === player.id) continue;
      const targetSprite = this.playerSprites.get(target.id);
      if (!targetSprite) continue;
      if (rectsOverlap(attackerBounds, targetSprite.body.getBounds())) {
        this.lastTagAt = Date.now();
        onTag(attackerId, target.id);
        break;
      }
    }
  }

  private syncLabel(sprite: SpriteEntry, isIt: boolean): void {
    sprite.label.setPosition(sprite.body.x - 36, sprite.body.y - 42);
    if (sprite.crown) {
      sprite.crown.setPosition(sprite.body.x - 10, sprite.body.y - 68);
    }
    if (isIt && !sprite.crown) {
      sprite.crown = this.add.text(sprite.body.x - 10, sprite.body.y - 68, 'CROWN', { color: '#fecaca', fontSize: '16px' }).setDepth(6);
    } else if (!isIt && sprite.crown) {
      sprite.crown.destroy();
      sprite.crown = undefined;
    }
    sprite.body.setTint(isIt ? 0xff5f5f : sprite.baseTint);
  }

  private createPlayerTexture(): void {
    if (this.textures.exists('player-token')) return;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.generateTexture('player-token', 36, 36);
    graphics.destroy();
  }

  private drawArenaBounds(map: MapDefinition): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(6, 0xffffff, 0.14);
    graphics.strokeRoundedRect(6, 6, map.width - 12, map.height - 12, 22);
  }

  private createWalls(map: MapDefinition): void {
    map.walls.forEach((wall) => {
      const rect = this.add.rectangle(wall.x, wall.y, wall.width, wall.height, 0x0b1727, 0.88).setOrigin(0);
      this.physics.add.existing(rect, true);
      this.wallRects.push(rect);
    });
  }

  private createBouncePads(map: MapDefinition): void {
    map.bouncePads.forEach((pad) => {
      const rect = this.add.rectangle(pad.x, pad.y, pad.width, pad.height, 0x7dd3fc, 0.32).setOrigin(0);
      rect.setStrokeStyle(2, 0x7dd3fc, 0.8);
      this.add.text(pad.x + 10, pad.y + 34, 'BOUNCE', { color: '#d9f4ff', fontSize: '18px' });
      this.physics.add.existing(rect, true);
      this.bouncePadRects.push(rect);
    });
  }

  private createTeleporters(map: MapDefinition): void {
    map.teleporters.forEach((teleporter, index) => {
      const color = index % 2 === 0 ? 0xf59e0b : 0x7c3aed;
      const rect = this.add.rectangle(teleporter.x, teleporter.y, teleporter.width, teleporter.height, color, 0.28).setOrigin(0);
      rect.setStrokeStyle(2, color, 0.95);
      this.add.text(teleporter.x - 8, teleporter.y + 90, 'TP', { color: '#fff', fontSize: '16px' });
      this.physics.add.existing(rect, true);
      this.teleporterRects.set(teleporter.id, rect);
    });
  }

  private spawnOrUpdatePlayer(player: PlayerState, index: number): void {
    const existing = this.playerSprites.get(player.id);
    const tint = Phaser.Display.Color.HexStringToColor(player.color).color;
    const isIt = Boolean(player.isIt);

    if (!existing) {
      const body = this.physics.add.image(player.x ?? 140 + index * 50, player.y ?? 140 + index * 50, 'player-token');
      body.setDisplaySize(36, 36);
      body.setImmovable(false);
      body.setCollideWorldBounds(true);
      body.setDepth(4);
      body.setData('playerId', player.id);
      body.setTint(isIt ? 0xff5f5f : tint);

      const label = this.add.text(body.x - 36, body.y - 42, player.nickname, {
        color: '#f8fafc',
        fontSize: '14px',
        fontStyle: 'bold',
      });
      label.setDepth(5);

      const crown = isIt
        ? this.add.text(body.x - 10, body.y - 68, 'CROWN', { color: '#fecaca', fontSize: '16px' }).setDepth(6)
        : undefined;

      this.playerSprites.set(player.id, { body, label, crown, baseTint: tint });
      return;
    }

    existing.body.setPosition(player.x, player.y);
    existing.baseTint = tint;
    existing.body.setTint(isIt ? 0xff5f5f : tint);
    existing.label.setText(player.nickname);
    this.syncLabel(existing, isIt);
  }

  private resolveWallCollision(body: Phaser.Physics.Arcade.Image, bounds: Phaser.Geom.Rectangle): void {
    const playerBounds = body.getBounds();
    const overlapX = Math.min(playerBounds.right - bounds.left, bounds.right - playerBounds.left);
    const overlapY = Math.min(playerBounds.bottom - bounds.top, bounds.bottom - playerBounds.top);

    if (overlapX < overlapY) {
      body.x += playerBounds.centerX < bounds.centerX ? -overlapX : overlapX;
    } else {
      body.y += playerBounds.centerY < bounds.centerY ? -overlapY : overlapY;
    }
  }
}

function isIt(player: PlayerState): boolean {
  return Boolean(player.isIt);
}
