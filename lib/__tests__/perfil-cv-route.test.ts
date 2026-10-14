import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  sessionUserId: vi.fn(),
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  clearRanking: vi.fn(),
}));
vi.mock('@/lib/api/auth-guard', async () => {
  const real = await vi.importActual<typeof import('@/lib/api/auth-guard')>('@/lib/api/auth-guard');
  return { ...real, sessionUserId: m.sessionUserId };
});
vi.mock('@/lib/auth/profile', async () => {
  const real = await vi.importActual<typeof import('@/lib/auth/profile')>('@/lib/auth/profile');
  return { ...real, getProfile: m.getProfile, upsertProfile: m.upsertProfile };
});
vi.mock('@/lib/jobs/store', () => ({ clearRanking: m.clearRanking }));
vi.mock('@/lib/db/client', () => ({ pool: { query: vi.fn() } }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));

import { PUT } from '@/app/api/perfil/cv/route';

const current = {
  title: 'Dev', seniority: 'junior', skills: ['React'], areas: [], searchQueries: ['react'], rawText: 'CV ORIGINAL',
};
const edit = {
  title: 'Dev Front-end', seniority: 'pleno', skills: ['React', 'react', 'TypeScript'], areas: ['web'],
  searchQueries: ['react pleno'],
};

function put(body: unknown) {
  return new Request('http://x/api/perfil/cv', { method: 'PUT', body: JSON.stringify(body) });
}

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset();
  m.sessionUserId.mockResolvedValue('u1');
  m.getProfile.mockResolvedValue(current);
  m.upsertProfile.mockResolvedValue(undefined);
  m.clearRanking.mockResolvedValue(undefined);
});

describe('PUT /api/perfil/cv', () => {
  it('salva a correção mantendo o texto original do CV e descarta o ranking', async () => {
    const res = await PUT(put({ ...edit, rawText: 'tentativa de trocar o CV' }));
    expect(res.status).toBe(200);
    const [userId, saved] = m.upsertProfile.mock.calls[0];
    expect(userId).toBe('u1');
    expect(saved.rawText).toBe('CV ORIGINAL');
    // repetidos sem caixa viram um só
    expect(saved.skills).toEqual(['React', 'TypeScript']);
    expect(m.clearRanking).toHaveBeenCalledWith('u1');
  });

  it('sem CV salvo, 409', async () => {
    m.getProfile.mockResolvedValue(null);
    expect((await PUT(put(edit))).status).toBe(409);
    expect(m.upsertProfile).not.toHaveBeenCalled();
  });

  it('sem buscas, 400 (precisa de pelo menos uma)', async () => {
    expect((await PUT(put({ ...edit, searchQueries: [] }))).status).toBe(400);
  });

  it('sem sessão, 401', async () => {
    m.sessionUserId.mockResolvedValue(null);
    expect((await PUT(put(edit))).status).toBe(401);
  });
});
