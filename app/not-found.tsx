import type { Metadata } from 'next';
import Link from 'next/link';
import { FiCompass, FiHome, FiSearch } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: true },
};

/**
 * O 404 padrão do Next era só "404", em inglês, com o título da home e nenhum
 * link: quem chegava por um link quebrado ficava sem saída. Aqui a pessoa
 * continua no site, com o cabeçalho e dois caminhos de volta.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="grid flex-1 place-items-center px-5 py-24 scroll-mt-24 outline-none">
        <div className="w-full max-w-md rounded-panel border border-border bg-surface p-8 text-center sm:p-10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-card bg-accent/15 text-accent-ink">
            <FiCompass className="h-6 w-6" aria-hidden />
          </span>

          <h1 className="mt-5 font-display text-2xl font-extrabold">Essa página não existe</h1>
          <p className="mt-2 text-sm text-muted">
            O link pode estar quebrado ou a página mudou de lugar. Suas vagas e o seu perfil continuam
            na sua conta.
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/resultados"
              className="hover-glow inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-display text-sm font-bold text-accent-foreground"
            >
              <FiSearch className="h-4 w-4" aria-hidden /> Ver vagas
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-2.5 font-display text-sm font-bold transition-colors hover:border-accent-ink"
            >
              <FiHome className="h-4 w-4" aria-hidden /> Voltar ao início
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
