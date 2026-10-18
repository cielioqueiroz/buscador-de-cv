import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query, verifyPassword } = vi.hoisted(() => ({
  query: vi.fn(),
  verifyPassword: vi.fn(),
}));
vi.mock('@/lib/db/client', () => ({ pool: { query } }));
vi.mock('@/lib/auth/password', () => ({ verifyPassword }));

import { checkAccountDeletion, deleteAccount, DeleteAccountSchema } from '@/lib/auth/account-data';

beforeEach(() => {
  query.mockReset();
  verifyPassword.mockReset();
});

const pedido = (confirmEmail: string, password?: string) => DeleteAccountSchema.parse({ confirmEmail, password });

describe('checkAccountDeletion — quem pede é o dono', () => {
  it('e-mail digitado diferente do da conta é recusado', async () => {
    query.mockResolvedValue({ rows: [{ email: 'dono@x.com', password_hash: null }] });
    expect(await checkAccountDeletion('u1', pedido('outro@x.com'))).toBe('email-mismatch');
  });

  it('o e-mail confere sem diferenciar maiúsculas e espaços', async () => {
    query.mockResolvedValue({ rows: [{ email: 'Dono@X.com', password_hash: null }] });
    expect(await checkAccountDeletion('u1', pedido('  dono@x.COM '))).toBe('ok');
  });

  it('conta com senha exige a senha, e a senha errada é recusada', async () => {
    query.mockResolvedValue({ rows: [{ email: 'dono@x.com', password_hash: 'hash' }] });
    expect(await checkAccountDeletion('u1', pedido('dono@x.com'))).toBe('password-required');

    verifyPassword.mockResolvedValue(false);
    expect(await checkAccountDeletion('u1', pedido('dono@x.com', 'errada'))).toBe('wrong-password');

    verifyPassword.mockResolvedValue(true);
    expect(await checkAccountDeletion('u1', pedido('dono@x.com', 'certa'))).toBe('ok');
    expect(verifyPassword).toHaveBeenLastCalledWith('certa', 'hash');
  });

  it('conta que não existe mais', async () => {
    query.mockResolvedValue({ rows: [] });
    expect(await checkAccountDeletion('u1', pedido('dono@x.com'))).toBe('not-found');
  });
});

describe('deleteAccount', () => {
  it('apaga o usuário e o token de verificação ligado ao e-mail, numa consulta só', async () => {
    query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'u1' }] });
    expect(await deleteAccount('u1')).toBe(true);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('delete from verification_token');
    expect(sql).toContain('delete from users');
    expect(params).toEqual(['u1']);
  });

  it('nada apagado devolve false', async () => {
    query.mockResolvedValue({ rowCount: 0, rows: [] });
    expect(await deleteAccount('u1')).toBe(false);
  });
});
