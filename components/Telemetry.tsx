'use client';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Métricas de uso e de desempenho da Vercel: sem cookies, sem identificar
 * ninguém, enviadas para o próprio domínio (o CSP 'self' já cobre).
 *
 * A query string sai antes do envio: o link de redefinir senha leva o token
 * nela, e callbackUrl/erros de login também não interessam às métricas.
 */
function semQuery<T extends { url: string }>(event: T): T {
  return { ...event, url: event.url.split(/[?#]/)[0] };
}

export function Telemetry() {
  return (
    <>
      <Analytics beforeSend={(event: BeforeSendEvent) => semQuery(event)} />
      <SpeedInsights beforeSend={(event) => semQuery(event)} />
    </>
  );
}
