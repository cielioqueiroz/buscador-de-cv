import { NextResponse } from 'next/server';
import { AIUnavailableError } from '@/lib/ai/gemini';

/**
 * Resposta das rotas de IA quando o Gemini esgotou as tentativas: 503 com uma
 * mensagem que diz o que fazer, e não o 500 "Falha" de um erro nosso.
 */
export function aiUnavailableResponse(err: unknown): NextResponse | null {
  if (!(err instanceof AIUnavailableError)) return null;
  console.warn('[gemini] indisponível depois das tentativas:', err.cause);
  return NextResponse.json({ error: err.message }, { status: 503, headers: { 'Retry-After': '60' } });
}
