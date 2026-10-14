'use client';

/**
 * Adapter que roteia leitura e escrita de estado do navegador para o backend
 * quando há sessão, ou para o localStorage quando não há. Os componentes
 * continuam escrevendo "listar", "salvar", "mudar estágio" — a decisão sobre
 * onde isso vai ficar guardado deixa de ser deles.
 *
 * O retorno das escritas sempre inclui a lista atualizada: assim o chamador
 * pode setar o state sem precisar fazer um read-after-write.
 */

import type { Application, ApplicationStage } from '@/lib/application-schema';
import type { SavedLetter } from '@/lib/letter-schema';
import type { RankedJob } from '@/lib/ranked';
import type { DismissReason } from '@/lib/dismiss-reasons';
import {
  listApplications as listLocalApplications,
  removeApplication as removeLocalApplication,
  saveApplication as saveLocalApplication,
  updateApplicationStage as updateLocalApplicationStage,
} from '@/lib/applications';
import {
  FAVORITES_EVENT,
  getFavorites as getLocalFavorites,
  loadLetter as loadLocalLetter,
  saveLetter as saveLocalLetter,
  toggleFavorite as toggleLocalFavorite,
} from '@/lib/store';

async function readJson<T>(res: Response, fallback: T): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'Falha na requisição.');
  const json = await res.json().catch(() => fallback);
  return json as T;
}

// ---------- DESCARTES ----------
// Só existem na conta: a vaga descartada também deixa de ser pontuada no
// servidor, o que o localStorage não teria como fazer.

export async function dismissJobRemote(jobId: string, reason: DismissReason): Promise<void> {
  await readJson(
    await fetch('/api/sync/dismissals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, reason }),
    }),
    {},
  );
}

export async function undismissJobRemote(jobId: string): Promise<void> {
  await readJson(
    await fetch('/api/sync/dismissals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }),
    {},
  );
}

// ---------- APPLICATIONS ----------

export async function fetchApplications(authed: boolean): Promise<Application[]> {
  if (!authed) return listLocalApplications();
  const res = await fetch('/api/sync/applications', { cache: 'no-store' });
  if (res.status === 401) return listLocalApplications();
  const json = await readJson<{ applications: Application[] }>(res, { applications: [] });
  return json.applications;
}

export async function saveApplicationStore(
  authed: boolean,
  ranked: RankedJob,
): Promise<Application[]> {
  if (!authed) {
    saveLocalApplication(ranked);
    return listLocalApplications();
  }
  const now = Date.now();
  const application: Application = {
    id: ranked.job.id,
    job: ranked.job,
    match: ranked.match,
    stage: 'aplicado',
    createdAt: now,
    updatedAt: now,
  };
  const res = await fetch('/api/sync/applications', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ application }),
  });
  await readJson(res, {});
  return fetchApplications(true);
}

export async function updateApplicationStageStore(
  authed: boolean,
  jobId: string,
  stage: ApplicationStage,
): Promise<Application[]> {
  if (!authed) return updateLocalApplicationStage(jobId, stage);
  const res = await fetch(`/api/sync/applications/${encodeURIComponent(jobId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ stage }),
  });
  await readJson(res, {});
  return fetchApplications(true);
}

export async function removeApplicationStore(
  authed: boolean,
  jobId: string,
): Promise<Application[]> {
  if (!authed) return removeLocalApplication(jobId);
  const res = await fetch(`/api/sync/applications/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  });
  await readJson(res, {});
  return fetchApplications(true);
}

// Checagem leve usada só para decidir rótulos (ex.: "Acompanhando").
// Lê do cache passado em vez de bater no servidor por card.
export function applicationExists(
  applications: Application[],
  jobId: string,
): boolean {
  return applications.some((a) => a.id === jobId);
}

// ---------- FAVORITES ----------

export async function fetchFavorites(authed: boolean): Promise<string[]> {
  if (!authed) return getLocalFavorites();
  const res = await fetch('/api/sync/favorites', { cache: 'no-store' });
  if (res.status === 401) return getLocalFavorites();
  const json = await readJson<{ favorites: string[] }>(res, { favorites: [] });
  return json.favorites;
}

export async function toggleFavoriteStore(
  authed: boolean,
  jobId: string,
  currentlyOn: boolean,
): Promise<string[]> {
  if (!authed) return toggleLocalFavorite(jobId);
  const res = await fetch('/api/sync/favorites', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jobId, on: !currentlyOn }),
  });
  await readJson(res, {});
  const favs = await fetchFavorites(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: favs }));
  }
  return favs;
}

// ---------- LETTERS ----------

export async function fetchLetter(
  authed: boolean,
  jobId: string,
): Promise<SavedLetter | null> {
  if (!authed) return loadLocalLetter(jobId);
  const res = await fetch(
    `/api/sync/letters/${encodeURIComponent(jobId)}`,
    { cache: 'no-store' },
  );
  if (res.status === 404 || res.status === 401) return loadLocalLetter(jobId);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({ letter: null }))) as { letter: SavedLetter | null };
  return json.letter;
}

export async function saveLetterStore(
  authed: boolean,
  jobId: string,
  saved: SavedLetter,
): Promise<void> {
  if (!authed) {
    saveLocalLetter(jobId, saved);
    return;
  }
  const res = await fetch(`/api/sync/letters/${encodeURIComponent(jobId)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(saved),
  });
  await readJson(res, {});
}
