'use client';
import dynamic from 'next/dynamic';

/**
 * O three.js entra por aqui e só por aqui.
 *
 * `ssr: false` num Server Component é proibido no App Router, e a home é
 * server. Este wrapper client existe para segurar o `dynamic` — assim o herói
 * continua sendo renderizado no servidor (texto, CTA, upload: tudo no HTML
 * inicial) e o campo 3D chega depois, sem entrar no caminho do LCP.
 */
export const HeroFieldLazy = dynamic(
  () => import('./HeroField').then((m) => m.HeroField),
  { ssr: false },
);
