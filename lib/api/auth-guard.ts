import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { pool } from '@/lib/db/client';

/**
 * Desde 2026-10-13 o app exige conta para usar a IA e as fontes de vaga: o
 * visitante vê a landing, mas analisar, buscar, pontuar e gerar texto custa
 * cota paga. A checagem fica no servidor — o modal da UI é só o convite.
 *
 * A sessão é um JWT de 30 dias: depois que a conta é excluída num aparelho, o
 * token de outro aparelho continua válido. Por isso conferimos no banco que o
 * usuário ainda existe — uma consulta por chamada, barata perto da chamada de IA
 * que ela protege.
 */
export async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const result = await pool.query('select 1 from users where id = $1', [id]);
  return (result.rowCount ?? 0) > 0 ? id : null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Entre na sua conta para continuar.' },
    { status: 401 },
  );
}
