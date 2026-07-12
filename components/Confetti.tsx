'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Uma chuva curta de confete quando o topo do ranking é um match forte (≥ 90).
 *
 * Regras que impedem isso de virar praga:
 * - dispara UMA vez por sessão (sessionStorage), não a cada re-render nem a cada
 *   filtro aplicado;
 * - some sozinho em ~3s e se remove do DOM;
 * - `prefers-reduced-motion` cancela;
 * - é `pointer-events: none` — nunca fica entre o usuário e o botão de candidatura.
 */

const CHAVE = 'jf_confete';
const QTD = 42;

interface Peca {
  id: number;
  left: number;
  dx: number;
  spin: number;
  dur: number;
  delay: number;
  size: number;
  cor: string;
}

const CORES = ['var(--accent-bright)', '#4d7c0f', '#eab308', 'var(--foreground)'];

export function Confetti({ ativo }: { ativo: boolean }) {
  const [pecas, setPecas] = useState<Peca[] | null>(null);

  useEffect(() => {
    if (!ativo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (sessionStorage.getItem(CHAVE)) return;
    sessionStorage.setItem(CHAVE, '1');

    setPecas(
      Array.from({ length: QTD }, (_, id) => ({
        id,
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 240,
        spin: 360 + Math.random() * 720,
        dur: 2.2 + Math.random() * 1.4,
        delay: Math.random() * 0.5,
        size: 6 + Math.random() * 6,
        cor: CORES[id % CORES.length],
      })),
    );

    const t = setTimeout(() => setPecas(null), 4200);
    return () => clearTimeout(t);
  }, [ativo]);

  if (!pecas) return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[55] overflow-hidden print:hidden">
      {pecas.map((p) => (
        <span
          key={p.id}
          className="confete"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.cor,
            animationDelay: `${p.delay}s`,
            ['--dx' as string]: `${p.dx}px`,
            ['--spin' as string]: `${p.spin}deg`,
            ['--dur' as string]: `${p.dur}s`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
