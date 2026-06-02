import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-xl font-extrabold text-accent-foreground">
                V
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight">
                Vaga<span className="text-accent-ink">Certa</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">
              Seu currículo vira um radar de vagas. A IA entende seu perfil e encontra as
              oportunidades que realmente combinam — com o link oficial de candidatura.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted">Navegar</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/" className="link-underline text-foreground/80 hover:text-foreground">Enviar currículo</Link></li>
              <li><Link href="/resultados" className="link-underline text-foreground/80 hover:text-foreground">Ver vagas</Link></li>
              <li><Link href="/perfil" className="link-underline text-foreground/80 hover:text-foreground">Meu perfil</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted">Fontes legais</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="https://www.adzuna.com.br" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-foreground/80 hover:text-foreground">
                  Adzuna <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
              <li>
                <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-foreground/80 hover:text-foreground">
                  Remotive <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
              <li>
                <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-foreground/80 hover:text-foreground">
                  Google for Jobs <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Vaga Certa. Sem scraping — vagas de agregadores legais, sempre com link oficial.</p>
          <p className="font-display font-bold text-foreground/80">
            Todo talento merece a <span className="text-accent-ink">vaga certa</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
