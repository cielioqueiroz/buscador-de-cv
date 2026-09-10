import { z } from 'zod';
import { CVProfileSchema, JobSchema } from '@/lib/providers/types';

const ShortText = z.string().trim().min(1).max(240);
const LongText = z.string().trim().min(1).max(1_200);

export const AdaptedCVSchema = z.object({
  headline: ShortText.max(160),
  summary: LongText,
  skills: z.array(ShortText.max(100)).max(30),
  experienceHighlights: z.array(LongText.max(600)).max(8),
  keywords: z.array(ShortText.max(80)).max(12),
  cautions: z.array(LongText.max(400)).max(6),
});
export type AdaptedCV = z.infer<typeof AdaptedCVSchema>;

export const AdaptCVRequestSchema = z.object({
  profile: CVProfileSchema,
  job: JobSchema,
});

const ImprovementSchema = z.object({
  priority: z.enum(['alta', 'media', 'baixa']),
  area: ShortText.max(100),
  problem: LongText.max(500),
  action: LongText.max(700),
});

export const CVImprovementReportSchema = z.object({
  summary: LongText,
  strengths: z.array(LongText.max(400)).max(6),
  improvements: z.array(ImprovementSchema).max(8),
  missingKeywords: z.array(ShortText.max(80)).max(12),
});
export type CVImprovementReport = z.infer<typeof CVImprovementReportSchema>;

export const CVImprovementRequestSchema = z.object({
  profile: CVProfileSchema,
});
