import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ApplicationTracker } from '@/components/ApplicationTracker';

export default function CandidaturasPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <Link href="/resultados" className="group mb-2 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground">
          <FiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> voltar para as vagas
        </Link>
        <div className="mb-8 mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Seu processo seletivo</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold">Tracker de candidaturas</h1>
            <p className="mt-2 max-w-xl text-muted">Organize cada oportunidade do primeiro clique até a oferta. Seus dados ficam neste navegador.</p>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted">Arraste para mover</span>
        </div>
        <ApplicationTracker />
      </main>
      <SiteFooter />
    </>
  );
}
