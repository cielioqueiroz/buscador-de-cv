import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoverLetterPanel } from '@/components/CoverLetterPanel';
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

const CARTA = {
  greeting: 'Prezado time da Acme,',
  paragraphs: ['Trabalhei com React.', 'Quero contribuir.'],
  closing: 'Atenciosamente.',
  keywords: ['React', 'Scrum'],
};

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ letter: CARTA }) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('CoverLetterPanel', () => {
  it('NÃO chama a IA ao abrir — a carta só nasce de um clique', async () => {
    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('Nenhuma carta ainda')).toBeInTheDocument();
  });

  it('escreve a carta quando o usuário pede, e mostra as palavras-chave da vaga', async () => {
    const user = userEvent.setup();
    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: /escrever minha carta/i }));

    await waitFor(() =>
      expect(screen.getByLabelText('Texto da carta')).toHaveValue(
        'Prezado time da Acme,\n\nTrabalhei com React.\n\nQuero contribuir.\n\nAtenciosamente.',
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Scrum')).toBeInTheDocument();
  });

  it('manda o tom e o tamanho escolhidos para a API', async () => {
    const user = userEvent.setup();
    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: /direto ao ponto/i }));
    await user.click(screen.getByRole('button', { name: /^curta/i }));
    await user.click(screen.getByRole('button', { name: /escrever minha carta/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tone).toBe('direto');
    expect(body.length).toBe('curta');
    expect(body.job.id).toBe('vaga-1');
  });

  it('reabrir mostra a carta salva sem gastar outra chamada', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <CoverLetterPanel job={job} profile={profile} onClose={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /escrever minha carta/i }));
    await waitFor(() => expect(screen.getByLabelText('Texto da carta')).toBeInTheDocument());
    unmount();

    fetchMock.mockClear();
    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);

    expect((screen.getByLabelText('Texto da carta') as HTMLTextAreaElement).value).toContain(
      'Trabalhei com React.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a edição do usuário sobrevive ao fechar e reabrir', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <CoverLetterPanel job={job} profile={profile} onClose={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /escrever minha carta/i }));
    await waitFor(() => expect(screen.getByLabelText('Texto da carta')).toBeInTheDocument());

    const area = screen.getByLabelText('Texto da carta');
    await user.clear(area);
    await user.type(area, 'Minha versão.');
    unmount();

    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);
    expect(screen.getByLabelText('Texto da carta')).toHaveValue('Minha versão.');
  });

  it('avisa o usuário quando a API falha, sem quebrar o painel', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Muitas cartas seguidas. Aguarde um minuto.' }),
    });

    render(<CoverLetterPanel job={job} profile={profile} onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: /escrever minha carta/i }));

    await waitFor(() => expect(screen.getByText('Nenhuma carta ainda')).toBeInTheDocument());
  });
});
