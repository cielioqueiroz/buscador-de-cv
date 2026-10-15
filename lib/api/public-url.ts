/**
 * Endereço público do app, para links que saem por e-mail.
 *
 * Ordem: AUTH_URL (definido à mão) → em produção, o domínio de produção que a
 * Vercel informa (VERCEL_PROJECT_PRODUCTION_URL) → o endereço do deploy
 * (VERCEL_URL, previews) → a origem da requisição (só em dev local).
 *
 * Por que não VERCEL_URL em produção: ele é o endereço exclusivo de cada
 * deploy, que fica atrás da proteção de login da Vercel — o link do e-mail
 * levava a uma tela de login da Vercel. E a origem da requisição vem do
 * cabeçalho Host: fora do dev, não serve para montar link com token.
 */
export function publicBaseUrl(req: Request, env: NodeJS.ProcessEnv = process.env): string {
  if (env.AUTH_URL) return env.AUTH_URL;
  if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return new URL(req.url).origin;
}
