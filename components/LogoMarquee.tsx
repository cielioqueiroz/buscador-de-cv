const ROW_A = ['LinkedIn', 'Indeed', 'Glassdoor', 'Gupy', 'Google for Jobs', 'Adzuna', 'Remotive'];
const ROW_B = ['Vagas.com', 'InfoJobs', 'Catho', 'Remotar', 'We Work Remotely', 'Trampos', 'Programathor'];

// Quantas vezes repetir a lista em CADA metade da faixa. Precisa ser largo o
// bastante para uma metade exceder a maior tela (evita o "buraco" no loop).
const REPEAT = 5;

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  // Uma "metade" larga o suficiente; a faixa tem duas metades idênticas e
  // anima translateX(-50%) → o loop fica perfeitamente sem emenda.
  const half = Array.from({ length: REPEAT }, () => items).flat();
  const track = [...half, ...half];
  return (
    <div
      className={`marquee-track flex w-max gap-3 sm:gap-4 ${reverse ? 'animate-marquee-rev' : 'animate-marquee'}`}
    >
      {track.map((name, i) => (
        <span
          key={i}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 font-display text-sm font-bold text-foreground/80 sm:px-5 sm:py-2.5 sm:text-base"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-bright sm:h-2 sm:w-2" />
          {name}
        </span>
      ))}
    </div>
  );
}

/** Carrossel infinito das fontes/empresas de vagas (duas faixas opostas). */
export function LogoMarquee() {
  return (
    <section className="overflow-hidden border-y border-border bg-surface-2/40 py-8 sm:py-10">
      <p className="mb-5 px-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:mb-6 sm:text-[11px] sm:tracking-[0.25em]">
        vagas reunidas de fontes como
      </p>
      <div className="marquee-mask flex flex-col gap-3 sm:gap-4">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
