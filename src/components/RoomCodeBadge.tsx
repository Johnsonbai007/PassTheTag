import clsx from 'clsx';

interface RoomCodeBadgeProps {
  code: string;
  className?: string;
}

export function RoomCodeBadge({ code, className }: RoomCodeBadgeProps) {
  return (
    <div className={clsx('rounded-2xl border border-white/12 bg-white/6 px-5 py-3 font-display text-3xl tracking-[0.35em] text-sky-200 shadow-glow', className)}>
      {code}
    </div>
  );
}
