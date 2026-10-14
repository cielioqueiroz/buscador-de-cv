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
    queryMock.mockResolvedValue({ rows: [] });
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
    expect(queryMock.mock.calls[1][0]).toContain('delete from password_reset_tokens where expires_at');
  });
});

describe('consumeResetToken', () => {
  it('devolve null quando o token não pode ser reivindicado (inexistente, vencido ou usado)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await consumeResetToken('qualquer', 'novasenha1')).toBeNull();
    const sql = queryMock.mock.calls[0][0];
    // validade e uso único checados no próprio UPDATE — sem corrida entre ler e gravar
    expect(sql).toContain('used_at is null');
    expect(sql).toContain('expires_at > now()');
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('troca a senha, carimba password_changed_at e invalida os outros tokens', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] }) // reivindica o token
      .mockResolvedValueOnce({ rows: [] }) // update users
      .mockResolvedValueOnce({ rows: [] }); // invalida outros tokens

    expect(await consumeResetToken('abc', 'novasenha1')).toBe('u1');
    expect(queryMock.mock.calls[0][0]).toContain('update password_reset_tokens set used_at = now()');
    expect(queryMock.mock.calls[1][0]).toContain('password_changed_at = now()');
    expect(queryMock.mock.calls[2][0]).toContain(
      'update password_reset_tokens set used_at = now() where user_id',
    );
  });
});
