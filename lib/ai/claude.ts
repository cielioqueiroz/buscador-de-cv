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

export async function matchJob(cv: CVProfile, job: Job): Promise<MatchResult> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system: 'Você compara um CV com uma vaga e responde APENAS com JSON válido.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `CV do candidato:\n"""${cv.rawText.slice(0, 12000)}"""`,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `Vaga:\nTítulo: ${job.title}\nEmpresa: ${job.company}\nDescrição: ${job.description.slice(0, 6000)}

Responda com JSON: {"score": number 0-100, "reasons": string[] (por que combina), "gaps": string[] (o que falta no CV)}`,
        },
      ] as any,
    }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('');
  const parsed = extractJson(text);
  return MatchResultSchema.parse({ ...parsed, jobId: job.id });
}
