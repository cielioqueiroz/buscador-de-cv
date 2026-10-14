import { FiTrendingUp } from 'react-icons/fi';
import type { MissingSkill } from '@/lib/skills-gap';

/**
 * "O que estudar a seguir", tirado das próprias vagas: as habilidades que mais
 * faltam no CV somando o ranking inteiro. Some quando não há padrão a mostrar.
 */
export function SkillsGap({ skills, total }: { skills: MissingSkill[]; total: number }) {
  if (skills.length === 0) return null;
  return (
    <section
      aria-labelledby="skills-gap-title"
      className="rounded-card border border-border bg-surface p-5"
    >
      <h2 id="skills-gap-title" className="flex items-center gap-2 font-display text-base font-bold">
        <FiTrendingUp className="h-4 w-4 text-accent-ink" aria-hidden />
        O que mais falta no seu CV para estas vagas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Somando as {total} vagas. Se você já tem alguma dessas, vale deixar explícito no currículo.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {skills.map(({ skill, count }) => (
          <li
            key={skill}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-sm transition-colors hover:border-foreground/30"
          >
            <span className="font-medium">{skill}</span>
            <span className="font-mono text-xs text-muted">
              {count} de {total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
