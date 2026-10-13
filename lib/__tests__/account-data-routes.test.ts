// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock, authMock, rateLimitMock, verifyMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  authMock: vi.fn(),
  rateLimitMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({ pool: { query: queryMock }, assertDatabaseUrl: () => 'x' }));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: rateLimitMock, clientIp: () => '127.0.0.1' }));
vi.mock('@/lib/auth/password', () => ({ verifyPassword: verifyMock, hashPassword: vi.fn() }));

import { DELETE } from '@/app/api/perfil/conta/route';
import { GET as exportGET } from '@/app/api/perfil/exportar/route';

function del(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/perfil/conta', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

/** Responde cada SQL pelo conteúdo, para não depender da ordem do Promise.all. */
function routeQueries(map: Array<[RegExp, unknown]>) {
  queryMock.mockImplementation(async (sql: string) => {
    for (const [re, res] of map) if (re.test(sql)) return res;
    return { rows: [], rowCount: 0 };
  });
}

beforeEach(() => {
  queryMock.mockReset();
  authMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
  verifyMock.mockReset();
});

describe('DELETE /api/perfil/conta', () => {
  it('exige sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    expect((await DELETE(del({ confirmEmail: 'a@x.com' }))).status).toBe(401);
  });

  it('bloqueia chamada cross-site', async () => {
    const res = await DELETE(del({ confirmEmail: 'a@x.com' }, { 'sec-fetch-site': 'cross-site' }));
    expect(res.status).toBe(400);
    expect(authMock).not.toHaveBeenCalled();
  });

  it('recusa quando o e-mail digitado não é o da conta', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    routeQueries([[/password_hash from users/, { rows: [{ email: 'ana@x.com', password_hash: 'h' }] }]]);
    const res = await DELETE(del({ confirmEmail: 'outra@x.com', password: 'x' }));
    expect(res.status).toBe(400);
    expect(queryMock.mock.calls.some(([sql]) => /delete from users/.test(sql))).toBe(false);
  });

  it('conta com senha: exige a senha e recusa a errada', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    routeQueries([[/password_hash from users/, { rows: [{ email: 'ana@x.com', password_hash: 'h' }] }]]);
    expect((await DELETE(del({ confirmEmail: 'ana@x.com' }))).status).toBe(400);
    verifyMock.mockResolvedValueOnce(false);
    expect((await DELETE(del({ confirmEmail: 'ana@x.com', password: 'errada' }))).status).toBe(403);
    expect(queryMock.mock.calls.some(([sql]) => /delete from users/.test(sql))).toBe(false);
  });

  it('apaga a conta com e-mail (sem diferenciar maiúsculas) e senha corretos', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    verifyMock.mockResolvedValueOnce(true);
    routeQueries([
      [/password_hash from users/, { rows: [{ email: 'ana@x.com', password_hash: 'h' }] }],
      [/delete from users/, { rows: [{ id: 'u1' }], rowCount: 1 }],
    ]);
    const res = await DELETE(del({ confirmEmail: '  Ana@X.com ', password: 'certa' }));
    expect(res.status).toBe(200);
    const deleteCall = queryMock.mock.calls.find(([sql]) => /delete from users/.test(sql))!;
    expect(deleteCall[0]).toMatch(/verification_token/);
    expect(deleteCall[1]).toEqual(['u1']);
  });

  it('conta só Google: basta confirmar o e-mail', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u2' } });
    routeQueries([
      [/password_hash from users/, { rows: [{ email: 'bia@gmail.com', password_hash: null }] }],
      [/delete from users/, { rows: [{ id: 'u2' }], rowCount: 1 }],
    ]);
    const res = await DELETE(del({ confirmEmail: 'bia@gmail.com' }));
    expect(res.status).toBe(200);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('limita tentativas por usuário', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    rateLimitMock.mockResolvedValueOnce(false);
    expect((await DELETE(del({ confirmEmail: 'ana@x.com' }))).status).toBe(429);
  });
});

describe('GET /api/perfil/exportar', () => {
  const req = () => new Request('http://localhost/api/perfil/exportar');

  it('exige sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    expect((await exportGET(req())).status).toBe(401);
  });

  it('baixa um JSON com os dados da conta e nunca a senha', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    routeQueries([
      [/created_at from users/, { rows: [{ name: 'Ana', email: 'ana@x.com', provider: 'email', created_at: new Date('2026-10-01') }] }],
      [/from cv_profiles/, { rows: [{ title: 'Dev', seniority: 'pleno', skills: ['react'], areas: [], search_queries: ['react'], raw_text: 'cv' }] }],
      [/from favorites/, { rows: [{ job_id: 'j1' }] }],
      [/from user_avatars/, { rows: [{ data: Buffer.from([1, 2, 3]), mime: 'image/webp' }] }],
    ]);
    const res = await exportGET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="vaga-certa-meus-dados-\d{4}-\d{2}-\d{2}\.json"/);
    const text = await res.text();
    expect(text).not.toMatch(/password/i);
    const data = JSON.parse(text);
    expect(data.account).toMatchObject({ name: 'Ana', email: 'ana@x.com', signInMethod: 'email' });
    expect(data.profile.title).toBe('Dev');
    expect(data.favorites).toEqual(['j1']);
    expect(data.avatar).toEqual({ mime: 'image/webp', base64: 'AQID' });
    // Só dados do próprio usuário: toda consulta filtra pelo id da sessão.
    for (const [, params] of queryMock.mock.calls) expect(params).toEqual(['u1']);
  });
});
