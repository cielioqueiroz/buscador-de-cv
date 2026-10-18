'use client';
import dynamic from 'next/dynamic';
import { useIsClient, usePrefersLightweight, usePrefersReducedMotion } from '@/lib/client/browser-state';

/**
 * O three.js entra por aqui e só por aqui.
 *
 * `ssr: false` num Server Component é proibido no App Router, e a home é
 * server. Este wrapper client existe para segurar o `dynamic` — assim o herói
 * continua sendo renderizado no servidor (texto, CTA, upload: tudo no HTML
 * inicial) e o campo 3D chega depois, sem entrar no caminho do LCP.
 */
const HeroField = dynamic(
  () => import('./HeroField').then((m) => m.HeroField),
  { ssr: false },
);

/**
 * Decide ANTES de baixar: o pedaço do three.js tem ~500 KB minificado. Quem
 * pediu movimento reduzido não veria o campo (ele não monta), e quem está com
 * economia de dados ou em 2G/3G pagaria o download por um enfeite.
 */
export function HeroFieldLazy() {
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  const lightweight = usePrefersLightweight();
  if (!isClient || reducedMotion || lightweight) return null;
  return <HeroField />;
}
