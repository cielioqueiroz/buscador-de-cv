'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const LINK =
  'hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-flex sm:px-4';

/** Atalhos que só fazem sentido com conta — para o visitante, a porta é o "Entrar". */
export function HeaderLinks() {
  const { status } = useSession();
  if (status !== 'authenticated') return null;
  return (
    <>
      <Link href="/perfil" className={LINK}>
        Meu perfil
      </Link>
      <Link href="/candidaturas" className={LINK}>
        Tracker
      </Link>
    </>
  );
}
