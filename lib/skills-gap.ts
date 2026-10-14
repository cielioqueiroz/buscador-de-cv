import type { RankedJob } from '@/lib/ranked';

export interface MissingSkill {
  /** Como apareceu na primeira vaga que a citou. */
  skill: string;
  /** Em quantas vagas do ranking ela falta. */
  count: number;
}

function key(skill: string): string {
  return skill
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * As habilidades que mais faltam no CV somando todas as vagas do ranking —
 * "Docker falta em 8 das 15" diz mais do que 15 listas de lacunas soltas.
 * Só entra o que se repete (`minCount`): uma lacuna de uma vaga só é ruído.
 */
export function topMissingSkills(ranked: RankedJob[], limit = 6, minCount = 2): MissingSkill[] {
  const tally = new Map<string, MissingSkill>();
  for (const { match } of ranked) {
    // A mesma vaga citando "Docker" duas vezes conta uma vez só.
    const seen = new Set<string>();
    for (const skill of match.missingSkills ?? []) {
      const k = key(skill);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const entry = tally.get(k);
      if (entry) entry.count += 1;
      else tally.set(k, { skill: skill.trim(), count: 1 });
    }
  }
  return [...tally.values()]
    .filter((s) => s.count >= minCount)
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill, 'pt-BR'))
    .slice(0, limit);
}
