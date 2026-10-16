import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfile } from '@/lib/auth/profile';
import { getAccount } from '@/lib/auth/users';
import { getDashboardStats, type DashboardStats } from '@/lib/auth/dashboard';
import { isGoogleEnabled } from '@/lib/auth/features';
import { daysSince } from '@/lib/jobs/new-jobs';
import { PerfilClient } from './PerfilClient';

export const metadata: Metadata = {
  title: 'Meu perfil',
  robots: { index: false, follow: false },
};

const EMPTY_STATS: DashboardStats = {
  applied: 0,
  interviews: 0,
  offers: 0,
  favorites: 0,
  profileUpdatedAt: null,
  newJobs: 0,
  rankingUpdatedAt: null,
};

// Formatado aqui, com fuso fixo: no cliente o fuso do navegador mudaria o
// texto entre o HTML do servidor e a hidratação.
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/perfil');
  const userId = session.user.id;

  const [account, profile, stats] = await Promise.all([
    getAccount(userId),
    getProfile(userId).catch(() => null),
    getDashboardStats(userId).catch(() => EMPTY_STATS),
  ]);
  if (!account) redirect('/entrar?callbackUrl=/perfil');

  return (
    <PerfilClient
      account={{ name: account.name, email: account.email, image: account.image }}
      profile={profile}
      stats={stats}
      updatedLabel={stats.profileUpdatedAt ? DATE_FMT.format(new Date(stats.profileUpdatedAt)) : null}
      googleEnabled={isGoogleEnabled()}
      // em dias, calculado aqui: servidor e hidratação mostram o mesmo número
      rankingAgeDays={daysSince(stats.rankingUpdatedAt)}
    />
  );
}
