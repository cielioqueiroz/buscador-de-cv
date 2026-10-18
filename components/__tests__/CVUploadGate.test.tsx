import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sessionState, runJourney, refresh, toastError } = vi.hoisted(() => ({
  sessionState: { status: 'unauthenticated' as 'unauthenticated' | 'authenticated' | 'loading' },
  runJourney: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: sessionState.status }),
  signIn: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/journey', () => ({ runJourney, STAGES: ['reading', 'profiling', 'searching', 'scoring'] }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

import { CVUpload } from '@/components/CVUpload';

beforeEach(() => {
  runJourney.mockReset();
  refresh.mockReset();
  toastError.mockReset();
  sessionState.status = 'unauthenticated';
});

describe('CVUpload com conta obrigatória', () => {
  it('visitante que clica vê o convite para criar conta', () => {
    render(<CVUpload />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    expect(screen.getByRole('dialog', { name: /crie sua conta/i })).toBeInTheDocument();
  });

  it('visitante que solta um arquivo não dispara a análise', () => {
    render(<CVUpload />);
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /enviar currículo/i }), { dataTransfer: { files: [file] } });
    expect(runJourney).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('o modal fecha com Esc', () => {
    render(<CVUpload />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra Google no modal só quando configurado', () => {
    const { unmount } = render(<CVUpload googleEnabled />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    unmount();
    render(<CVUpload googleEnabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument();
  });

  it('logado solta o arquivo e a análise começa, sem modal', async () => {
    sessionState.status = 'authenticated';
    runJourney.mockReturnValue(new Promise(() => {}));
    render(<CVUpload />);
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /enviar currículo/i }), { dataTransfer: { files: [file] } });
    // a jornada é importada sob demanda, então a chamada vem logo depois
    await waitFor(() => expect(runJourney).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enquanto a sessão carrega, o clique não abre nada', () => {
    sessionState.status = 'loading';
    render(<CVUpload />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Regressão: a busca falhava (IA sobrecarregada) depois de o CV já estar
  // salvo, e o /perfil continuava pedindo "envie seu currículo".
  it('falha depois de ler o CV: avisa que o CV foi salvo e recarrega os dados da página', async () => {
    sessionState.status = 'authenticated';
    runJourney.mockImplementation(async (_file: File, onStage: (s: string) => void) => {
      onStage('reading');
      onStage('profiling');
      onStage('scoring');
      throw new Error('A IA está com muita demanda agora.');
    });
    render(<CVUpload />);
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /enviar currículo/i }), { dataTransfer: { files: [file] } });

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/currículo foi salvo.*muita demanda/));
  });

  it('falha na leitura do CV: só mostra o erro, nada foi salvo', async () => {
    sessionState.status = 'authenticated';
    runJourney.mockImplementation(async (_file: File, onStage: (s: string) => void) => {
      onStage('reading');
      throw new Error('CV vazio ou ilegível.');
    });
    render(<CVUpload />);
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /enviar currículo/i }), { dataTransfer: { files: [file] } });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('CV vazio ou ilegível.'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
