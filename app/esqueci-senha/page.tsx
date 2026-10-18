import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { isPasswordResetEnabled } from '@/lib/auth/features';
import { AuthCard } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'Esqueci minha senha',
  robots: { index: false, follow: false },
};

export default function EsqueciSenhaPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-5 scroll-mt-24 outline-none">
        <AuthCard>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Esqueci minha senha
          </h1>
          <p className="mt-1 text-sm text-muted">
            Digite seu e-mail; mandamos um link que vale por 30 minutos.
          </p>
          <div className="mt-6">
            {isPasswordResetEnabled() ? (
              <ForgotPasswordForm />
            ) : (
              <p role="status" className="rounded-pill bg-background px-4 py-3 text-sm text-foreground">
                A redefinição de senha por e-mail ainda não está disponível.
              </p>
            )}
          </div>
          <p className="mt-6 text-sm text-muted">
            Lembrou?{' '}
            <Link href="/entrar" className="font-medium text-accent-ink underline-offset-2 hover:underline">
              Voltar para entrar
            </Link>
          </p>
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
