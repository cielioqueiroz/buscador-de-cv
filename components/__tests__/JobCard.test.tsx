import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobCard } from '@/components/JobCard';
import { FAVORITES_EVENT, getFavorites } from '@/lib/store';
import { getApplication } from '@/lib/applications';
import type { RankedJob } from '@/lib/matching';
import type { CVProfile } from '@/lib/providers/types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const profile: CVProfile = {
  title: 'Desenvolvedor Frontend',
  seniority: 'pleno',
  skills: ['React'],
  areas: ['ti'],
  searchQueries: ['react'],
  rawText: 'cv',
};

function ranked(over: Partial<RankedJob['job']> = {}): RankedJob {
  const job = {
    id: 'vaga-1',
    title: 'Dev Front-end',
    company: 'Acme',
    location: 'São Paulo, SP',
    remote: false,
    description: 'React e Scrum',
    source: 'adzuna' as const,
    applyUrl: 'https://acme.com/vaga-1',
    ...over,
  };
  return { job, match: { jobId: job.id, score: 82, reasons: ['Sabe React'], gaps: ['Falta Go'] } };
}

beforeEach(() => {
  localStorage.clear();
});

describe('JobCard', () => {
  it('mostra os dados da vaga e um link de candidatura seguro para o anúncio oficial', () => {
    render(<JobCard ranked={ranked()} />);

    expect(screen.getByRole('heading', { name: 'Dev Front-end' })).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();

    const apply = screen.getByRole('link', { name: /candidatar-se/i });
    expect(apply).toHaveAttribute('href', 'https://acme.com/vaga-1');
    expect(apply).toHaveAttribute('target', '_blank');
    expect(apply).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('só oferece carta e adaptação de CV quando há perfil', () => {
    const { rerender } = render(<JobCard ranked={ranked()} profile={null} />);
    expect(screen.queryByRole('button', { name: /gerar carta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /adaptar cv/i })).not.toBeInTheDocument();

    rerender(<JobCard ranked={ranked()} profile={profile} />);
    expect(screen.getByRole('button', { name: /gerar carta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adaptar cv/i })).toBeInTheDocument();
  });

  it('favoritar persiste e avisa a lista via evento (base do filtro "só favoritas")', async () => {
    const user = userEvent.setup();
    const ouvinte = vi.fn();
    window.addEventListener(FAVORITES_EVENT, ouvinte);

    render(<JobCard ranked={ranked()} />);
    await user.click(screen.getByRole('button', { name: /salvar vaga/i }));

    expect(getFavorites()).toContain('vaga-1');
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /remover dos favoritos/i })).toBeInTheDocument();

    window.removeEventListener(FAVORITES_EVENT, ouvinte);
  });

  it('acompanhar salva a vaga no tracker local e reflete o estado', async () => {
    const user = userEvent.setup();
    render(<JobCard ranked={ranked()} />);

    // O estado inicial é resolvido num setTimeout(0) para evitar hidratação dupla.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^acompanhar$/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^acompanhar$/i }));

    expect(getApplication('vaga-1')).not.toBeNull();
    expect(screen.getByRole('button', { name: /acompanhando/i })).toBeInTheDocument();
  });
});
