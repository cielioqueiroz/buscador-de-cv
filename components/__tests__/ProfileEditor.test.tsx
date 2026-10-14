import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CVProfile } from '@/lib/providers/types';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ProfileEditor } from '@/components/ProfileEditor';

const profile: CVProfile = {
  title: 'Analista de Dados',
  seniority: 'junior',
  skills: ['SQL', 'Excel'],
  areas: ['dados'],
  searchQueries: ['analista de dados'],
  rawText: 'texto do cv',
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  refresh.mockReset();
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('ProfileEditor', () => {
  it('adiciona com Enter, remove no ×, e salva sem mandar o texto do CV', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ProfileEditor profile={profile} onDone={onDone} />);

    await user.type(screen.getByLabelText('Habilidades'), 'Power BI{Enter}');
    await user.click(screen.getByRole('button', { name: 'Remover Excel' }));
    await user.selectOptions(screen.getByLabelText('Senioridade'), 'pleno');
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/perfil/cv');
    const body = JSON.parse(init.body);
    expect(body.skills).toEqual(['SQL', 'Power BI']);
    expect(body.seniority).toBe('pleno');
    expect(body.rawText).toBeUndefined();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(refresh).toHaveBeenCalled();
  });

  it('vírgula também adiciona, e repetido (sem caixa) não entra', async () => {
    const user = userEvent.setup();
    render(<ProfileEditor profile={profile} onDone={() => {}} />);

    await user.type(screen.getByLabelText('Habilidades'), 'sql,Python,');
    expect(screen.getAllByRole('button', { name: /^Remover/ }).map((b) => b.getAttribute('aria-label')))
      .toEqual(expect.arrayContaining(['Remover SQL', 'Remover Python']));
    expect(screen.queryByRole('button', { name: 'Remover sql' })).toBeNull();
  });
});
