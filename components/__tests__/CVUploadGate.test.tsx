import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { sessionState, runJourney } = vi.hoisted(() => ({
  sessionState: { status: 'unauthenticated' as 'unauthenticated' | 'authenticated' | 'loading' },
  runJourney: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: sessionState.status }),
  signIn: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/journey', () => ({ runJourney }));

import { CVUpload } from '@/components/CVUpload';

beforeEach(() => {
  runJourney.mockReset();
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

  it('logado solta o arquivo e a análise começa, sem modal', () => {
    sessionState.status = 'authenticated';
    runJourney.mockReturnValue(new Promise(() => {}));
    render(<CVUpload />);
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /enviar currículo/i }), { dataTransfer: { files: [file] } });
    expect(runJourney).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enquanto a sessão carrega, o clique não abre nada', () => {
    sessionState.status = 'loading';
    render(<CVUpload />);
    fireEvent.click(screen.getByRole('button', { name: /enviar currículo/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
