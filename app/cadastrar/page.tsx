import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignupForm } from "@/components/auth/SignupForm";
import { isGoogleEnabled } from "@/lib/auth/features";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie uma conta no Vaga Certa para guardar seu CV e candidaturas.",
  robots: { index: false, follow: false },
};

export default function CadastrarPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-5 scroll-mt-24 outline-none">
        <AuthCard>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-muted">
            Grátis. Seu CV, vagas e candidaturas ficam salvos na sua conta.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <SignupForm googleEnabled={isGoogleEnabled()} />
            </Suspense>
          </div>
          <p className="mt-6 text-sm text-muted">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-accent-ink underline-offset-2 hover:underline">
              Entrar
            </Link>
          </p>
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
