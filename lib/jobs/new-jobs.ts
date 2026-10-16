import type { RankedJob } from '@/lib/ranked';

/**
 * O "alerta" de vagas novas, dentro do app: não há busca em segundo plano (cada
 * busca gasta cota da IA e das fontes), então "nova" é a vaga que apareceu na
 * busca mais recente e não estava na anterior. Parte pura — roda também no
 * navegador.
 */

/** Nota mínima para uma vaga nova merecer destaque. */
export const ALERT_MIN_SCORE = 70;

/** A partir de quantos dias a lista salva merece um convite a buscar de novo. */
export const STALE_AFTER_DAYS = 3;

/**
 * Vagas com nota alta que não estavam no ranking anterior. Sem ranking anterior
 * (primeira busca, CV trocado) nada é "novo": tudo seria, e o aviso não diria nada.
 */
export function newJobIds(previousIds: readonly string[] | null, ranked: readonly RankedJob[]): string[] {
  if (!previousIds) return [];
  const seen = new Set(previousIds);
  return ranked
    .filter((r) => r.match.score >= ALERT_MIN_SCORE && !seen.has(r.job.id))
    .map((r) => r.job.id);
}

/** Dias inteiros desde a última busca; null quando ainda não houve nenhuma. */
export function daysSince(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((now - at) / 86_400_000));
}
