'use client';
import { useRef } from 'react';

/**
 * O elemento se inclina de leve na direção do cursor e volta ao sair.
 *
 * O deslocamento é minúsculo de propósito (teto de ~10px): o efeito tem que ser
 * sentido, não notado. Botão que foge do dedo é botão irritante.
 *
 * Escreve `--mx`/`--my` direto no style, sem estado do React — um `setState` a
 * cada `pointermove` re-renderizaria a árvore inteira dezenas de vezes por
 * segundo por causa de uma animação decorativa.
 */
export function Magnetic({
  children,
  strength = 0.28,
  max = 10,
}: {
  children: React.ReactNode;
  strength?: number;
  max?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(e: React.PointerEvent) {
    const el = ref.current?.firstElementChild as HTMLElement | undefined;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;

    el.style.setProperty('--mx', `${Math.max(-max, Math.min(max, dx))}px`);
    el.style.setProperty('--my', `${Math.max(-max, Math.min(max, dy))}px`);
    el.classList.add('magnetic');
  }

  function onLeave() {
    const el = ref.current?.firstElementChild as HTMLElement | undefined;
    if (!el) return;
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
  }

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-block"
    >
      {children}
    </span>
  );
}
