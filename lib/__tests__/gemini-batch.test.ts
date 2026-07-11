import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job, CVProfile } from '@/lib/providers/types';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { matchJobs } from '@/lib/ai/gemini';

const cv = { title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: [], rawText: 'dev react' } as CVProfile;
const mk = (id: string): Job => ({
  id, title: `Vaga ${id}`, company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});
const reply = (matches: unknown[]) => ({ text: JSON.stringify({ matches }) });

beforeEach(() => generateContent.mockReset());

describe('matchJobs (lote)', () => {
  it('pontua N vagas com UMA requisição', async () => {
    generateContent.mockResolvedValueOnce(reply([
      { index: 0, score: 90, reasons: ['r'], gaps: [] },
      { index: 1, score: 20, reasons: [], gaps: ['g'] },
      { index: 2, score: 55, reasons: [], gaps: [] },
    ]));

    const out = await matchJobs(cv, [mk('a'), mk('b'), mk('c')]);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(out).toHaveLength(3);
  });

  // A IA responde por índice; o jobId quem resolve somos nós. Se pedíssemos o id
  // de volta, ela poderia inventar um que não existe.
  it('traduz o índice para o jobId certo', async () => {
    generateContent.mockResolvedValueOnce(reply([
      { index: 1, score: 90, reasons: [], gaps: [] },
      { index: 0, score: 10, reasons: [], gaps: [] },
    ]));

    const out = await matchJobs(cv, [mk('primeira'), mk('segunda')]);
    expect(out.find((m) => m.jobId === 'segunda')!.score).toBe(90);
    expect(out.find((m) => m.jobId === 'primeira')!.score).toBe(10);
  });

  it('descarta índice fora da lista em vez de estourar', async () => {
    generateContent.mockResolvedValueOnce(reply([
      { index: 0, score: 80, reasons: [], gaps: [] },
      { index: 99, score: 70, reasons: [], gaps: [] }, // não existe
    ]));

    const out = await matchJobs(cv, [mk('a')]);
    expect(out).toHaveLength(1);
    expect(out[0].jobId).toBe('a');
  });

  it('descarta índice repetido', async () => {
    generateContent.mockResolvedValueOnce(reply([
      { index: 0, score: 80, reasons: [], gaps: [] },
      { index: 0, score: 10, reasons: [], gaps: [] },
    ]));

    const out = await matchJobs(cv, [mk('a'), mk('b')]);
    expect(out).toHaveLength(1);
    expect(out[0].score).toBe(80);
  });

  it('não chama a API quando não há vagas', async () => {
    expect(await matchJobs(cv, [])).toEqual([]);
    expect(generateContent).not.toHaveBeenCalled();
  });

  // Sem folga no teto de saída, o JSON do lote é truncado no meio.
  it('dimensiona o max de tokens conforme o tamanho do lote', async () => {
    generateContent.mockResolvedValueOnce(reply([{ index: 0, score: 1, reasons: [], gaps: [] }]));
    await matchJobs(cv, [mk('a')]);
    const pequeno = generateContent.mock.calls[0][0].config.maxOutputTokens;

    generateContent.mockResolvedValueOnce(reply([{ index: 0, score: 1, reasons: [], gaps: [] }]));
    await matchJobs(cv, Array.from({ length: 15 }, (_, i) => mk(`j${i}`)));
    const grande = generateContent.mock.calls[1][0].config.maxOutputTokens;

    expect(grande).toBeGreaterThan(pequeno);
  });
});
