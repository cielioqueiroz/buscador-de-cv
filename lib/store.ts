'use client';
import { z } from 'zod';
import { CVProfile } from '@/lib/providers/types';
import { CVProfileSchema } from '@/lib/providers/types';
import { RankedJobSchema, type RankedJob } from '@/lib/matching';
import type { CoverLetter, Length, Tone } from '@/lib/cover-letter';
import { CoverLetterSchema, LengthEnum, ToneEnum } from '@/lib/cover-letter';

const CV_KEY = 'jf_cv_profile';
const FAV_KEY = 'jf_favorites';
const RANKED_KEY = 'jf_ranked';
const LETTERS_KEY = 'jf_letters';

export function saveProfile(p: CVProfile) {
  safeSet(CV_KEY, JSON.stringify(p));
}
export function loadProfile(): CVProfile | null {
  if (typeof window === 'undefined') return null;
  return readValidated(CV_KEY, CVProfileSchema);
}
export function clearProfile() {
  safeRemove(CV_KEY);
  safeRemove(RANKED_KEY);
  // As cartas nasceram do CV antigo. Trocar de currículo e reabrir uma carta
  // escrita a partir do anterior seria pior do que não ter carta nenhuma.
  safeRemove(LETTERS_KEY);
}

/**
 * Cartas escritas, indexadas por vaga.
 *
 * Guardar é o que permite fechar o painel e voltar sem pagar outra chamada à
 * IA — e é também o que preserva a edição do usuário: o texto salvo é o que
 * está na tela, não o que o modelo devolveu.
 */
export interface SavedLetter {
  letter: CoverLetter;
  /** O texto como o usuário deixou (pode ter sido editado à mão). */
  text: string;
  tone: Tone;
  length: Length;
  savedAt: number;
}

type LetterMap = Record<string, SavedLetter>;

const SavedLetterSchema = z.object({
  letter: CoverLetterSchema,
  text: z.string().max(12_000),
  tone: ToneEnum,
  length: LengthEnum,
  savedAt: z.number().finite(),
});

const LetterMapSchema = z.record(z.string().max(500), SavedLetterSchema);

function readLetters(): LetterMap {
  if (typeof window === 'undefined') return {};
  return readValidated(LETTERS_KEY, LetterMapSchema) ?? {};
}

export function loadLetter(jobId: string): SavedLetter | null {
  return readLetters()[jobId] ?? null;
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

/** Cache do último ranking para não re-chamar a IA ao navegar. */
export function saveRanked(jobs: RankedJob[]) {
  safeSet(RANKED_KEY, JSON.stringify(jobs));
}
export function loadRanked(): RankedJob[] | null {
  if (typeof window === 'undefined') return null;
  return readValidated(RANKED_KEY, z.array(RankedJobSchema).max(200));
}

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
  return arr;
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

function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* storage indisponível */ }
}
