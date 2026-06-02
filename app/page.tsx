import { SiteHeader } from '@/components/SiteHeader';
import { CVUpload } from '@/components/CVUpload';

const STEPS = [
  {
    n: '01',
    title: 'Envie seu currículo',
    desc: 'PDF, DOCX ou TXT. Ele é lido no servidor — suas chaves e dados não vão para o navegador.',
  },
  {
    n: '02',
    title: 'A IA lê o seu perfil',
    desc: 'Claude extrai cargo, senioridade, habilidades e gera as melhores buscas para você.',
  },
  {
    n: '03',
    title: 'Vagas reais com score',
    desc: 'Buscamos em fontes legais e pontuamos cada vaga — com o link oficial de candidatura.',
  },
];

const MARQUEE = ['Adzuna', 'Google for Jobs', 'Remotive', 'LinkedIn', 'Indeed', 'Glassdoor', 'Gupy'];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent-bright/20 blur-3xl"
          />
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
                vagas reais · fontes legais
              </span>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Seu currículo
                <br />
                vira um <span className="text-accent">radar</span>
                <br />
                de vagas.
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted">
                Solte o CV, a IA entende quem você é e encontra as vagas que mais combinam — com
                nota de compatibilidade e o porquê de cada uma.
              </p>
            </div>

            <div className="animate-rise" style={{ animationDelay: '120ms' }}>
              <CVUpload />
              <p className="mt-3 text-center font-mono text-xs text-muted">
                Sem cadastro. Seus dados ficam no seu navegador.
              </p>
            </div>
          </div>
        </section>

        {/* MARQUEE de fontes */}
        <section className="overflow-hidden border-y border-border bg-surface py-4">
          <div className="flex w-max animate-marquee gap-10 pr-10 font-display text-2xl font-bold text-muted/60">
            {[...MARQUEE, ...MARQUEE].map((s, i) => (
              <span key={i} className="flex items-center gap-10">
                {s} <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent"
              >
                <span className="font-mono text-sm text-accent">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted">
          <p>
            Vagas vindas de agregadores legais (Adzuna, Google for Jobs via JSearch, Remotive). Sem
            scraping. Cada vaga leva ao link oficial de candidatura.
          </p>
        </div>
      </footer>
    </>
  );
}
