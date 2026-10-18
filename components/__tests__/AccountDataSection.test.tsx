import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { signOutMock, clearMock } = vi.hoisted(() => ({ signOutMock: vi.fn(), clearMock: vi.fn() }));
vi.mock('next-auth/react', () => ({ signOut: signOutMock }));
vi.mock('@/lib/client/local-data', () => ({ clearLocalUserData: clearMock }));

import { AccountDataSection } from '@/components/auth/AccountDataSection';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  signOutMock.mockReset();
  clearMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function open(hasPassword: boolean) {
  render(<AccountDataSection email="ana@x.com" hasPassword={hasPassword} />);
  fireEvent.click(screen.getByRole('button', { name: /excluir minha conta/i }));
}

describe('AccountDataSection', () => {
  it('oferece o download dos dados', () => {
    render(<AccountDataSection email="ana@x.com" hasPassword />);
    expect(screen.getByRole('link', { name: /baixar meus dados/i })).toHaveAttribute('href', '/api/perfil/exportar');
  });

  it('só libera a exclusão com o e-mail certo e a senha', () => {
    open(true);
    const submit = screen.getByRole('button', { name: /excluir para sempre/i });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'ANA@x.com' } });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/sua senha/i), { target: { value: 'segredo1' } });
    expect(submit).toBeEnabled();
  });

  it('conta só Google não pede senha', () => {
    open(false);
    expect(screen.queryByLabelText(/sua senha/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'ana@x.com' } });
    expect(screen.getByRole('button', { name: /excluir para sempre/i })).toBeEnabled();
  });

  it('depois de excluir, limpa o navegador e sai da conta', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    open(false);
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'ana@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: /excluir para sempre/i }));
    await vi.waitFor(() => expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' }));
    expect(clearMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/perfil/conta');
    expect(init.method).toBe('DELETE');
  });

  it('mostra o erro do servidor e mantém a conta', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Senha incorreta.' }), { status: 403 }));
    open(true);
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'ana@x.com' } });
    fireEvent.change(screen.getByLabelText(/sua senha/i), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: /excluir para sempre/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Senha incorreta.');
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
