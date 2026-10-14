'use client';
import { useSession } from 'next-auth/react';

/**
 * `true` quando há sessão autenticada confirmada; `false` enquanto
 * `useSession` ainda carrega. Nada do servidor é tentado antes disso: no
 * intervalo, as telas leem o cache do localStorage.
 */
export function useAuthed(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}
