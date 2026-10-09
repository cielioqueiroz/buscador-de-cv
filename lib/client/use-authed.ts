'use client';
import { useSession } from 'next-auth/react';

/**
 * `true` quando há sessão autenticada confirmada; `false` enquanto
 * `useSession` ainda carrega ou quando é convidado. É esse `false` que mantém
 * o modo convidado funcionando — nada do servidor é tentado antes de termos
 * certeza de que vale a pena.
 */
export function useAuthed(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}
