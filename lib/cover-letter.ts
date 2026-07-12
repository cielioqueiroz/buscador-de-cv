import { z } from 'zod';
import { JobSchema, CVProfileSchema } from '@/lib/providers/types';

export const ToneEnum = z.enum(['formal', 'entusiasmado', 'direto']);
export type Tone = z.infer<typeof ToneEnum>;

export const LengthEnum = z.enum(['curta', 'media']);
export type Length = z.infer<typeof LengthEnum>;

/**
 * A carta volta estruturada, não como um bloco de texto.
 *
 * Dois motivos. As `keywords` precisam viajar separadas do corpo — são elas que
 * viram os chips de ATS na tela, e extraí-las de volta de um texto corrido seria
 * adivinhação. E parágrafos em array evitam a bagunça de quebras de linha que o
 * modelo inventa quando escreve prosa livre: aqui, um item é um parágrafo.
 */
export const CoverLetterSchema = z.object({
  greeting: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(2).max(5),
  closing: z.string().min(1),
  /** Termos tirados da vaga que o texto de fato incorpora. */
  keywords: z.array(z.string()),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export const CoverLetterRequestSchema = z.object({
  profile: CVProfileSchema,
  job: JobSchema,
  tone: ToneEnum,
  length: LengthEnum,
});

export const TONE_LABELS: Record<Tone, string> = {
  formal: 'Formal',
  entusiasmado: 'Entusiasmado',
  direto: 'Direto ao ponto',
};

export const LENGTH_LABELS: Record<Length, string> = {
  curta: 'Curta',
  media: 'Média',
};

/** A carta como o usuário vai colar num e-mail ou num campo de candidatura. */
export function coverLetterToText(letter: CoverLetter): string {
  return [letter.greeting, ...letter.paragraphs, letter.closing].join('\n\n');
}

/**
 * Nome do arquivo baixado. Sem acento e sem barra: o nome da empresa vem das
 * fontes e já apareceu como "Tech / Solutions Ltda." — uma barra no nome quebra
 * o download em alguns navegadores.
 */
export function coverLetterFilename(company: string): string {
  const slug = company
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40)
    .replace(/-+$/g, '');

  return `carta-${slug || 'vaga'}.txt`;
}
