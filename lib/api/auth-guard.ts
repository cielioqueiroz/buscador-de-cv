import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Desde 2026-10-13 o app exige conta para usar a IA e as fontes de vaga: o
 * visitante vê a landing, mas analisar, buscar, pontuar e gerar texto custa
 * cota paga. A checagem fica no servidor — o modal da UI é só o convite.
 */
export async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Entre na sua conta para continuar.' },
    { status: 401 },
  );
}
