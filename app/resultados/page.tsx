import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfile } from '@/lib/auth/profile';
import { loadRanking } from '@/lib/jobs/store';
import { listDismissedIds } from '@/lib/jobs/dismissals';
import { ResultadosClient } from './ResultadosClient';

export default async function ResultadosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/resultados');
  const userId = session.user.id;
  const [serverProfile, serverRanked, dismissed] = await Promise.all([
    getProfile(userId).catch(() => null),
    loadRanking(userId).catch(() => null),
    listDismissedIds(userId).catch(() => [] as string[]),
  ]);
  return (
    <ResultadosClient serverProfile={serverProfile} serverRanked={serverRanked} serverDismissed={dismissed} />
  );
}
