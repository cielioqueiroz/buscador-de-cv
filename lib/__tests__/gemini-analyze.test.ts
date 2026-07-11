import { describe, it, expect, vi } from 'vitest';

type GenParams = {
  model: string;
  contents: string;
  config: {
    systemInstruction: string;
    maxOutputTokens: number;
    thinkingConfig: unknown;
    responseMimeType: string;
    responseJsonSchema: Record<string, unknown>;
  };
};

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(async (_p: unknown): Promise<{ text: string | undefined }> => ({
    text: JSON.stringify({
      title: 'Desenvolvedor Frontend', seniority: 'pleno',
      skills: ['React', 'TypeScript'], areas: ['ti'],
      searchQueries: ['desenvolvedor react', 'frontend typescript'],
    }),
  })),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { analyzeCV } from '@/lib/ai/gemini';

const lastConfig = () => (generateContent.mock.calls.at(-1)![0] as GenParams).config;

describe('analyzeCV (Gemini)', () => {
  it('retorna um CVProfile válido a partir do texto', async () => {
    const profile = await analyzeCV('Sou dev React com 4 anos...');
    expect(profile.title).toBe('Desenvolvedor Frontend');
    expect(profile.seniority).toBe('pleno');
    expect(profile.searchQueries.length).toBeGreaterThan(0);
    // rawText é preenchido pelo servidor, não pela IA.
    expect(profile.rawText).toContain('React');
  });

  it('pede JSON estruturado, não texto livre para extrair com regex depois', async () => {
    await analyzeCV('dev react');
    const config = lastConfig();
    expect(config.responseMimeType).toBe('application/json');
    // O schema mandado à API é derivado do zod — sem contrato duplicado.
    expect(config.responseJsonSchema.required).toContain('searchQueries');
    // E sem a chave `$schema`, que a API do Gemini rejeita.
    expect(config.responseJsonSchema.$schema).toBeUndefined();
  });

  it('não pede rawText de volta — quem preenche é o servidor', async () => {
    await analyzeCV('dev react');
    expect(lastConfig().responseJsonSchema.required).not.toContain('rawText');
  });

  it('valida a resposta com zod em vez de confiar na API', async () => {
    generateContent.mockResolvedValueOnce({ text: '{"title":"Dev"}' }); // faltam campos
    await expect(analyzeCV('x')).rejects.toThrow();
  });

  it('falha alto se a IA não devolver nada', async () => {
    generateContent.mockResolvedValueOnce({ text: undefined });
    await expect(analyzeCV('x')).rejects.toThrow(/não devolveu resposta/);
  });
});
