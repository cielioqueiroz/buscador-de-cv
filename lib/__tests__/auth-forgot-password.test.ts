import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock, rateLimitMock, sendMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  rateLimitMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => '127.0.0.1',
}));
vi.mock('@/lib/auth/email', () => ({
  getMailer: () => ({ send: sendMock }),
}));

import { POST } from '@/app/api/auth/forgot-password/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  rateLimitMock.mockReset();
  sendMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe('POST /api/auth/forgot-password', () => {
  it('devolve 200 e envia o e-mail quando a conta existe', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'u1',
            email: 'ana@example.com',
            name: 'Ana',
            image: null,
            password_hash: 'h',
            provider: 'email',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // issueResetToken insert
    const res = await POST(request({ email: 'ana@example.com' }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('ana@example.com');
    expect(payload.text).toMatch(/redefinir-senha\?token=/);
  });

  it('devolve 200 sem mandar e-mail quando a conta não existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const res = await POST(request({ email: 'nao-existe@example.com' }));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('devolve 200 silenciosamente quando o rate-limit por e-mail estoura', async () => {
    rateLimitMock
      .mockResolvedValueOnce(true) // IP OK
      .mockResolvedValueOnce(false); // email estourou
    const res = await POST(request({ email: 'ana@example.com' }));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('devolve 429 quando o rate-limit por IP estoura', async () => {
    rateLimitMock.mockResolvedValueOnce(false);
    const res = await POST(request({ email: 'ana@example.com' }));
    expect(res.status).toBe(429);
  });

  it('devolve 400 em e-mail inválido', async () => {
    const res = await POST(request({ email: 'nao-eh-email' }));
    expect(res.status).toBe(400);
  });
});
