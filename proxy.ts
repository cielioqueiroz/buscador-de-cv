import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Garante HTTPS quando o app está atrás de um proxy TLS terminator.
 *
 * O proxy confiável deve informar o protocolo original em
 * `x-forwarded-proto`. Em desenvolvimento o redirecionamento fica desligado
 * para preservar o uso normal de `http://localhost`.
 */
export function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = 'https:';
    return NextResponse.redirect(secureUrl, 308);
  }

  // Logado não vê a landing: a home dele é o painel. Aqui basta o cookie
  // existir — quem valida a sessão é o /perfil, que manda para /entrar se o
  // cookie estiver vencido. /entrar não redireciona de volta, então não há laço.
  if (request.nextUrl.pathname === '/' && hasSessionCookie(request)) {
    const panel = request.nextUrl.clone();
    panel.pathname = '/perfil';
    return NextResponse.redirect(panel, 307);
  }

  return NextResponse.next();
}

/** Auth.js usa `authjs.session-token` (ou `__Secure-` em HTTPS), às vezes em pedaços `.0`, `.1`. */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.includes('authjs.session-token'));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
