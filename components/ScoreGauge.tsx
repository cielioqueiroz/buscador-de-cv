'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

/**
 * Medidor circular de compatibilidade (0–100).
 *
 * O número conta de 0 até a nota enquanto o arco enche. O score é a informação
 * mais importante do card — vê-lo *acontecer* dá a ele o peso que merece, e de
 * quebra guia o olho para o canto certo do card.
 */
export function ScoreGauge({ score, size = 72, className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [shown, setShown] = useState(clamped);

  const stroke = size < 60 ? 5 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (shown / 100) * c;

  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(clamped);
      return;
    }

    setShown(0);
    const inicio = performance.now();
    const DURACAO = 900;

    const tick = (agora: number) => {
      const t = Math.min((agora - inicio) / DURACAO, 1);
      // Ease-out cúbico: rápido no começo, assentando no fim — o número e o
      // arco chegam juntos no valor final.
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(clamped * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [clamped]);

  const tone =
    clamped >= 75 ? 'var(--accent-bright)' : clamped >= 50 ? '#eab308' : 'var(--warn)';

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Compatibilidade ${clamped} de 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          // Um match alto merece brilhar.
          style={{ filter: clamped >= 75 ? `drop-shadow(0 0 6px ${tone})` : undefined }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none" aria-hidden>
        <span className="font-mono font-bold tabular-nums" style={{ fontSize: size * 0.3 }}>
          {shown}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          match
        </span>
      </div>
    </div>
  );
}
