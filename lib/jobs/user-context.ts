import { ApiRequestError } from '@/lib/api/request';
import { getProfile } from '@/lib/auth/profile';
import { findUserJob } from '@/lib/jobs/store';
import type { CVProfile, Job } from '@/lib/providers/types';

/**
 * O que as rotas de IA mandam ao modelo vem daqui, não do corpo da requisição:
 * o perfil salvo na conta e uma vaga que o usuário de fato viu. Antes o
 * navegador mandava os dois, e o app virava um gerador de texto para o que
 * quer que alguém escrevesse no campo "descrição da vaga".
 */
export async function requireProfile(userId: string): Promise<CVProfile> {
  const profile = await getProfile(userId);
  if (!profile) throw new ApiRequestError('Envie seu currículo primeiro.', 409);
  return profile;
}

export async function requireProfileAndJob(
  userId: string,
  jobId: string,
): Promise<{ profile: CVProfile; job: Job }> {
  const [profile, job] = await Promise.all([requireProfile(userId), findUserJob(userId, jobId)]);
  if (!job) throw new ApiRequestError('Vaga não encontrada. Busque as vagas de novo.', 404);
  return { profile, job };
}
