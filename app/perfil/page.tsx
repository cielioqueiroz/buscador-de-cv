import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getProfile } from '@/lib/auth/profile';
import { PerfilClient } from './PerfilClient';

export const metadata: Metadata = {
  title: 'Meu perfil',
  robots: { index: false, follow: false },
};

export default async function PerfilPage() {
  const session = await auth();
  const initialProfile = session?.user?.id
    ? await getProfile(session.user.id).catch(() => null)
    : null;

  return (
    <PerfilClient
      initialProfile={initialProfile}
      isLoggedIn={Boolean(session?.user?.id)}
    />
  );
}
