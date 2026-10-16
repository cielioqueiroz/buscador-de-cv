import { describe, it, expect, vi, beforeEach } from 'vitest';

const { userQuery, userTransaction } = vi.hoisted(() => ({
  userQuery: vi.fn(),
  userTransaction: vi.fn(),
}));
vi.mock('@/lib/db/user-scope', () => ({ userQuery, userTransaction }));

import { loadCachedScores, loadRankedIds, loadRanking, loadSearch, saveRanking, saveScores, saveSearch } from '@/lib/jobs/store';

const job = {
  id: 'a', title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/a',
};
const match = { jobId: 'a', score: 80, reasons: [], gaps: [] };

beforeEach(() => {
  userQuery.mockReset();
  userTransaction.mockReset();
});

describe('lib/jobs/store', () => {
  it('grava a busca como jsonb, no escopo do usuário', async () => {
    userQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    await saveSearch('u1', [job as never]);
    const [userId, sql, params] = userQuery.mock.calls[0];
    expect(userId).toBe('u1');
    expect(sql).toContain('$2::jsonb');
    expect(JSON.parse(params[1])).toEqual([job]);
  });

  it('busca guardada inválida conta como inexistente (o jsonb não é confiável)', async () => {
    userQuery.mockResolvedValue({ rows: [{ jobs: [{ ...job, applyUrl: 'javascript:alert(1)' }] }], rowCount: 1 });
    expect(await loadSearch('u1')).toBeNull();
  });

  it('busca válida volta como lista de vagas', async () => {
    userQuery.mockResolvedValue({ rows: [{ jobs: [job] }], rowCount: 1 });
    expect(await loadSearch('u1')).toEqual([job]);
  });

  it('descarta nota em cache que não bate com a vaga da linha', async () => {
    userQuery.mockResolvedValue({
      rows: [
        { job_id: 'a', result: match },
        { job_id: 'b', result: { ...match, jobId: 'outra' } },
      ],
      rowCount: 2,
    });
    const scores = await loadCachedScores('u1', 'hash', ['a', 'b']);
    expect([...scores.keys()]).toEqual(['a']);
  });

  it('sem vagas pedidas nem vai ao banco', async () => {
    expect((await loadCachedScores('u1', 'hash', [])).size).toBe(0);
    expect(userQuery).not.toHaveBeenCalled();
  });

  it('grava as notas numa transação só, com a faxina das vencidas', async () => {
    userTransaction.mockResolvedValue([]);
    await saveScores('u1', 'hash', [match]);
    const [, queries] = userTransaction.mock.calls[0];
    expect(queries[0].text).toContain('delete from match_cache');
    expect(queries[1].params).toEqual(['u1', 'hash', 'a', JSON.stringify(match)]);
  });

  it('ranking corrompido volta null em vez de quebrar /resultados', async () => {
    userQuery.mockResolvedValue({ rows: [{ ranked: [{ lixo: true }] }], rowCount: 1 });
    expect(await loadRanking('u1')).toBeNull();
  });

  it('ranking salvo volta com as vagas novas e a data da busca', async () => {
    const updated = new Date('2026-10-10T12:00:00Z');
    userQuery.mockResolvedValue({
      rows: [{ ranked: [{ job, match }], new_ids: ['a'], updated_at: updated }],
      rowCount: 1,
    });
    expect(await loadRanking('u1')).toEqual({
      ranked: [{ job, match }],
      newIds: ['a'],
      updatedAt: updated.toISOString(),
    });
  });

  it('new_ids inválido não derruba o ranking: só some o aviso', async () => {
    userQuery.mockResolvedValue({
      rows: [{ ranked: [{ job, match }], new_ids: [{ x: 1 }], updated_at: new Date() }],
      rowCount: 1,
    });
    expect((await loadRanking('u1'))?.newIds).toEqual([]);
  });

  it('grava as vagas novas como text[] junto com o ranking', async () => {
    userQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    await saveRanking('u1', [{ job, match }] as never, ['a']);
    const [, sql, params] = userQuery.mock.calls[0];
    expect(sql).toContain('$3::text[]');
    expect(params[2]).toEqual(['a']);
  });

  it('ids do ranking anterior: null sem ranking, lista quando existe', async () => {
    userQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    expect(await loadRankedIds('u1')).toBeNull();
    userQuery.mockResolvedValueOnce({ rows: [{ ids: ['a', 'b'] }], rowCount: 1 });
    expect(await loadRankedIds('u1')).toEqual(['a', 'b']);
  });
});
