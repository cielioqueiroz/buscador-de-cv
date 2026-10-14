const SOURCES = [
  'LinkedIn', 'Gupy', 'Indeed', 'Vagas.com', 'Glassdoor', 'InfoJobs', 'Catho',
  'Remotive', 'Programathor', 'Adzuna', 'Trampos', 'We Work Remotely', 'Remotar', 'JSearch',
];

// Quantas vezes repetir a lista em CADA metade da faixa. Uma metade precisa
// ser mais larga que a área visível, senão aparece um "buraco" no loop.
const REPEAT = 2;

/**
 * Faixa das fontes de vagas: nomes como texto puro, sem pílula nem marcador,
 * uma faixa só. A faixa animada é decorativa (aria-hidden); leitores de tela
 * recebem a lista uma vez, sem as repetições do loop.
 */
export function LogoMarquee() {
  const half = Array.from({ length: REPEAT }, () => SOURCES).flat();
  const track = [...half, ...half];
  return (
    <section aria-label="Fontes de vagas" className="border-y border-border bg-surface-2/40 py-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 md:flex-row md:items-center md:gap-8">
        {/* Sem contagem: as fontes integradas são 3 (JSearch, Adzuna, Remotive);
            os demais nomes chegam pelo JSearch, que agrega esses sites. */}
        <p className="shrink-0 text-sm text-muted md:w-44 md:border-r md:border-border md:pr-8">
          Vagas reunidas de sites como:
        </p>
        <ul className="sr-only">
          {SOURCES.map((name) => <li key={name}>{name}</li>)}
        </ul>
        <div aria-hidden className="marquee-mask min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex w-max animate-marquee items-center">
            {track.map((name, i) => (
              <span
                key={i}
                className="shrink-0 whitespace-nowrap px-5 font-display text-lg font-bold tracking-tight text-foreground/40 transition-colors duration-200 hover:text-foreground sm:px-7 sm:text-xl"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
