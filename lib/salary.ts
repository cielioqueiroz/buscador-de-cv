import type { Job } from '@/lib/providers/types';

type Salary = NonNullable<Job['salary']>;
export type SalaryPeriod = NonNullable<Salary['period']>;

const SUFIXO: Record<SalaryPeriod, string> = {
  hour: '/hora',
  day: '/dia',
  week: '/semana',
  month: '/mês',
  year: '/ano',
};

/** Quantas vezes o período cabe num mês (jornada de 44h semanais da CLT). */
const POR_MES: Record<SalaryPeriod, number> = {
  hour: 176,
  day: 22,
  week: 52 / 12,
  month: 1,
  year: 1 / 12,
};

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    // Código de moeda que o Intl não conhece: mostra cru, sem inventar símbolo.
    return `${currency} ${Math.round(value).toLocaleString('pt-BR')}`;
  }
}

/**
 * "R$ 5.000 – R$ 9.000/mês". O período só aparece quando a fonte o informa:
 * antes a tela cravava "/mês" em tudo, inclusive em valores que a fonte não
 * dizia se eram mensais ou anuais.
 */
export function formatSalary(salary: Salary): string | null {
  const { min, max, currency, period } = salary;
  if (min === undefined && max === undefined) return null;
  const faixa =
    min !== undefined && max !== undefined && min !== max
      ? `${money(min, currency)} – ${money(max, currency)}`
      : money((max ?? min)!, currency);
  return period ? `${faixa}${SUFIXO[period]}` : faixa;
}

/**
 * Valor mensal aproximado, só para ordenar. Sem período informado, usa o valor
 * como veio — não há como converter o que não se sabe. Moedas diferentes não
 * são convertidas: numa busca, as vagas vêm do mesmo país.
 */
export function monthlySalary(job: Job): number | null {
  const s = job.salary;
  if (!s) return null;
  const value = s.max ?? s.min;
  if (value === undefined) return null;
  return s.period ? value * POR_MES[s.period] : value;
}
