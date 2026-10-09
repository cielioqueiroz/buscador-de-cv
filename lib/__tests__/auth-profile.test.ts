import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));

import { getProfile, upsertProfile } from '@/lib/auth/profile';

const profileFixture = {
  title: 'Dev Front-end',
  seniority: 'pleno' as const,
  skills: ['react', 'typescript'],
  areas: ['frontend'],
  searchQueries: ['react pleno', 'frontend typescript'],
  rawText: 'texto do CV',
};

beforeEach(() => {
  queryMock.mockReset();
});

describe('getProfile', () => {
  it('devolve null quando o usuário não tem perfil', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await getProfile('u1')).toBeNull();
  });

  it('converte snake_case do banco em CVProfile validado', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          title: profileFixture.title,
          seniority: profileFixture.seniority,
          skills: profileFixture.skills,
          areas: profileFixture.areas,
          search_queries: profileFixture.searchQueries,
          raw_text: profileFixture.rawText,
        },
      ],
    });
    const got = await getProfile('u1');
    expect(got).toEqual(profileFixture);
  });
});

describe('upsertProfile', () => {
  it('insere com todos os campos do perfil', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await upsertProfile('u1', profileFixture);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('insert into cv_profiles'),
      [
        'u1',
        profileFixture.title,
        profileFixture.seniority,
        profileFixture.skills,
        profileFixture.areas,
        profileFixture.searchQueries,
        profileFixture.rawText,
      ],
    );
  });
});
