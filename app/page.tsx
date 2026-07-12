import Link from 'next/link';
import { FiCpu, FiShield, FiZap, FiTarget } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CVUpload } from '@/components/CVUpload';
import { LogoMarquee } from '@/components/LogoMarquee';
import { HeroFieldLazy } from '@/components/HeroFieldLazy';
import { Reveal } from '@/components/Reveal';
import { Magnetic } from '@/components/Magnetic';

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
  {
    n: '04',
    title: 'Carta sob medida',
    desc: 'Se você quiser, a IA escreve a carta de apresentação daquela vaga — no seu tom, com as palavras que a empresa pediu.',
  },
];

/**
 * Precisa existir na página, visível: o schema FAQPage declara estas perguntas,
 * e o Google trata FAQ marcado sem conteúdo correspondente como violação. Serve
 * também para responder o que as pessoas de fato buscam no Google.
 */
const FAQ = [
  {
    q: 'Como encontrar vagas de emprego usando o currículo?',
    a: 'Envie seu currículo em PDF, DOCX ou TXT. A IA lê o documento, extrai seu cargo, senioridade e habilidades, e gera as melhores buscas para o seu perfil. Depois busca vagas reais em agregadores legais e pontua cada uma de 0 a 100 conforme a compatibilidade com o que você sabe fazer.',
  },
  {
    q: 'O Vaga Certa é gratuito?',
    a: 'Sim, e sem cadastro. Seus dados ficam no seu próprio navegador. O currículo é lido no servidor apenas para gerar a análise — não guardamos o arquivo.',
  },
  {
    q: 'De onde vêm as vagas?',
    a: 'De agregadores legais: Adzuna (vagas no Brasil), Remotive (remotas) e Google for Jobs, que indexa LinkedIn, Indeed, Glassdoor, Gupy e Catho. Nada de scraping — o botão de candidatura sempre leva ao anúncio oficial.',
  },
  {
    q: 'O que significa a nota de compatibilidade?',
    a: 'É uma nota de 0 a 100 que a IA dá comparando o seu currículo com a descrição da vaga. Junto dela você vê os motivos a favor (o que combina) e as lacunas (o que a vaga pede e falta no seu CV).',
  },
  {
    q: 'Como funciona a carta de apresentação com IA?',
    a: 'Em cada vaga há um botão "Gerar carta". Ele só faz algo se você clicar — candidatar-se não gera carta nenhuma. A IA lê o seu currículo e a descrição daquela vaga e escreve uma carta específica para ela, no tom que você escolher (formal, entusiasmado ou direto) e no tamanho que preferir. Você vê quais palavras-chave da vaga entraram no texto, pode editar tudo à mão, regenerar, copiar ou baixar em .txt e PDF.',
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
          {/* O radar do slogan, em partículas. Chega depois do LCP (ssr: false). */}
          <HeroFieldLazy />
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
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Como funciona</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="hover-lift h-full rounded-2xl border border-border bg-surface p-6">
                  <span className="font-mono text-sm text-accent-ink">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="border-y border-border bg-surface-2/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                Por que a <span className="text-accent-ink">Vaga Certa</span>
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 80}>
                  <div className="hover-lift h-full rounded-2xl border border-border bg-surface p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — conteúdo indexável e base do schema FAQPage */}
        <section className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Perguntas frequentes
          </h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-bold marker:content-['']">
                  <h3 className="text-base font-bold sm:text-lg">{q}</h3>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
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
            <div className="relative mt-7">
              <Magnetic>
                <Link
                  href="/"
                  className="hover-glow inline-flex items-center rounded-full bg-accent px-7 py-3 font-display text-base font-bold text-accent-foreground"
                >
                  Enviar meu currículo
                </Link>
              </Magnetic>
            </div>
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
