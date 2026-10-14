import { describe, it, expect } from 'vitest';
import { formatSalary, monthlySalary } from '@/lib/salary';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import type { Job } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/ranked';

// O Intl usa espaço não separável depois de "R$"; normalizamos para comparar.
const plain = (s: string | null) => s?.replace(/ /g, ' ');

const job = (id: string, salary?: Job['salary'], score = 50): RankedJob => ({
  job: {
    id, title: 'Dev', company: 'A', location: 'SP', remote: false,
    description: 'd', source: 'jsearch', applyUrl: 'https://x.com/' + id, salary,
  },
  match: { jobId: id, score, reasons: [], gaps: [] },
});

describe('formatSalary', () => {
  it('mostra o período só quando a fonte informa', () => {
    expect(plain(formatSalary({ min: 5000, max: 9000, currency: 'BRL', period: 'month' }))).toBe('R$ 5.000 – R$ 9.000/mês');
    expect(plain(formatSalary({ min: 5000, max: 9000, currency: 'BRL' }))).toBe('R$ 5.000 – R$ 9.000');
  });

  it('usa a moeda da vaga, não sempre real', () => {
    expect(plain(formatSalary({ max: 120000, currency: 'USD', period: 'year' }))).toBe('US$ 120.000/ano');
  });

  it('moeda desconhecida aparece crua, sem inventar símbolo', () => {
    expect(formatSalary({ min: 10, currency: 'XYZ1' })).toBe('XYZ1 10');
  });

  it('sem valores, nada a mostrar', () => {
    expect(formatSalary({ currency: 'BRL' })).toBeNull();
  });
});

describe('monthlySalary', () => {
  it('converte para mês quando sabe o período', () => {
    expect(monthlySalary(job('a', { max: 120000, currency: 'BRL', period: 'year' }).job)).toBe(10000);
    expect(monthlySalary(job('b', { min: 50, currency: 'BRL', period: 'hour' }).job)).toBe(8800);
    expect(monthlySalary(job('c', { min: 7000, currency: 'BRL' }).job)).toBe(7000);
    expect(monthlySalary(job('d').job)).toBeNull();
  });
});

describe('filtros de salário', () => {
  const lista = [
    job('sem', undefined, 99),
    job('baixo', { min: 3000, currency: 'BRL', period: 'month' }, 70),
    job('alto', { max: 240000, currency: 'BRL', period: 'year' }, 60),
  ];

  it('"Só com salário informado" tira as vagas sem salário', () => {
    const out = applyFilters(lista, { ...DEFAULT_FILTERS, salaryOnly: true });
    expect(out.map((r) => r.job.id).sort()).toEqual(['alto', 'baixo']);
  });

  it('"Maior salário" compara pelo valor mensal e põe sem salário no fim', () => {
    const out = applyFilters(lista, { ...DEFAULT_FILTERS, order: 'salary' });
    expect(out.map((r) => r.job.id)).toEqual(['alto', 'baixo', 'sem']);
  });
});
