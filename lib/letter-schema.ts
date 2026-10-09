import { z } from 'zod';
import { CoverLetterSchema, LengthEnum, ToneEnum, type CoverLetter, type Length, type Tone } from '@/lib/cover-letter';

/**
 * Cartas escritas, indexadas por vaga.
 *
 * Guardar é o que permite fechar o painel e voltar sem pagar outra chamada à
 * IA — e é também o que preserva a edição do usuário: o texto salvo é o que
 * está na tela, não o que o modelo devolveu.
 */
export interface SavedLetter {
  letter: CoverLetter;
  /** O texto como o usuário deixou (pode ter sido editado à mão). */
  text: string;
  tone: Tone;
  length: Length;
  savedAt: number;
}

export const SavedLetterSchema = z.object({
  letter: CoverLetterSchema,
  text: z.string().max(12_000),
  tone: ToneEnum,
  length: LengthEnum,
  savedAt: z.number().finite(),
}) satisfies z.ZodType<SavedLetter>;

export const LetterMapSchema = z.record(z.string().max(500), SavedLetterSchema);
export type LetterMap = z.infer<typeof LetterMapSchema>;
