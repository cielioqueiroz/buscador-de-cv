import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfile } from '@/lib/auth/profile';
import { loadRanking } from '@/lib/jobs/store';
import { listDismissedIds } from '@/lib/jobs/dismissals';
import { loadCardState, type CardState } from '@/lib/auth/sync';
import { ResultadosClient } from './ResultadosClient';

export default async function ResultadosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/resultados');
  const userId = session.user.id;
  // Tudo o que a tela precisa, já aqui: sem isso cada card buscava favoritos,
  // tracker e carta por conta própria (~45 requisições numa lista de 15).
  const vazio: CardState = { favorites: [], tracked: [], withLetter: [] };
  const [serverProfile, serverRanked, dismissed, cards] = await Promise.all([
    getProfile(userId).catch(() => null),
    loadRanking(userId).catch(() => null),
    listDismissedIds(userId).catch(() => [] as string[]),
    loadCardState(userId).catch(() => vazio),
  ]);
  return (
    <ResultadosClient
      serverProfile={serverProfile}
      serverRanked={serverRanked}
      serverDismissed={dismissed}
      serverCards={cards}
    />
  );
}
