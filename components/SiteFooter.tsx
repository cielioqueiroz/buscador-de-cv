import Link from 'next/link';
import type { IconType } from 'react-icons';
import { FaGithub, FaLinkedinIn } from 'react-icons/fa6';
import { FiGlobe } from 'react-icons/fi';

const LINK = 'link-underline text-foreground/80 hover:text-foreground';

const FONTES = [
  { label: 'Adzuna', href: 'https://www.adzuna.com.br' },
  { label: 'Remotive', href: 'https://remotive.com' },
  { label: 'JSearch', href: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch' },
];

const CONTATO: { label: string; href: string; icon: IconType }[] = [
  { label: 'Portfólio', href: 'https://cielio-portfolio.vercel.app', icon: FiGlobe },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jacielio-queiroz/', icon: FaLinkedinIn },
  { label: 'GitHub', href: 'https://github.com/cielioqueiroz', icon: FaGithub },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
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
              <li><Link href="/#cv-upload" className={LINK}>Enviar currículo</Link></li>
              <li><Link href="/resultados" className={LINK}>Ver vagas</Link></li>
              <li><Link href="/perfil" className={LINK}>Meu perfil</Link></li>
              <li><Link href="/privacidade" className={LINK}>Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted">Fontes legais</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FONTES.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted">Contato</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {CONTATO.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 text-foreground/80 transition-colors hover:text-foreground"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-[15px] text-foreground/70 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon aria-hidden />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Projetos e freelas — chame no portfólio.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            <span>© {year} Vaga Certa — feito por</span>
            <a
              href="https://cielio-portfolio.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-pill border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent-ink transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              Ciélio Queiroz
            </a>
            <span>Sem scraping — sempre com o link oficial.</span>
          </p>
          <p className="font-display font-bold text-foreground/80">
            Todo talento merece a <span className="text-accent-ink">vaga certa</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
