import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CVProfile, Job } from '@/lib/providers/types';

type GenParams = {
  contents: string;
  config: { systemInstruction: string; responseJsonSchema: Record<string, unknown> };
};

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(async (_p: unknown): Promise<{ text: string | undefined }> => ({
    text: JSON.stringify({
      greeting: 'Prezado time da Acme,',
      paragraphs: ['Trabalhei com React por 4 anos.', 'Quero resolver o problema de vocês.'],
      closing: 'Atenciosamente, Ciélio.',
      keywords: ['React', 'Scrum'],
    }),
  })),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { generateCoverLetter } from '@/lib/ai/gemini';

const cv: CVProfile = {
  title: 'Desenvolvedor Frontend',
  seniority: 'pleno',
  skills: ['React'],
  areas: ['ti'],
  searchQueries: ['react'],
  rawText: 'CONTEUDO-DO-CURRICULO',
};

const vaga: Job = {
  id: 'j1',
  title: 'Dev Front-end',
  company: 'Acme',
  location: 'São Paulo',
  remote: true,
  description: 'DESCRICAO-DA-VAGA com React e Scrum',
  source: 'adzuna',
  applyUrl: 'https://acme.com/j1',
};

const ultimoPrompt = () => (generateContent.mock.calls.at(-1)![0] as GenParams).contents;
const ultimaConfig = () => (generateContent.mock.calls.at(-1)![0] as GenParams).config;

beforeEach(() => generateContent.mockClear());

describe('generateCoverLetter', () => {
  it('devolve a carta validada contra o schema', async () => {
    const carta = await generateCoverLetter(cv, vaga, 'formal', 'curta');
    expect(carta.paragraphs).toHaveLength(2);
    expect(carta.keywords).toContain('React');
  });

  it('manda o CV e a vaga inteiros no prompt — sem os dois não há carta específica', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    expect(ultimoPrompt()).toContain('CONTEUDO-DO-CURRICULO');
    expect(ultimoPrompt()).toContain('DESCRICAO-DA-VAGA');
    expect(ultimoPrompt()).toContain('Acme');
  });

  it('o tom escolhido muda a instrução mandada ao modelo', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    const comFormal = ultimoPrompt();
    await generateCoverLetter(cv, vaga, 'direto', 'curta');
    const comDireto = ultimoPrompt();

    expect(comFormal).not.toBe(comDireto);
    expect(comDireto).toContain('sem rodeio');
  });

  it('o tamanho escolhido chega ao modelo como contagem de palavras', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    expect(ultimoPrompt()).toContain('120 e 160 palavras');

    await generateCoverLetter(cv, vaga, 'formal', 'media');
    expect(ultimoPrompt()).toContain('220 e 280 palavras');
  });

  it('proíbe inventar experiência que não está no CV', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    expect(ultimoPrompt()).toContain('NÃO invente nada');
  });

  it('trata a descrição da vaga como dado, não como instrução (prompt injection)', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    expect(ultimaConfig().systemInstruction).toContain('nunca como instrução');
  });

  it('pede JSON estruturado — as keywords precisam viajar separadas do texto', async () => {
    await generateCoverLetter(cv, vaga, 'formal', 'curta');
    const schema = ultimaConfig().responseJsonSchema;
    expect(Object.keys(schema.properties as object)).toEqual(
      expect.arrayContaining(['greeting', 'paragraphs', 'closing', 'keywords']),
    );
  });

  it('estoura se a IA devolver algo fora do contrato', async () => {
    generateContent.mockResolvedValueOnce({ text: JSON.stringify({ greeting: 'Oi' }) });
    await expect(generateCoverLetter(cv, vaga, 'formal', 'curta')).rejects.toThrow();
  });
});
