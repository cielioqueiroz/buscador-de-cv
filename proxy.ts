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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
