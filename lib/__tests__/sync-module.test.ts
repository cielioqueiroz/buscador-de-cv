import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));

import {
  listApplications,
  upsertApplication,
  updateApplicationStage,
  removeApplication,
  setFavorite,
  listFavorites,
  upsertLetter,
  getLetter,
  upsertAdaptedCV,
} from '@/lib/auth/sync';

const job = {
  id: 'j1',
  title: 'Dev',
  company: 'Acme',
  location: 'SP',
  remote: false,
  description: 'd',
  source: 'adzuna' as const,
  applyUrl: 'https://example.com/j1',
};
const match = { jobId: 'j1', score: 80, reasons: ['forte'], gaps: [] };
const application = {
  id: 'j1',
  job,
  match,
  stage: 'aplicado' as const,
  createdAt: 1_000,
  updatedAt: 2_000,
};

beforeEach(() => queryMock.mockReset());

describe('applications', () => {
  it('lista mapeia linhas em Applications válidas', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          job_id: 'j1',
          job_payload: { job, match },
          score: 80,
          stage: 'aplicado',
          notes: null,
          created_at: new Date(1_000),
          updated_at: new Date(2_000),
        },
      ],
    });
    const got = await listApplications('u1');
    expect(got).toEqual([application]);
  });

  it('upsert manda payload com job+match', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await upsertApplication('u1', application);
    const sql = queryMock.mock.calls[0][0];
    const args = queryMock.mock.calls[0][1];
    expect(sql).toContain('insert into applications');
    expect(args[0]).toBe('u1');
    expect(args[1]).toBe('j1');
    expect(JSON.parse(args[2])).toEqual({ job, match });
    expect(args[3]).toBe(80);
    expect(args[4]).toBe('aplicado');
  });

  it('updateApplicationStage filtra por user+job', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await updateApplicationStage('u1', 'j1', 'entrevista');
    expect(queryMock.mock.calls[0][1]).toEqual(['u1', 'j1', 'entrevista']);
  });

  it('remove filtra por user+job', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await removeApplication('u1', 'j1');
    expect(queryMock.mock.calls[0][1]).toEqual(['u1', 'j1']);
  });
});

describe('favorites', () => {
  it('setFavorite(true) usa insert on conflict do nothing', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await setFavorite('u1', 'j1', true);
    expect(queryMock.mock.calls[0][0]).toContain('insert into favorites');
  });

  it('setFavorite(false) usa delete', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await setFavorite('u1', 'j1', false);
    expect(queryMock.mock.calls[0][0]).toContain('delete from favorites');
  });

  it('listFavorites devolve array de jobIds', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ job_id: 'a' }, { job_id: 'b' }],
    });
    expect(await listFavorites('u1')).toEqual(['a', 'b']);
  });
});

describe('letters e adapted', () => {
  const letter = {
    letter: {
      greeting: 'Olá',
      paragraphs: ['Primeiro parágrafo.', 'Segundo parágrafo.'],
      closing: 'Abraço',
      keywords: ['react'],
    },
    text: 'texto',
    tone: 'formal' as const,
    length: 'curta' as const,
    savedAt: 1_000,
  };

  it('upsertLetter manda payload serializado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await upsertLetter('u1', 'j1', letter);
    const sql = queryMock.mock.calls[0][0];
    expect(sql).toContain('insert into cover_letters');
    const args = queryMock.mock.calls[0][1];
    expect(args[0]).toBe('u1');
    expect(args[1]).toBe('j1');
    expect(JSON.parse(args[2])).toEqual(letter.letter);
  });

  it('getLetter devolve null quando não existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await getLetter('u1', 'j1')).toBeNull();
  });

  it('upsertAdaptedCV serializa payload', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const payload = {
      headline: 'Dev Front-end',
      summary: 'resumo longo o bastante',
      skills: ['react'],
      experienceHighlights: ['Entregou X com Y resultado.'],
      keywords: ['react'],
      cautions: ['Mencione exatamente o stack da vaga.'],
    };
    await upsertAdaptedCV('u1', 'j1', payload);
    const args = queryMock.mock.calls[0][1];
    expect(JSON.parse(args[2])).toEqual(payload);
  });
});
