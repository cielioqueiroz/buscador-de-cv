import { describe, it, expect, vi, beforeEach } from 'vitest';

const { userQuery } = vi.hoisted(() => ({ userQuery: vi.fn() }));
vi.mock('@/lib/db/user-scope', () => ({ userQuery }));

import { getDashboardStats } from '@/lib/auth/dashboard';

beforeEach(() => userQuery.mockReset());

describe('getDashboardStats', () => {
  it('converte a linha do banco nos números do painel', async () => {
    userQuery.mockResolvedValue({
      rows: [{
        applied: 2, interviews: 1, offers: 0, favorites: 3,
        profile_updated_at: new Date('2026-10-16T12:00:00Z'),
        new_jobs: 4,
        ranking_updated_at: new Date('2026-10-17T09:00:00Z'),
      }],
    });
    expect(await getDashboardStats('u1')).toEqual({
      applied: 2, interviews: 1, offers: 0, favorites: 3,
      profileUpdatedAt: '2026-10-16T12:00:00.000Z',
      newJobs: 4,
      rankingUpdatedAt: '2026-10-17T09:00:00.000Z',
    });
  });

  it('conta nova, sem nada: zeros e datas nulas', async () => {
    userQuery.mockResolvedValue({ rows: [{}] });
    expect(await getDashboardStats('u1')).toMatchObject({ applied: 0, newJobs: 0, profileUpdatedAt: null, rankingUpdatedAt: null });
  });

  it('roda no escopo do usuário (RLS) e não conta vaga nova já descartada', async () => {
    userQuery.mockResolvedValue({ rows: [{}] });
    await getDashboardStats('u1');
    const [userId, sql] = userQuery.mock.calls[0];
    expect(userId).toBe('u1');
    expect(sql).toMatch(/unnest\(r\.new_ids\)/);
    expect(sql).toMatch(/not exists \(select 1 from job_dismissals/);
  });
});
