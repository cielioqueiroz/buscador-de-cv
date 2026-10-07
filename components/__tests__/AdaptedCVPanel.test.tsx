import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdaptedCVPanel } from '@/components/AdaptedCVPanel';
import type { CVProfile, Job } from '@/lib/providers/types';

const profile: CVProfile = {
  title: 'Desenvolvedor Frontend',
  seniority: 'pleno',
  skills: ['React'],
  areas: ['ti'],
  searchQueries: ['react'],
  rawText: 'cv',
};

const job: Job = {
  id: 'vaga-1',
  title: 'Dev Front-end',
  company: 'Acme',
  location: 'São Paulo',
  remote: true,
  description: 'React e Scrum',
  source: 'adzuna',
  applyUrl: 'https://acme.com/1',
};

const ADAPTACAO = {
  headline: 'Desenvolvedor Frontend',
  summary: 'Experiência em React.',
  skills: ['React', 'TypeScript'],
  experienceHighlights: ['Migrou checkout'],
  cautions: ['Confirmar inglês antes de enviar'],
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ adaptedCV: ADAPTACAO }) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('AdaptedCVPanel', () => {
  // Regressão real: antes do createPortal, o modal era renderizado dentro do
  // JobCard (que tem transform via animate-rise). O transform cria containing
  // block para `position: fixed`, então o painel ficava colado ao card, com o
  // X fora da tela e sem jeito de fechar. Portal para document.body conserta.
  it('é renderizado pelo portal em document.body (não fica preso ao pai)', () => {
    const { container } = render(<AdaptedCVPanel job={job} profile={profile} onClose={() => {}} />);

    // Nada dentro do container do render; o dialog real está no body.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('mostra o estado "adaptando" imediatamente — feedback que faltava antes', () => {
    render(<AdaptedCVPanel job={job} profile={profile} onClose={() => {}} />);
    expect(screen.getByText(/adaptando seu cv/i)).toBeInTheDocument();
  });

  it('exibe o CV adaptado quando a API responde', async () => {
    render(<AdaptedCVPanel job={job} profile={profile} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText('Migrou checkout')).toBeInTheDocument());
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getByText(/Confirmar inglês antes de enviar/)).toBeInTheDocument();
  });

  it('o botão X fecha', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AdaptedCVPanel job={job} profile={profile} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /fechar cv adaptado/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a tecla Esc fecha (sem isso, o único recurso era o X)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AdaptedCVPanel job={job} profile={profile} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('trava a rolagem do fundo enquanto aberto e devolve ao desmontar', () => {
    const antes = document.body.style.overflow;
    const { unmount } = render(<AdaptedCVPanel job={job} profile={profile} onClose={() => {}} />);

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(antes);
  });
});
