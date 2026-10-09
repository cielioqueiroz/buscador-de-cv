import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Redefinir senha',
  robots: { index: false, follow: false },
};

export default function RedefinirSenhaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-5">
        <div className="rounded-panel border border-border bg-surface p-6 shadow-float sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Redefinir senha
          </h1>
          <p className="mt-1 text-sm text-muted">Escolha uma senha nova para a sua conta.</p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
          <p className="mt-6 text-sm text-muted">
            Mudou de ideia?{' '}
            <Link href="/entrar" className="font-medium text-accent-ink underline-offset-2 hover:underline">
              Voltar para entrar
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
