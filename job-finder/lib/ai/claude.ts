import Anthropic from '@anthropic-ai/sdk';
import { CVProfile, CVProfileSchema, Job, MatchResult, MatchResultSchema } from '@/lib/providers/types';

const MODEL = 'claude-sonnet-4-6';

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Resposta da IA sem JSON');
  return JSON.parse(match[0]);
}

export async function analyzeCV(rawText: string): Promise<CVProfile> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'Você analisa currículos e responde APENAS com JSON válido.',
    messages: [{
      role: 'user',
      content: `Analise este CV e responda com JSON no formato:
{"title": string, "seniority": "estagio"|"junior"|"pleno"|"senior"|"lead", "skills": string[], "areas": string[], "searchQueries": string[]}
- "searchQueries": 3 a 5 termos de busca de vaga ideais para este perfil.

CV:
"""${rawText.slice(0, 12000)}"""`,
    }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('');
  const parsed = extractJson(text);
  return CVProfileSchema.parse({ ...parsed, rawText });
}
