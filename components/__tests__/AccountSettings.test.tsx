import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'authenticated' as const, update: updateMock }),
}));

import { AccountSettings } from '@/components/auth/AccountSettings';

const fetchMock = vi.fn();

beforeEach(() => {
  updateMock.mockReset();
  updateMock.mockResolvedValue(null);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('AccountSettings', () => {
  it('mostra iniciais sem foto e não oferece remover', () => {
    render(<AccountSettings initialName="Ana Souza" email="ana@x.com" initialImage={null} />);
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
  });

  it('envia a foto, troca a imagem e atualiza a sessão', async () => {
    fetchMock.mockResolvedValueOnce(json({ image: '/api/perfil/avatar?v=1' }));
    const { container } = render(
      <AccountSettings initialName="Ana" email="ana@x.com" initialImage={null} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'f.png', { type: 'image/png' })] } });

    await screen.findByText('Foto atualizada.');
    expect(fetchMock).toHaveBeenCalledWith('/api/perfil/avatar', expect.objectContaining({ method: 'POST' }));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/perfil/avatar?v=1');
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument();
  });

  it('recusa arquivo grande sem chamar a API', async () => {
    const { container } = render(
      <AccountSettings initialName="Ana" email="ana@x.com" initialImage={null} />,
    );
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'f.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [big] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('máx. 2MB');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mostra o erro devolvido pelo servidor', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'Envie uma imagem JPG, PNG ou WebP.' }, 415));
    const { container } = render(
      <AccountSettings initialName="Ana" email="ana@x.com" initialImage={null} />,
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(['x'], 'f.png', { type: 'image/png' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('JPG, PNG ou WebP');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('salva o nome e atualiza a sessão', async () => {
    fetchMock.mockResolvedValueOnce(json({ name: 'Ana Lima' }));
    render(<AccountSettings initialName="Ana" email="ana@x.com" initialImage={null} />);
    const save = screen.getByRole('button', { name: /salvar nome/i });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Lima' } });
    fireEvent.click(save);

    await screen.findByText('Nome salvo.');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ name: 'Ana Lima' });
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
  });

  it('remove a foto própria', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true }));
    const { container } = render(
      <AccountSettings initialName="Ana" email="ana@x.com" initialImage="/api/perfil/avatar?v=1" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /remover/i }));
    await screen.findByText('Foto removida.');
    expect(container.querySelector('img')).toBeNull();
  });

  // Regressão: o input de arquivo sr-only era um foco invisível e sem nome no
  // Tab, antes do botão "Enviar foto" — que é o controle acessível de verdade.
  it('o seletor de arquivo fica fora do Tab e do leitor de tela; o botão é o controle', () => {
    const { container } = render(<AccountSettings initialName="Ana" email="ana@x.com" initialImage={null} />);
    const input = container.querySelector('input[type="file"]')!;
    expect(input.getAttribute('tabindex')).toBe('-1');
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: /enviar foto/i })).toBeInTheDocument();
  });
});
