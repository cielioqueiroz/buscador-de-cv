import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Cota diária de IA por conta. O limite por minuto de cada rota segura
 * rajadas; este segura o uso contínuo — sem ele, uma conta podia chamar o
 * Gemini milhares de vezes por dia, e a cota paga é de todos.
 *
 * O "dia" é o de calendário em Brasília: a mensagem pode dizer "renova à
 * meia-noite", que é mais claro do que uma janela deslizante de 24 h. A data
 * entra na chave, então cada dia começa do zero.
 */
export const AI_DAILY_QUOTA = {
  analyze: 10,
  match: 30,
  letter: 20,
  adapt: 20,
  report: 5,
} as const;

export type AIAction = keyof typeof AI_DAILY_QUOTA;

const LABEL: Record<AIAction, string> = {
  analyze: 'análises de currículo',
  match: 'buscas de vagas',
  letter: 'cartas de apresentação',
  adapt: 'adaptações de currículo',
  report: 'relatórios do currículo',
};

const TIME_ZONE = 'America/Sao_Paulo';
const DAY_MS = 86_400_000;

/** Data de hoje em Brasília, no formato AAAA-MM-DD. */
export function saoPauloDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

/** Segundos até a próxima meia-noite em Brasília. */
export function secondsUntilSaoPauloMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = get('hour') * 3600 + get('minute') * 60 + get('second');
  return Math.max(1, 86_400 - elapsed);
}

/**
 * Consome uma unidade da cota de hoje. Devolve a resposta 429 quando a conta
 * já usou tudo, ou null para seguir. Chame logo antes da chamada à IA: pedido
 * inválido não deve gastar cota.
 */
export async function aiQuotaExceeded(
  userId: string,
  action: AIAction,
  now = new Date(),
): Promise<NextResponse | null> {
  const limit = AI_DAILY_QUOTA[action];
  // Janela um pouco maior que o dia: a chave já muda à meia-noite.
  const ok = await checkRateLimit(`quota:${action}:${userId}:${saoPauloDay(now)}`, limit, DAY_MS + 3_600_000);
  if (ok) return null;
  return NextResponse.json(
    {
      error: `Você chegou ao limite de hoje: ${limit} ${LABEL[action]} por dia. O limite renova à meia-noite (horário de Brasília).`,
    },
    { status: 429, headers: { 'Retry-After': String(secondsUntilSaoPauloMidnight(now)) } },
  );
}
