'use client';
import { useSyncExternalStore } from 'react';

/**
 * Leituras do navegador que não existem no servidor. Com useSyncExternalStore
 * o servidor e a hidratação usam o valor "de servidor" e o React troca para o
 * valor real logo depois — sem o setState-em-efeito que dispara uma segunda
 * renderização em cascata.
 */

const noSubscribe = () => () => {};

/** `false` no servidor e na hidratação; `true` depois, no navegador. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** Preferência "reduzir movimento" do sistema, acompanhando mudanças ao vivo. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Pediu economia de dados ou está numa conexão lenta (2G/3G)? Lido uma vez:
 * serve para decidir se vale baixar enfeites pesados.
 */
export function prefersLightweight(nav: Navigator = navigator): boolean {
  const conn = (nav as Navigator & { connection?: NetworkInformation }).connection;
  if (!conn) return false;
  return conn.saveData === true || ['slow-2g', '2g', '3g'].includes(conn.effectiveType ?? '');
}

/** `false` no servidor e na hidratação; no navegador, o resultado de prefersLightweight. */
export function usePrefersLightweight(): boolean {
  return useSyncExternalStore(noSubscribe, () => prefersLightweight(), () => false);
}
