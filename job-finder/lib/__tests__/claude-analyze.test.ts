import { describe, it, expect, vi } from 'vitest';

const createMock = vi.fn(async () => ({
  content: [{ type: 'text', text: JSON.stringify({
    title: 'Desenvolvedor Frontend', seniority: 'pleno',
    skills: ['React', 'TypeScript'], areas: ['ti'],
    searchQueries: ['desenvolvedor react', 'frontend typescript'],
  }) }],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: createMock }; },
}));

import { analyzeCV } from '@/lib/ai/claude';

describe('analyzeCV', () => {
  it('retorna um CVProfile válido a partir do texto', async () => {
    const profile = await analyzeCV('Sou dev React com 4 anos...');
    expect(profile.title).toBe('Desenvolvedor Frontend');
    expect(profile.seniority).toBe('pleno');
    expect(profile.searchQueries.length).toBeGreaterThan(0);
    expect(profile.rawText).toContain('React');
  });
});
