import Link from 'next/link';
import { FiCpu, FiShield, FiZap, FiTarget } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CVUpload } from '@/components/CVUpload';
import { LogoMarquee } from '@/components/LogoMarquee';

const STEPS = [
  {
    n: '01',
    title: 'Envie seu currículo',
    desc: 'PDF, DOCX ou TXT. Ele é lido no servidor — suas chaves e dados não vão para o navegador.',
  },
  {
    n: '02',
    title: 'A IA lê o seu perfil',
    desc: 'O Gemini extrai cargo, senioridade, habilidades e gera as melhores buscas para você.',
  },
  {
    n: '03',
    title: 'Vagas reais com score',
    desc: 'Buscamos em fontes legais e pontuamos cada vaga — com o link oficial de candidatura.',
  },
];

const FEATURES = [
  { icon: FiCpu, title: 'Análise com IA de verdade', desc: 'Nada de palavra-chave boba. O Gemini entende contexto, senioridade e o que você sabe fazer.' },
  { icon: FiShield, title: 'Só fontes legais', desc: 'Agregadores oficiais e Google for Jobs. Sem scraping, sem cair em site duvidoso.' },
  { icon: FiTarget, title: 'Score explicado', desc: 'Cada vaga vem com a nota de match, os motivos a favor e o que falta no seu CV.' },
  { icon: FiZap, title: 'Sem cadastro', desc: 'Comece em segundos. Seus dados ficam no seu navegador, sob seu controle.' },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative mx-auto max-w-6xl px-5 pt-12 pb-12 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent-bright/20 blur-3xl"
          />
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-bright animate-pulse-ring" />
                vagas reais · fontes legais
              </span>
              <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Seu currículo
                <br />
                vira um <span className="text-accent-ink">radar</span>
                <br />
                de vagas.
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted">
                Solte o CV, a IA entende quem você é e encontra as vagas que mais combinam — com
                nota de compatibilidade e o porquê de cada uma.
              </p>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-3 sm:gap-6">
                <Stat value="3" label="fontes agregadas" />
                <Stat value="0–100" label="score por vaga" />
                <Stat value="100%" label="link oficial" />
              </div>
            </div>

            <div className="animate-rise" style={{ animationDelay: '120ms' }}>
              <CVUpload />
              <p className="mt-3 text-center font-mono text-xs text-muted">
                Sem cadastro. Seus dados ficam no seu navegador.
              </p>
            </div>
          </div>
        </section>

        {/* CARROSSEL de fontes */}
        <LogoMarquee />

        {/* COMO FUNCIONA */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="hover-lift rounded-2xl border border-border bg-surface p-6">
                <span className="font-mono text-sm text-accent-ink">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="border-y border-border bg-surface-2/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Por que a <span className="text-accent-ink">Vaga Certa</span>
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="hover-lift rounded-2xl border border-border bg-surface p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center sm:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-bright/20 blur-3xl"
            />
            <h2 className="relative font-display text-3xl font-extrabold sm:text-5xl">
              Pronto para achar a sua vaga?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-muted">
              Leva menos de um minuto. Sem cadastro, sem enrolação.
            </p>
            <Link
              href="/"
              className="hover-glow relative mt-7 inline-flex items-center rounded-full bg-accent px-7 py-3 font-display text-base font-bold text-accent-foreground"
            >
              Enviar meu currículo
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
