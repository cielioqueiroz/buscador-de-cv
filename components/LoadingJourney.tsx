'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { STAGES, type Stage } from '@/lib/journey';
import { cn } from '@/lib/utils';

/**
 * A tela que ocupa a espera inteira — de soltar o currículo até as vagas.
 *
 * A regra que ela existe para cumprir: em nenhum instante o usuário pode achar
 * que travou. Então sempre há movimento (o personagem), sempre há uma frase
 * dizendo o que está acontecendo agora, e sempre dá para ver quanto já andou
 * (a trilha) e há quanto tempo (o cronômetro).
 */

const ROTULOS: Record<Stage, string> = {
  reading: 'Lendo seu currículo',
  profiling: 'Entendendo seu perfil',
  searching: 'Buscando vagas',
  scoring: 'Pontuando pra você',
};

const FALAS: Record<Stage, string[]> = {
  reading: [
    'Abrindo o arquivo com cuidado…',
    'Passando o olho nas suas experiências…',
    'Anotando cada habilidade que aparece…',
    'Currículo é história — e essa aqui tem enredo.',
  ],
  profiling: [
    'Juntando as peças do seu perfil…',
    'Descobrindo em que você é bom de verdade…',
    'Pensando nos termos certos pra buscar…',
    'Traduzindo seu CV para a língua das vagas.',
  ],
  searching: [
    'Vasculhando as fontes de vagas…',
    'Adzuna, Remotive, Google for Jobs…',
    'Nada de scraping: só link oficial.',
    'Peneirando o que não combina com você.',
  ],
  scoring: [
    'Comparando cada vaga com o seu perfil…',
    'Calculando o que joga a favor e o que falta…',
    'Dando nota de 0 a 100, com motivo.',
    'Separando as que realmente valem seu tempo.',
  ],
};

/** Embaralha as falas por montagem: a espera nunca se repete igual. */
function embaralhar<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LoadingJourney({ stage }: { stage: Stage }) {
  const atual = STAGES.indexOf(stage);
  const falas = useMemo(() => embaralhar(FALAS[stage]), [stage]);
  const [fala, setFala] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    setFala(0);
    const id = setInterval(() => setFala((i) => (i + 1) % falas.length), 2600);
    return () => clearInterval(id);
  }, [falas]);

  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Portal direto no <body>: quem monta este overlay pode estar dentro de um
  // ancestral com transform (o hero usa animate-rise, cujo fill mantém o
  // transform), e transform reancora position:fixed nele — o overlay sairia
  // espremido no lugar da caixa de upload em vez de cobrir a tela.
  if (!montado) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-background px-5"
    >
      {/* halo limão atrás do personagem */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_60%)]"
      />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <Personagem stage={stage} />

        <p className="mt-8 font-display text-2xl font-extrabold sm:text-3xl">
          {ROTULOS[stage]}
        </p>

        {/* a fala troca sozinha: é o sinal de vida entre uma etapa e outra */}
        <p key={`${stage}-${fala}`} className="animate-rise mt-2 min-h-[2.5rem] text-sm text-muted">
          {falas[fala]}
        </p>

        <Trilha atual={atual} />

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
          etapa {atual + 1} de {STAGES.length} · {segundos}s
        </p>
      </div>
    </div>,
    document.body,
  );
}

/** As quatro etapas: o que já passou, onde estamos, o que falta. */
function Trilha({ atual }: { atual: number }) {
  return (
    <ol className="mt-8 flex w-full items-center gap-2">
      {STAGES.map((s, i) => (
        <li key={s} className="flex-1">
          <span
            className={cn(
              'block h-1.5 rounded-full transition-all duration-500',
              // feita: limão apagado. atual: limão cheio, com brilho.
              // Sem essa diferença a trilha não diz onde você está.
              i < atual && 'bg-accent/35',
              i === atual &&
                'bg-accent shadow-[0_0_16px_-2px_color-mix(in_srgb,var(--accent)_80%,transparent)]',
              i > atual && 'bg-surface-2',
            )}
          />
          <span
            className={cn(
              'mt-2 block font-mono text-[10px] uppercase tracking-wider',
              i === atual ? 'text-foreground' : 'text-muted',
            )}
          >
            {ROTULOS[s].split(' ')[0]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Personagem({ stage }: { stage: Stage }) {
  const comum = 'h-40 w-40 sm:h-48 sm:w-48';
  if (stage === 'reading') return <Folha className={comum} />;
  if (stage === 'profiling') return <Robo className={comum} />;
  if (stage === 'searching') return <Lupa className={comum} />;
  return <Medidor className={comum} />;
}

/** Etapa 1 — a folha do currículo, varrida por um feixe limão. */
function Folha({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('animate-bob', className)} aria-hidden>
      <rect x="24" y="14" width="52" height="72" rx="5" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="38" cy="30" r="6" fill="var(--accent)" />
      <rect x="50" y="26" width="18" height="3.5" rx="1.75" fill="var(--surface-2)" />
      <rect x="50" y="33" width="12" height="3.5" rx="1.75" fill="var(--surface-2)" />
      {[46, 54, 62, 70].map((y, i) => (
        <rect key={y} x="32" y={y} width={i % 2 ? 28 : 36} height="3.5" rx="1.75" fill="var(--surface-2)" />
      ))}
      {/* o feixe que lê */}
      <g className="animate-scan-beam">
        <rect x="24" y="42" width="52" height="2.5" rx="1.25" fill="var(--accent)" />
        <rect x="24" y="42" width="52" height="10" fill="url(#brilho)" opacity="0.35" />
      </g>
      <defs>
        <linearGradient id="brilho" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Etapa 2 — o robô que pensa no seu perfil. */
function Robo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('animate-bob', className)} aria-hidden>
      {/* pensamentos subindo */}
      {[
        { cx: 30, cy: 34, r: 3, d: '0s' },
        { cx: 70, cy: 32, r: 4, d: '0.6s' },
        { cx: 24, cy: 44, r: 2.5, d: '1.2s' },
      ].map((b) => (
        <circle
          key={b.d}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill="var(--accent)"
          className="animate-think"
          style={{ animationDelay: b.d }}
        />
      ))}
      <rect x="20" y="6" width="4" height="0" fill="none" />
      {/* antena */}
      <line x1="50" y1="24" x2="50" y2="16" stroke="var(--border)" strokeWidth="2.5" />
      <circle cx="50" cy="14" r="4" fill="var(--accent)" className="animate-pulse-ring" />
      {/* cabeça */}
      <rect x="26" y="24" width="48" height="42" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <g className="animate-blink">
        <circle cx="40" cy="42" r="5" fill="var(--accent)" />
        <circle cx="60" cy="42" r="5" fill="var(--accent)" />
      </g>
      {/* sorriso */}
      <path d="M40 55 Q50 62 60 55" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* corpo */}
      <rect x="34" y="70" width="32" height="18" rx="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <rect x="42" y="77" width="16" height="4" rx="2" fill="var(--accent)" />
    </svg>
  );
}

/** Etapa 3 — a lupa vasculhando as vagas que passam. */
function Lupa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {/* vagas passando por baixo */}
      {[
        { y: 30, d: '0s' },
        { y: 48, d: '0.7s' },
        { y: 66, d: '1.4s' },
      ].map((c) => (
        <g key={c.d} className="animate-card-pass" style={{ animationDelay: c.d }}>
          <rect x="22" y={c.y} width="56" height="12" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="27" y={c.y + 4} width="24" height="4" rx="2" fill="var(--surface-2)" />
          <circle cx="70" cy={c.y + 6} r="3.5" fill="var(--accent)" />
        </g>
      ))}
      {/* a lupa */}
      <g className="animate-sweep" style={{ transformOrigin: '50px 50px' }}>
        <circle cx="46" cy="46" r="18" fill="color-mix(in srgb, var(--accent) 12%, transparent)" stroke="var(--accent)" strokeWidth="4" />
        <line x1="59" y1="59" x2="74" y2="74" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Etapa 4 — o medidor de match enchendo, o mesmo que aparece nos resultados. */
function Medidor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r="26" fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="163"
          strokeDashoffset="163"
          className="animate-gauge"
        />
      </g>
      {/* faíscas ao redor, no ritmo do medidor */}
      {[
        { cx: 50, cy: 12, d: '0s' },
        { cx: 88, cy: 50, d: '0.5s' },
        { cx: 50, cy: 88, d: '1s' },
        { cx: 12, cy: 50, d: '1.5s' },
      ].map((s) => (
        <circle
          key={s.d}
          cx={s.cx}
          cy={s.cy}
          r="2.5"
          fill="var(--accent)"
          className="animate-think"
          style={{ animationDelay: s.d }}
        />
      ))}
    </svg>
  );
}
