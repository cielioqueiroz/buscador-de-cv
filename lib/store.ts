'use client';
import { CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

const CV_KEY = 'jf_cv_profile';
const FAV_KEY = 'jf_favorites';
const RANKED_KEY = 'jf_ranked';

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
