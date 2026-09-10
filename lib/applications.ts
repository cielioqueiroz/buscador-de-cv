'use client';

import { z } from 'zod';
import type { RankedJob } from '@/lib/matching';
import { JobSchema, MatchResultSchema } from '@/lib/providers/types';

export const APPLICATION_STAGES = ['aplicado', 'entrevista', 'oferta'] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const ApplicationStageSchema = z.enum(APPLICATION_STAGES);
export const ApplicationSchema = z.object({
  id: z.string().trim().min(1).max(500),
  job: JobSchema,
  match: MatchResultSchema,
  stage: ApplicationStageSchema,
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
});
export type Application = z.infer<typeof ApplicationSchema>;

const APPLICATIONS_KEY = 'jf_applications';

export function listApplications(): Application[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (!raw) return [];
    const parsed = z.array(ApplicationSchema).max(200).safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data.sort((a, b) => b.updatedAt - a.updatedAt);
    localStorage.removeItem(APPLICATIONS_KEY);
  } catch {
    try { localStorage.removeItem(APPLICATIONS_KEY); } catch { /* storage indisponível */ }
  }
  return [];
}

export function getApplication(jobId: string): Application | null {
  return listApplications().find((application) => application.id === jobId) ?? null;
}

export function saveApplication(ranked: RankedJob, stage: ApplicationStage = 'aplicado'): Application {
  const now = Date.now();
  const current = getApplication(ranked.job.id);
  const application: Application = {
    id: ranked.job.id,
    job: ranked.job,
    match: ranked.match,
    stage: current?.stage ?? stage,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
  persistApplications([...listApplications().filter((item) => item.id !== application.id), application]);
  return application;
}

export function updateApplicationStage(jobId: string, stage: ApplicationStage): Application[] {
  const applications = listApplications().map((application) => (
    application.id === jobId ? { ...application, stage, updatedAt: Date.now() } : application
  ));
  persistApplications(applications);
  return applications;
}

export function removeApplication(jobId: string): Application[] {
  const applications = listApplications().filter((application) => application.id !== jobId);
  persistApplications(applications);
  return applications;
}

function persistApplications(applications: Application[]): void {
  try {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  } catch {
    console.warn('[applications] não foi possível salvar o tracker');
  }
}
