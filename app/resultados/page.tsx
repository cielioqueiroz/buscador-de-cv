import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfile } from '@/lib/auth/profile';
import { ResultadosClient } from './ResultadosClient';

export default async function ResultadosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/resultados');
  const serverProfile = await getProfile(session.user.id).catch(() => null);
  return <ResultadosClient serverProfile={serverProfile} />;
}
