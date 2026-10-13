// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('@/lib/db/user-scope');

const { state, clientQuery, release, transaction, neonQuery } = vi.hoisted(() => ({
  state: { neon: false },
  clientQuery: vi.fn(),
  release: vi.fn(),
  transaction: vi.fn(),
  neonQuery: vi.fn((text: string, params?: unknown[]) => ({ text, params })),
}));

vi.mock('@/lib/db/client', () => ({
  get isNeonUrl() { return state.neon; },
  get connectionString() { return state.neon ? 'postgres://u@ep-x.neon.tech/db' : undefined; },
  pool: { connect: async () => ({ query: clientQuery, release }) },
}));
vi.mock('@neondatabase/serverless', () => ({
  neon: () => Object.assign(() => {}, { query: neonQuery, transaction }),
}));

import { userQuery, userTransaction } from '@/lib/db/user-scope';

beforeEach(() => {
  clientQuery.mockReset();
  clientQuery.mockResolvedValue({ rows: [{ ok: 1 }], rowCount: 1 });
  release.mockReset();
  transaction.mockReset();
  neonQuery.mockClear();
});

describe('userQuery (Postgres comum)', () => {
  it('troca de role e define o usuário antes da consulta, na mesma transação', async () => {
    state.neon = false;
    const r = await userQuery('u1', 'select * from favorites where user_id = $1', ['u1']);
    expect(r).toEqual({ rows: [{ ok: 1 }], rowCount: 1 });
    expect(clientQuery.mock.calls.map((c) => c[0])).toEqual([
      'begin',
      'set local role vaga_certa_rls',
      "select set_config('app.user_id', $1, true)",
      'select * from favorites where user_id = $1',
      'commit',
    ]);
    expect(clientQuery.mock.calls[2][1]).toEqual(['u1']);
    expect(release).toHaveBeenCalled();
  });

  it('desfaz a transação e devolve a conexão se a consulta falhar', async () => {
    state.neon = false;
    clientQuery.mockImplementation(async (text: string) => {
      if (text.startsWith('insert')) throw new Error('violates row-level security');
      return { rows: [], rowCount: 0 };
    });
    await expect(userQuery('u1', 'insert into favorites values ($1)', ['u2'])).rejects.toThrow(/row-level/);
    expect(clientQuery.mock.calls.map((c) => c[0])).toContain('rollback');
    expect(release).toHaveBeenCalled();
  });

  it('recusa chamada sem usuário', async () => {
    await expect(userQuery('', 'select 1')).rejects.toThrow();
  });
});

describe('userTransaction (Neon via HTTP)', () => {
  it('manda escopo e consultas numa transação só e devolve só os resultados das consultas', async () => {
    state.neon = true;
    transaction.mockResolvedValue([
      { rows: [], rowCount: 0 },
      { rows: [{ set_config: 'u1' }], rowCount: 1 },
      { rows: [{ a: 1 }], rowCount: 1 },
      { rows: [], rowCount: 2 },
    ]);
    const out = await userTransaction('u1', [
      { text: 'select a from cv_profiles where user_id = $1', params: ['u1'] },
      { text: 'delete from favorites where user_id = $1', params: ['u1'] },
    ]);
    expect(transaction).toHaveBeenCalledTimes(1);
    const sent = transaction.mock.calls[0][0] as { text: string; params: unknown[] }[];
    expect(sent.map((q) => q.text)).toEqual([
      'set local role vaga_certa_rls',
      "select set_config('app.user_id', $1, true)",
      'select a from cv_profiles where user_id = $1',
      'delete from favorites where user_id = $1',
    ]);
    expect(sent[1].params).toEqual(['u1']);
    expect(out).toEqual([{ rows: [{ a: 1 }], rowCount: 1 }, { rows: [], rowCount: 2 }]);
  });
});
