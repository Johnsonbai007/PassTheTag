import { useEffect, useRef } from 'react';
import { Vector2 } from '@/types/game';

export interface MovementControls {
  onMove: (direction: Vector2) => void;
  enabled?: boolean;
}

export function useKeyboardMovement({ onMove, enabled = true }: MovementControls): void {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      keys.current[event.key.toLowerCase()] = true;
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      keys.current[event.key.toLowerCase()] = false;
    };

    const tick = (): void => {
      const dx = (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0);
      const dy = (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0);
      onMove({ x: dx, y: dy });
    };

    const interval = window.setInterval(tick, 50);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onMove]);
}
