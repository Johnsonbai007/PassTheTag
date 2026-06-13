import { MapDefinition, MapId, RoundDuration } from '@/types/game';

export const ROUND_DURATIONS: RoundDuration[] = [60, 120, 180];

export const MAP_IDS: MapId[] = ['grassland', 'winterArena', 'desertRuins'];

export const PLAYER_COLORS = [
  '#7dd3fc',
  '#86efac',
  '#fcd34d',
  '#fda4af',
  '#c4b5fd',
  '#f59e0b',
  '#fb7185',
  '#60a5fa',
];

export const MAPS: Record<MapId, MapDefinition> = {
  grassland: {
    id: 'grassland',
    name: 'Grassland',
    width: 2200,
    height: 1400,
    theme: 'grass',
    background: 'linear-gradient(180deg, #12321b 0%, #0b1f12 100%)',
    walls: [
      { x: 520, y: 220, width: 160, height: 440 },
      { x: 990, y: 760, width: 180, height: 320 },
      { x: 1480, y: 240, width: 120, height: 540 },
    ],
    bouncePads: [
      { id: 'grass-b1', x: 250, y: 1080, width: 96, height: 96, impulseX: 420, impulseY: -220 },
      { id: 'grass-b2', x: 1760, y: 900, width: 96, height: 96, impulseX: -420, impulseY: -140 },
    ],
    teleporters: [],
    spawnPoints: [
      { x: 180, y: 180 },
      { x: 2020, y: 220 },
      { x: 220, y: 1200 },
      { x: 1900, y: 1100 },
      { x: 1100, y: 180 },
    ],
  },
  winterArena: {
    id: 'winterArena',
    name: 'Winter Arena',
    width: 2200,
    height: 1400,
    theme: 'ice',
    background: 'linear-gradient(180deg, #14314b 0%, #08131a 100%)',
    walls: [
      { x: 360, y: 260, width: 120, height: 820 },
      { x: 820, y: 140, width: 80, height: 720 },
      { x: 1180, y: 460, width: 120, height: 700 },
      { x: 1640, y: 220, width: 140, height: 540 },
      { x: 180, y: 1120, width: 1640, height: 80 },
    ],
    bouncePads: [
      { id: 'ice-b1', x: 420, y: 1180, width: 100, height: 100, impulseX: 180, impulseY: -560 },
      { id: 'ice-b2', x: 1680, y: 320, width: 100, height: 100, impulseX: -200, impulseY: 580 },
    ],
    teleporters: [],
    spawnPoints: [
      { x: 120, y: 120 },
      { x: 2040, y: 120 },
      { x: 180, y: 1220 },
      { x: 1980, y: 1220 },
      { x: 1100, y: 700 },
    ],
  },
  desertRuins: {
    id: 'desertRuins',
    name: 'Desert Ruins',
    width: 2200,
    height: 1400,
    theme: 'sand',
    background: 'linear-gradient(180deg, #5c421d 0%, #1e1408 100%)',
    walls: [
      { x: 420, y: 260, width: 140, height: 360 },
      { x: 780, y: 980, width: 140, height: 240 },
      { x: 1300, y: 300, width: 150, height: 400 },
      { x: 1670, y: 760, width: 180, height: 300 },
    ],
    bouncePads: [
      { id: 'desert-b1', x: 260, y: 920, width: 96, height: 96, impulseX: 520, impulseY: -120 },
    ],
    teleporters: [
      { id: 'tp-a', pairId: 'tp-b', x: 620, y: 1180, width: 80, height: 80 },
      { id: 'tp-b', pairId: 'tp-a', x: 1720, y: 200, width: 80, height: 80 },
      { id: 'tp-c', pairId: 'tp-d', x: 1620, y: 1120, width: 80, height: 80 },
      { id: 'tp-d', pairId: 'tp-c', x: 320, y: 260, width: 80, height: 80 },
    ],
    spawnPoints: [
      { x: 180, y: 200 },
      { x: 1960, y: 180 },
      { x: 200, y: 1180 },
      { x: 1900, y: 1100 },
      { x: 1100, y: 700 },
    ],
  },
};
