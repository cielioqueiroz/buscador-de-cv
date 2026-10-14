import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Application } from '@/lib/application-schema';

const m = vi.hoisted(() => ({
  fetchApplications: vi.fn(),
  updateApplicationStore: vi.fn(),
  removeApplicationStore: vi.fn(),
  restoreApplicationStore: vi.fn(),
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/lib/client/sync-client', () => ({
  fetchApplications: m.fetchApplications,
  updateApplicationStore: m.updateApplicationStore,
  removeApplicationStore: m.removeApplicationStore,
  restoreApplicationStore: m.restoreApplicationStore,
}));
vi.mock('@/lib/client/use-authed', () => ({ useAuthed: () => true }));
vi.mock('sonner', () => ({ toast: m.toast }));

import { ApplicationTracker } from '@/components/ApplicationTracker';

const app: Application = {
  id: 'j1',
  job: {
    id: 'j1', title: 'Dev React', company: 'Acme', location: 'SP', remote: false,
    description: 'd', source: 'adzuna', applyUrl: 'https://acme.com/j1',
  },
  match: { jobId: 'j1', score: 80, reasons: [], gaps: [] },
  stage: 'entrevista',
  notes: 'Falar com a Ana',
  createdAt: 1,
  updatedAt: 1,
};

beforeEach(() => {
  for (const fn of Object.values(m)) if ('mockReset' in fn) fn.mockReset();
  m.fetchApplications.mockResolvedValue([app]);
  m.updateApplicationStore.mockImplementation(async (_a: boolean, _id: string, patch: object) => [{ ...app, ...patch }]);
  m.removeApplicationStore.mockResolvedValue([]);
  m.restoreApplicationStore.mockResolvedValue([app]);
});

describe('ApplicationTracker', () => {
  it('tem a coluna Recusado e mostra a anotação no card', async () => {
    render(<ApplicationTracker />);
    expect(await screen.findByText('Falar com a Ana')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recusado' })).toBeInTheDocument();
  });

  it('salva anotação e data da entrevista', async () => {
    const user = userEvent.setup();
    render(<ApplicationTracker />);
    await user.click(await screen.findByRole('button', { name: 'Anotações de Dev React' }));

    const notas = screen.getByLabelText('Anotações');
    await user.clear(notas);
    await user.type(notas, 'Segunda fase na sexta');
    await user.type(screen.getByLabelText('Data da entrevista'), '2026-10-20');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(m.updateApplicationStore).toHaveBeenCalledWith(true, 'j1', {
        notes: 'Segunda fase na sexta',
        interviewOn: '2026-10-20',
      }),
    );
    expect(await screen.findByText(/Entrevista em 20\/10\/2026/)).toBeInTheDocument();
  });

  it('remover oferece desfazer, que devolve a candidatura inteira', async () => {
    const user = userEvent.setup();
    render(<ApplicationTracker />);
    await user.click(await screen.findByRole('button', { name: 'Remover Dev React do tracker' }));

    await waitFor(() => expect(m.toast).toHaveBeenCalled());
    const [, opts] = m.toast.mock.calls[0] as [string, { action: { onClick: () => void } }];
    opts.action.onClick();
    await waitFor(() => expect(m.restoreApplicationStore).toHaveBeenCalledWith(true, app));
  });
});
