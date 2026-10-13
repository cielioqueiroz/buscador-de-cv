import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Tracker de candidaturas',
  robots: { index: false, follow: false },
};

export default async function CandidaturasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/candidaturas');
  return children;
}
