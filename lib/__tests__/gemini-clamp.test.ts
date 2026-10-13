import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { clampToJsonSchema } from '@/lib/ai/clamp';
import { CVImprovementReportSchema } from '@/lib/cv-features';

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(async (_p: unknown): Promise<{ text: string | undefined }> => ({ text: undefined })),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent }; },
  ThinkingLevel: { LOW: 'LOW' },
}));

import { generateCVImprovementReport } from '@/lib/ai/gemini';

const profile = {
  title: 'Dev',
  seniority: 'pleno' as const,
  skills: ['react'],
  areas: ['ti'],
  searchQueries: ['dev react'],
  rawText: 'Desenvolvedor React com 4 anos de experiência.',
};

describe('clampToJsonSchema', () => {
  const schema = z.toJSONSchema(CVImprovementReportSchema) as Parameters<typeof clampToJsonSchema>[1];

  it('encurta string acima do maxLength com reticências', () => {
    const out = clampToJsonSchema({ missingKeywords: ['a'.repeat(120)] }, schema) as { missingKeywords: string[] };
    expect(out.missingKeywords[0].length).toBe(80);
    expect(out.missingKeywords[0].endsWith('…')).toBe(true);
  });

  it('corta na palavra inteira quando dá', () => {
    const phrase = 'gestão de projetos ágeis com '.repeat(5);
    const out = clampToJsonSchema({ missingKeywords: [phrase] }, schema) as { missingKeywords: string[] };
    expect(out.missingKeywords[0].length).toBeLessThanOrEqual(80);
    expect(out.missingKeywords[0]).toMatch(/\S…$/);
    expect(out.missingKeywords[0]).not.toMatch(/ …$/);
  });

  it('limita listas ao maxItems e remove itens vazios', () => {
    const out = clampToJsonSchema(
      { missingKeywords: ['  ', ...Array.from({ length: 20 }, (_, i) => `termo ${i}`)] },
      schema,
    ) as { missingKeywords: string[] };
    expect(out.missingKeywords).toHaveLength(12);
    expect(out.missingKeywords[0]).toBe('termo 0');
  });

  it('desce em objetos dentro de listas', () => {
    const out = clampToJsonSchema(
      { improvements: [{ priority: 'alta', area: 'x'.repeat(300), problem: 'p', action: 'a' }] },
      schema,
    ) as { improvements: { area: string }[] };
    expect(out.improvements[0].area.length).toBe(100);
  });

  it('não mexe em tipos errados — isso continua sendo erro do zod', () => {
    expect(clampToJsonSchema({ missingKeywords: 'não é lista' }, schema)).toEqual({ missingKeywords: 'não é lista' });
  });
});

describe('generateCVImprovementReport', () => {
  it('aceita resposta com palavra-chave longa demais (bug de produção 2026-10-13)', async () => {
    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        summary: 'Currículo claro, mas com poucos resultados medidos.',
        strengths: ['Experiência sólida com React'],
        improvements: [{ priority: 'alta', area: 'Resultados', problem: 'Faltam números.', action: 'Inclua métricas reais.' }],
        missingKeywords: [
          'testes',
          'Experiência comprovada em arquitetura de micro-frontends com Module Federation em produção',
        ],
      }),
    });
    const report = await generateCVImprovementReport(profile);
    expect(report.missingKeywords).toHaveLength(2);
    expect(report.missingKeywords[1].length).toBeLessThanOrEqual(80);
  });

  it('continua recusando enum inválido', async () => {
    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        summary: 'ok',
        strengths: [],
        improvements: [{ priority: 'urgente', area: 'a', problem: 'p', action: 'a' }],
        missingKeywords: [],
      }),
    });
    await expect(generateCVImprovementReport(profile)).rejects.toThrow();
  });
});
