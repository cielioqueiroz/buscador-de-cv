'use client';
import { z } from 'zod';
import { LetterMapSchema, type SavedLetter } from '@/lib/letter-schema';
export type { SavedLetter } from '@/lib/letter-schema';

import {
  FAV_KEY,
  LEGACY_CV_KEY,
  LEGACY_RANKED_KEY,
  LETTERS_KEY,
  safeRemove,
} from '@/lib/client/local-data';
export { clearLocalUserData } from '@/lib/client/local-data';

const REGION_KEY = 'jf_region';

/**
 * CV novo: as cartas guardadas aqui nasceram do anterior, e reabrir uma delas
 * seria pior do que não ter carta nenhuma.
 */
export function forgetCVDerivedData() {
  safeRemove(LETTERS_KEY);
  safeRemove(LEGACY_CV_KEY);
  safeRemove(LEGACY_RANKED_KEY);
}

type LetterMap = Record<string, SavedLetter>;

function readLetters(): LetterMap {
  if (typeof window === 'undefined') return {};
  return readValidated(LETTERS_KEY, LetterMapSchema) ?? {};
}

export function loadLetter(jobId: string): SavedLetter | null {
  return readLetters()[jobId] ?? null;
}

export function loadAllLetters(): Record<string, SavedLetter> {
  return readLetters();
}

export function saveLetter(jobId: string, saved: SavedLetter) {
  const all = readLetters();
  all[jobId] = saved;
  try {
    safeSet(LETTERS_KEY, JSON.stringify(all));
  } catch {
    // localStorage cheio (ou modo privado do Safari). A carta continua na tela,
    // que é o que importa agora — só não sobrevive ao refresh.
    console.warn('[store] não foi possível salvar a carta');
  }
}

export function removeLetter(jobId: string) {
  const all = readLetters();
  delete all[jobId];
  safeSet(LETTERS_KEY, JSON.stringify(all));
}

/**
 * Disparado quando a lista de favoritos muda. A tela de resultados ouve este
 * evento para que o filtro "só favoritas" reaja no mesmo instante em que o
 * coração é clicado num card — o localStorage sozinho não avisa o React.
 */
export const FAVORITES_EVENT = 'jf:favorites';

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  return readValidated(FAV_KEY, z.array(z.string().min(1).max(500)).max(500)) ?? [];
}
export function toggleFavorite(jobId: string): string[] {
  const favs = new Set(getFavorites());
  if (favs.has(jobId)) favs.delete(jobId);
  else favs.add(jobId);
  const arr = [...favs];
  safeSet(FAV_KEY, JSON.stringify(arr));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: arr }));
  }
  return arr;
}

/**
 * Última região escolhida nos filtros. Sem isto, voltar para /resultados (ou
 * recarregar) esquecia o estado/cidade e reabria em "qualquer lugar" — mesmo
 * com o ranking daquela região ainda em cache.
 */
export interface SavedRegion {
  escopo: 'br' | 'intl' | 'any';
  uf: string;
  cidade: string;
  pais: string;
}

const RegionSchema = z.object({
  escopo: z.enum(['br', 'intl', 'any']),
  uf: z.string().max(4),
  cidade: z.string().max(120),
  pais: z.string().max(4),
});

export function loadRegion(): SavedRegion | null {
  if (typeof window === 'undefined') return null;
  return readValidated(REGION_KEY, RegionSchema);
}

export function saveRegion(region: SavedRegion) {
  safeSet(REGION_KEY, JSON.stringify(region));
}

function readValidated<T>(key: string, schema: z.ZodType<T>): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    localStorage.removeItem(key);
  } catch {
    try { localStorage.removeItem(key); } catch { /* storage indisponível */ }
  }
  return null;
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn(`[store] não foi possível salvar ${key}`);
    return false;
  }
}
