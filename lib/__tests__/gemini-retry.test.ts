import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { analyzeCV } from '@/lib/ai/gemini';

const OK = {
  text: JSON.stringify({
    title: 'Dev', seniority: 'pleno', skills: ['React'],
    areas: ['ti'], searchQueries: ['react'],
  }),
};

/** Reproduz o erro do SDK: um objeto com `.status`. */
const apiError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

beforeEach(() => {
  generateContent.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('retry do Gemini', () => {
  // O 503 "high demand" apareceu de verdade em teste contra a API. Sem retry,
  // um pico derrubaria as 15 pontuações de uma busca de uma só vez.
  it('repete quando o modelo responde 503 e entrega o resultado', async () => {
    generateContent
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce(OK);

    const profile = await analyzeCV('dev react');
    expect(profile.title).toBe('Dev');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('também repete em 429 (cota estourada)', async () => {
    generateContent
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(OK);

    await expect(analyzeCV('x')).resolves.toBeDefined();
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('NÃO repete em 400 — erro nosso não melhora tentando de novo', async () => {
    generateContent.mockRejectedValue(apiError(400));

    await expect(analyzeCV('x')).rejects.toThrow();
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('desiste depois de 3 tentativas, em vez de repetir para sempre', async () => {
    generateContent.mockRejectedValue(apiError(503));

    await expect(analyzeCV('x')).rejects.toThrow();
    expect(generateContent).toHaveBeenCalledTimes(3);
  });
});
