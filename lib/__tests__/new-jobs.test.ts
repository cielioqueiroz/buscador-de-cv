import { describe, it, expect } from 'vitest';
import { ALERT_MIN_SCORE, daysSince, newJobIds } from '@/lib/jobs/new-jobs';
import type { RankedJob } from '@/lib/ranked';

const r = (id: string, score: number) =>
  ({ job: { id }, match: { jobId: id, score, reasons: [], gaps: [] } }) as unknown as RankedJob;

describe('newJobIds', () => {
  it('só vagas fora do ranking anterior e com nota a partir do limiar', () => {
    const ranked = [r('velha', 95), r('nova-boa', ALERT_MIN_SCORE), r('nova-fraca', ALERT_MIN_SCORE - 1)];
    expect(newJobIds(['velha'], ranked)).toEqual(['nova-boa']);
  });

  it('sem ranking anterior nada é novo (primeira busca ou CV trocado)', () => {
    expect(newJobIds(null, [r('a', 99)])).toEqual([]);
  });

  it('ranking anterior vazio: toda vaga boa é nova', () => {
    expect(newJobIds([], [r('a', 80), r('b', 40)])).toEqual(['a']);
  });
});

describe('daysSince', () => {
  const now = Date.parse('2026-10-16T12:00:00Z');
  it('conta dias inteiros', () => {
    expect(daysSince('2026-10-13T11:00:00Z', now)).toBe(3);
    expect(daysSince('2026-10-16T08:00:00Z', now)).toBe(0);
  });
  it('null sem data ou com data inválida', () => {
    expect(daysSince(null, now)).toBeNull();
    expect(daysSince('ontem', now)).toBeNull();
  });
});
