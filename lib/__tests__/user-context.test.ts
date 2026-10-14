import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getProfile, findUserJob } = vi.hoisted(() => ({ getProfile: vi.fn(), findUserJob: vi.fn() }));
vi.mock('@/lib/auth/profile', () => ({ getProfile }));
vi.mock('@/lib/jobs/store', () => ({ findUserJob }));

import { requireProfile, requireProfileAndJob } from '@/lib/jobs/user-context';
import { ApiRequestError } from '@/lib/api/request';

const profile = { title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: ['x'], rawText: 'cv' };
const job = { id: 'j1', title: 'Dev' };

beforeEach(() => {
  getProfile.mockReset();
  findUserJob.mockReset();
});

describe('user-context', () => {
  it('devolve perfil e vaga lidos do servidor', async () => {
    getProfile.mockResolvedValue(profile);
    findUserJob.mockResolvedValue(job);
    expect(await requireProfileAndJob('u1', 'j1')).toEqual({ profile, job });
    expect(findUserJob).toHaveBeenCalledWith('u1', 'j1');
  });

  it('sem CV salvo: 409 com orientação', async () => {
    getProfile.mockResolvedValue(null);
    const err = await requireProfile('u1').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect((err as ApiRequestError).status).toBe(409);
  });

  it('vaga que o usuário nunca viu: 404, e a IA não é chamada', async () => {
    getProfile.mockResolvedValue(profile);
    findUserJob.mockResolvedValue(null);
    const err = await requireProfileAndJob('u1', 'inventada').catch((e: unknown) => e);
    expect((err as ApiRequestError).status).toBe(404);
  });
});
