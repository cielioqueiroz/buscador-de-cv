// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';

const { queryMock, authMock, rateLimitMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  authMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => '127.0.0.1',
}));

import { DELETE, GET, POST } from '@/app/api/perfil/avatar/route';

async function png(): Promise<Buffer> {
  return sharp({ create: { width: 40, height: 40, channels: 3, background: '#0a0' } }).png().toBuffer();
}

function upload(bytes: Uint8Array, filename = 'foto.png', headers: Record<string, string> = {}): Request {
  const form = new FormData();
  form.append('file', new File([new Uint8Array(bytes)], filename, { type: 'image/png' }));
  return new Request('http://localhost/api/perfil/avatar', { method: 'POST', body: form, headers });
}

beforeEach(() => {
  queryMock.mockReset();
  authMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe('POST /api/perfil/avatar', () => {
  it('devolve 401 sem sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await POST(upload(await png()));
    expect(res.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('bloqueia envio cross-site', async () => {
    const res = await POST(upload(await png(), 'foto.png', { 'sec-fetch-site': 'cross-site' }));
    expect(res.status).toBe(400);
    expect(authMock).not.toHaveBeenCalled();
  });

  it('salva a foto re-encodada e devolve a nova URL', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({ rows: [{ image: '/api/perfil/avatar?v=99' }] });
    const res = await POST(upload(await png()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ image: '/api/perfil/avatar?v=99' });
    const saved = queryMock.mock.calls[0][1][1] as Buffer;
    expect((await sharp(saved).metadata()).format).toBe('webp');
  });

  it('recusa conteúdo que não é imagem mesmo com extensão .png', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await POST(upload(Buffer.from('<svg onload="alert(1)"/>')));
    expect(res.status).toBe(415);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('recusa arquivo grande com 413', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await POST(upload(Buffer.alloc(2 * 1024 * 1024 + 1)));
    expect(res.status).toBe(413);
  });

  it('devolve 400 quando falta o arquivo', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const form = new FormData();
    form.append('outro', 'x');
    const res = await POST(new Request('http://localhost/api/perfil/avatar', { method: 'POST', body: form }));
    expect(res.status).toBe(400);
  });

  it('aplica rate limit por usuário', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    rateLimitMock.mockResolvedValueOnce(false);
    const res = await POST(upload(await png()));
    expect(res.status).toBe(429);
    expect(rateLimitMock.mock.calls[0][0]).toContain('u1');
  });
});

describe('GET /api/perfil/avatar', () => {
  it('devolve 401 sem sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);
  });

  it('devolve 404 sem foto', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect((await GET()).status).toBe(404);
  });

  it('serve só a foto de quem está logado, com headers seguros', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const data = Buffer.from([1, 2, 3, 4]);
    queryMock.mockResolvedValueOnce({ rows: [{ data, mime: 'image/webp' }] });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual(['u1']);
    expect(res.headers.get('content-type')).toBe('image/webp');
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('content-security-policy')).toBe("default-src 'none'");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array(data));
  });
});

describe('DELETE /api/perfil/avatar', () => {
  it('devolve 401 sem sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await DELETE(new Request('http://localhost/api/perfil/avatar', { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });

  it('remove a foto do usuário logado', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({ rows: [] });
    const res = await DELETE(new Request('http://localhost/api/perfil/avatar', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1][0]).toBe('u1');
  });
});
