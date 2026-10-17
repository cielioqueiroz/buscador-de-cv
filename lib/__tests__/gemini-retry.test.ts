import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { AIUnavailableError, analyzeCV, withRetry } from '@/lib/ai/gemini';

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

    // e desiste com um erro que as rotas sabem traduzir para 503 + mensagem clara
    await expect(analyzeCV('x')).rejects.toBeInstanceOf(AIUnavailableError);
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('erro que não é transitório chega como veio, sem virar "IA sobrecarregada"', async () => {
    generateContent.mockRejectedValue(apiError(400));
    await expect(analyzeCV('x')).rejects.not.toBeInstanceOf(AIUnavailableError);
  });

  it('cada chamada leva um sinal de cancelamento para o SDK', async () => {
    generateContent.mockResolvedValueOnce(OK);
    await analyzeCV('x');
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
  });
});

// Regressão: em produção o /api/jobs/match passou dos 60s da Vercel (504 mudo)
// somando uma chamada lenta com as esperas do retry.
describe('orçamento de tempo do retry', () => {
  it('chamada que não responde é abortada no fim do orçamento e vira AIUnavailableError', async () => {
    const travada = (signal: AbortSignal) =>
      new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));

    const inicio = Date.now();
    await expect(withRetry(travada, 50)).rejects.toBeInstanceOf(AIUnavailableError);
    expect(Date.now() - inicio).toBeLessThan(2_000);
  });

  it('não espera um 429 que manda voltar depois do prazo: desiste na hora', async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error('Please retry in 45s'), { status: 429 });
    });

    await expect(withRetry(fn, 20_000)).rejects.toBeInstanceOf(AIUnavailableError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
