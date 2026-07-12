'use client';
import { CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';
import type { CoverLetter, Length, Tone } from '@/lib/cover-letter';

const CV_KEY = 'jf_cv_profile';
const FAV_KEY = 'jf_favorites';
const RANKED_KEY = 'jf_ranked';
const LETTERS_KEY = 'jf_letters';

export function saveProfile(p: CVProfile) {
  localStorage.setItem(CV_KEY, JSON.stringify(p));
}
export function loadProfile(): CVProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CV_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function clearProfile() {
  localStorage.removeItem(CV_KEY);
  localStorage.removeItem(RANKED_KEY);
  // As cartas nasceram do CV antigo. Trocar de currículo e reabrir uma carta
  // escrita a partir do anterior seria pior do que não ter carta nenhuma.
  localStorage.removeItem(LETTERS_KEY);
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

function readLetters(): LetterMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LETTERS_KEY) ?? '{}') as LetterMap;
  } catch {
    return {};
  }
}

export function loadLetter(jobId: string): SavedLetter | null {
  return readLetters()[jobId] ?? null;
}

export function saveLetter(jobId: string, saved: SavedLetter) {
  const all = readLetters();
  all[jobId] = saved;
  try {
    localStorage.setItem(LETTERS_KEY, JSON.stringify(all));
  } catch {
    // localStorage cheio (ou modo privado do Safari). A carta continua na tela,
    // que é o que importa agora — só não sobrevive ao refresh.
    console.warn('[store] não foi possível salvar a carta');
  }
}

export function removeLetter(jobId: string) {
  const all = readLetters();
  delete all[jobId];
  localStorage.setItem(LETTERS_KEY, JSON.stringify(all));
}

/** Cache do último ranking para não re-chamar a IA ao navegar. */
export function saveRanked(jobs: RankedJob[]) {
  localStorage.setItem(RANKED_KEY, JSON.stringify(jobs));
}
export function loadRanked(): RankedJob[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(RANKED_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
}
export function toggleFavorite(jobId: string): string[] {
  const favs = new Set(getFavorites());
  if (favs.has(jobId)) favs.delete(jobId);
  else favs.add(jobId);
  const arr = [...favs];
  localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  return arr;
}
