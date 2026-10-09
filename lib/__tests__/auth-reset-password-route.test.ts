import { describe, it, expect, vi, beforeEach } from 'vitest';

const { consumeMock, rateLimitMock } = vi.hoisted(() => ({
  consumeMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

vi.mock('@/lib/auth/reset-tokens', () => ({
  consumeResetToken: consumeMock,
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => '127.0.0.1',
}));

import { POST } from '@/app/api/auth/reset-password/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  consumeMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe('POST /api/auth/reset-password', () => {
  it('devolve 200 em token válido', async () => {
    consumeMock.mockResolvedValueOnce('u1');
    const res = await POST(request({ token: 'abc123xyz9', password: 'senha1234' }));
    expect(res.status).toBe(200);
  });

  it('devolve 400 em token inválido', async () => {
    consumeMock.mockResolvedValueOnce(null);
    const res = await POST(request({ token: 'abc123xyz9', password: 'senha1234' }));
    expect(res.status).toBe(400);
  });

  it('devolve 400 em senha fraca', async () => {
    const res = await POST(request({ token: 'abc123xyz9', password: 'curta' }));
    expect(res.status).toBe(400);
  });

  it('devolve 429 em excesso de tentativas', async () => {
    rateLimitMock.mockResolvedValueOnce(false);
    const res = await POST(request({ token: 'abc123xyz9', password: 'senha1234' }));
    expect(res.status).toBe(429);
  });
});
