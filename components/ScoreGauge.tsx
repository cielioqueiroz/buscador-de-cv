'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/client/browser-state';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
  /** Palavra sob o número; o medidor também mede a força do perfil. */
  label?: string;
  /** Nome lido por leitor de tela, antes de "N de 100". */
  ariaLabel?: string;
}

/**
 * Medidor circular de compatibilidade (0–100).
 *
 * O número conta de 0 até a nota enquanto o arco enche. O score é a informação
 * mais importante do card — vê-lo *acontecer* dá a ele o peso que merece, e de
 * quebra guia o olho para o canto certo do card.
 */
export function ScoreGauge({ score, size = 72, className, label = 'match', ariaLabel = 'Compatibilidade' }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(clamped);
  // Com "reduzir movimento", o número aparece direto, sem a contagem.
  const display = reduced ? clamped : shown;

  const stroke = size < 60 ? 5 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;

  const raf = useRef(0);

  useEffect(() => {
    if (reduced) return;

    // O primeiro quadro (t≈0) já zera o arco; daí ele sobe até o valor.
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
  }, [clamped, reduced]);

  const tone =
    clamped >= 75 ? 'var(--accent-bright)' : clamped >= 50 ? 'var(--caution)' : 'var(--warn)';

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${ariaLabel} ${clamped} de 100`}
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
          {display}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
