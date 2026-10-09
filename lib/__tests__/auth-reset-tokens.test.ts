import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));

import { consumeResetToken, issueResetToken } from '@/lib/auth/reset-tokens';

beforeEach(() => queryMock.mockReset());

describe('issueResetToken', () => {
  it('gera token em claro, grava hash e devolve expiração', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const { token, expiresAt } = await issueResetToken('u1');
    expect(token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    const sql = queryMock.mock.calls[0][0];
    const args = queryMock.mock.calls[0][1];
    expect(sql).toContain('insert into password_reset_tokens');
    // Nunca grava o token em claro.
    expect(args[0]).not.toBe(token);
    expect(args[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(args[1]).toBe('u1');
  });
});

describe('consumeResetToken', () => {
  it('devolve null para token inexistente', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await consumeResetToken('qualquer', 'novasenha1')).toBeNull();
  });

  it('devolve null para token expirado', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          user_id: 'u1',
          expires_at: new Date(Date.now() - 1_000),
          used_at: null,
        },
      ],
    });
    expect(await consumeResetToken('abc', 'novasenha1')).toBeNull();
  });

  it('devolve null para token já usado', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          user_id: 'u1',
          expires_at: new Date(Date.now() + 60_000),
          used_at: new Date(Date.now() - 1_000),
        },
      ],
    });
    expect(await consumeResetToken('abc', 'novasenha1')).toBeNull();
  });

  it('troca a senha e marca o token como usado', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'u1',
            expires_at: new Date(Date.now() + 60_000),
            used_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // update users
      .mockResolvedValueOnce({ rows: [] }) // update tokens this one
      .mockResolvedValueOnce({ rows: [] }); // invalida outros tokens

    expect(await consumeResetToken('abc', 'novasenha1')).toBe('u1');
    expect(queryMock.mock.calls[1][0]).toContain('update users set password_hash');
    expect(queryMock.mock.calls[2][0]).toContain('update password_reset_tokens');
    expect(queryMock.mock.calls[3][0]).toContain(
      'update password_reset_tokens set used_at = now() where user_id',
    );
  });
});
