import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  sessionUserId: vi.fn(),
  dismissJob: vi.fn(),
  undismissJob: vi.fn(),
  listDismissedIds: vi.fn(),
}));
vi.mock('@/lib/api/auth-guard', async () => {
  const real = await vi.importActual<typeof import('@/lib/api/auth-guard')>('@/lib/api/auth-guard');
  return { ...real, sessionUserId: m.sessionUserId };
});
vi.mock('@/lib/jobs/dismissals', () => ({
  dismissJob: m.dismissJob,
  undismissJob: m.undismissJob,
  listDismissedIds: m.listDismissedIds,
}));
vi.mock('@/lib/db/client', () => ({ pool: { query: vi.fn() } }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));

import { DELETE, GET, POST } from '@/app/api/sync/dismissals/route';

const req = (method: string, body: unknown) =>
  new Request('http://x/api/sync/dismissals', { method, body: JSON.stringify(body) });

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset();
  m.sessionUserId.mockResolvedValue('u1');
});

describe('/api/sync/dismissals', () => {
  it('descarta com motivo válido', async () => {
    const res = await POST(req('POST', { jobId: 'j1', reason: 'salario' }));
    expect(res.status).toBe(200);
    expect(m.dismissJob).toHaveBeenCalledWith('u1', 'j1', 'salario');
  });

  it('recusa motivo fora da lista', async () => {
    const res = await POST(req('POST', { jobId: 'j1', reason: 'porque sim' }));
    expect(res.status).toBe(400);
    expect(m.dismissJob).not.toHaveBeenCalled();
  });

  it('desfaz o descarte', async () => {
    const res = await DELETE(req('DELETE', { jobId: 'j1' }));
    expect(res.status).toBe(200);
    expect(m.undismissJob).toHaveBeenCalledWith('u1', 'j1');
  });

  it('lista os descartados do usuário', async () => {
    m.listDismissedIds.mockResolvedValue(['j1', 'j2']);
    expect(await (await GET()).json()).toEqual({ dismissed: ['j1', 'j2'] });
  });

  it('sem sessão, 401', async () => {
    m.sessionUserId.mockResolvedValue(null);
    expect((await POST(req('POST', { jobId: 'j1', reason: 'salario' }))).status).toBe(401);
  });
});
