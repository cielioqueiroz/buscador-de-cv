const ROW_A = ['LinkedIn', 'Indeed', 'Glassdoor', 'Gupy', 'Google for Jobs', 'Adzuna', 'Remotive'];
const ROW_B = ['Vagas.com', 'InfoJobs', 'Catho', 'Remotar', 'We Work Remotely', 'Trampos', 'Programathor'];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div
      className={`marquee-track flex w-max gap-3 ${reverse ? 'animate-marquee-rev' : 'animate-marquee'}`}
    >
      {doubled.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-5 py-2.5 font-display text-base font-bold text-foreground/80"
        >
          <span className="h-2 w-2 rounded-full bg-accent-bright" />
          {name}
        </span>
      ))}
    </div>
  );
}

/** Carrossel infinito das fontes/empresas de vagas. */
export function LogoMarquee() {
  return (
    <section className="border-y border-border bg-surface-2/40 py-8">
      <p className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
        vagas reunidas de fontes como
      </p>
      <div className="marquee-mask space-y-3 overflow-hidden">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
