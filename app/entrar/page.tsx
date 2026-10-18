import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleEnabled, isPasswordResetEnabled } from "@/lib/auth/features";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Vaga Certa para encontrar seu histórico de candidaturas.",
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  const googleEnabled = isGoogleEnabled();
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-5 scroll-mt-24 outline-none">
        <AuthCard>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-muted">
            {googleEnabled
              ? "Use seu e-mail e senha, ou entre com Google."
              : "Use seu e-mail e senha."}
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm
                googleEnabled={googleEnabled}
                passwordResetEnabled={isPasswordResetEnabled()}
              />
            </Suspense>
          </div>
          <p className="mt-6 text-sm text-muted">
            Ainda não tem conta?{" "}
            <Link href="/cadastrar" className="font-medium text-accent-ink underline-offset-2 hover:underline">
              Criar conta
            </Link>
          </p>
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
