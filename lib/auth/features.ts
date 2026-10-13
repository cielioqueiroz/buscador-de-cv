/**
 * Recursos de conta que dependem de credenciais externas. Sem elas, a UI
 * esconde a opção em vez de mostrar um botão que falha.
 */

export function isGoogleEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** Em dev o link sai no console (ConsoleMailer); em produção exige Resend. */
export function isPasswordResetEnabled(): boolean {
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return true;
  return process.env.NODE_ENV !== 'production';
}
