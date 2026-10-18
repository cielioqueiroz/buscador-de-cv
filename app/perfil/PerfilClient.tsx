'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FiBell, FiCheck, FiEdit2, FiRefreshCw, FiSearch, FiSettings } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CVUpload } from '@/components/CVUpload';
import { ScoreGauge } from '@/components/ScoreGauge';
import { CVImprovementReportPanel } from '@/components/CVImprovementReportPanel';
import { ProfileEditor } from '@/components/ProfileEditor';
import { Avatar } from '@/components/auth/Avatar';
import { profileChecklist, type DashboardStats } from '@/lib/auth/checklist';
import { ALERT_MIN_SCORE, STALE_AFTER_DAYS } from '@/lib/jobs/new-jobs';
import type { CVProfile } from '@/lib/providers/types';

const SENIORITY_LABEL: Record<CVProfile['seniority'], string> = {
  estagio: 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead / Gestão',
};

type Props = {
  account: { name: string | null; email: string; image: string | null };
  profile: CVProfile | null;
  stats: DashboardStats;
  updatedLabel: string | null;
  googleEnabled: boolean;
  /** Dias desde a última busca; null se nunca houve. */
  rankingAgeDays: number | null;
};

function displayName(account: Props['account']): string {
  return account.name?.trim() || account.email.split('@')[0];
}

export function PerfilClient({ account, profile, stats, updatedLabel, googleEnabled, rankingAgeDays }: Props) {
  const [replacing, setReplacing] = useState(false);

  const name = displayName(account);

  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-5 scroll-mt-24 outline-none">
        {profile ? (
          <Dashboard
            account={account}
            name={name}
            profile={profile}
            stats={stats}
            updatedLabel={updatedLabel}
            replacing={replacing}
            onReplace={() => setReplacing((v) => !v)}
            googleEnabled={googleEnabled}
            rankingAgeDays={rankingAgeDays}
          />
        ) : (
          <Onboarding name={name} googleEnabled={googleEnabled} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Onboarding({ name, googleEnabled }: { name: string; googleEnabled: boolean }) {
  const first = name.split(/\s+/)[0];
  return (
    <section aria-labelledby="boas-vindas" className="mx-auto max-w-2xl py-6 text-center">
      <h1 id="boas-vindas" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Olá, {first}.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Envie seu currículo. A IA monta seu perfil, busca vagas reais e dá uma nota de 0 a 100 para cada uma.
      </p>
      <div id="trocar-cv" className="mt-8 scroll-mt-24 text-left">
        <CVUpload googleEnabled={googleEnabled} />
      </div>
    </section>
  );
}

type DashboardProps = {
  account: Props['account'];
  name: string;
  profile: CVProfile;
  stats: DashboardStats;
  updatedLabel: string | null;
  replacing: boolean;
  onReplace: () => void;
  googleEnabled: boolean;
  rankingAgeDays: number | null;
};

function Dashboard({
  account,
  name,
  profile,
  stats,
  updatedLabel,
  replacing,
  onReplace,
  googleEnabled,
  rankingAgeDays,
}: DashboardProps) {
  const { items, strength } = profileChecklist({
    hasCV: true,
    hasPhoto: Boolean(account.image),
    hasName: Boolean(account.name?.trim()),
    stats,
  });
  const pending = items.filter((i) => !i.done);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Identidade + força do perfil */}
      <section
        aria-labelledby="perfil-nome"
        className="rounded-panel border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <Avatar
              name={account.name}
              email={account.email}
              image={account.image}
              className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl"
            />
            <div className="min-w-0">
              <h1 id="perfil-nome" className="truncate font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                {name}
              </h1>
              <p className="mt-1 text-lg text-foreground/85">{profile.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-pill bg-accent px-3 py-1 font-display text-sm font-bold text-accent-foreground">
                  {SENIORITY_LABEL[profile.seniority]}
                </span>
                {updatedLabel ? (
                  <span className="text-sm text-muted">Currículo enviado em {updatedLabel}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:gap-1 sm:text-center">
            <ScoreGauge score={strength} size={88} label="%" ariaLabel="Força do perfil" />
            <p className="text-sm text-muted sm:max-w-[7rem]">
              Força do perfil
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/resultados"
            className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <FiSearch aria-hidden /> Ver vagas para mim
          </Link>
          <button
            type="button"
            onClick={onReplace}
            aria-expanded={replacing}
            aria-controls="trocar-cv"
            className="inline-flex items-center gap-2 rounded-pill border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            <FiRefreshCw aria-hidden /> {replacing ? 'Cancelar troca' : 'Trocar currículo'}
          </button>
          <Link
            href="/conta"
            className="inline-flex items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <FiSettings aria-hidden /> Editar conta
          </Link>
        </div>

        <JobsAlert newJobs={stats.newJobs} ageDays={rankingAgeDays} />

        {replacing ? (
          <div id="trocar-cv" className="mt-6 scroll-mt-24">
            <p className="mb-3 text-sm text-muted">
              O novo currículo substitui o perfil atual e refaz a busca de vagas. O tracker e os favoritos continuam.
            </p>
            <CVUpload googleEnabled={googleEnabled} />
          </div>
        ) : null}
      </section>

      {/* Tracker em números */}
      <section aria-labelledby="tracker-titulo" className="rounded-panel border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-8">
          <h2 id="tracker-titulo" className="font-display text-lg font-bold">Suas candidaturas</h2>
          <Link href="/candidaturas" className="text-sm font-medium text-accent-ink underline-offset-2 hover:underline">
            Abrir tracker
          </Link>
        </div>
        <dl className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          <Stat label="Aplicadas" value={stats.applied} />
          <Stat label="Em entrevista" value={stats.interviews} />
          <Stat label="Ofertas" value={stats.offers} highlight={stats.offers > 0} />
          <Stat label="Vagas favoritas" value={stats.favorites} />
        </dl>
      </section>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Próximos passos */}
        {pending.length > 0 ? (
          <section aria-labelledby="passos-titulo" className="rounded-panel border border-border bg-surface p-6 md:col-span-2">
            <h2 id="passos-titulo" className="font-display text-lg font-bold">Para o perfil ficar completo</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={item.done ? 'flex items-center gap-2 text-muted line-through decoration-muted/50' : 'flex items-center gap-2'}>
                    <span
                      aria-hidden
                      className={
                        item.done
                          ? 'grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground'
                          : 'h-5 w-5 shrink-0 rounded-full border-2 border-border'
                      }
                    >
                      {item.done ? <FiCheck className="h-3 w-3" /> : null}
                    </span>
                    {item.label}
                    <span className="sr-only">{item.done ? '(feito)' : '(pendente)'}</span>
                  </span>
                  {!item.done ? (
                    <Link href={item.href} className="shrink-0 font-medium text-accent-ink underline-offset-2 hover:underline">
                      {item.action}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* O que a IA entendeu do CV */}
        <section
          aria-labelledby="habilidades-titulo"
          className={`rounded-panel border border-border bg-surface p-6 ${pending.length > 0 ? 'md:col-span-3' : 'md:col-span-5'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="habilidades-titulo" className="font-display text-lg font-bold">Habilidades</h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-surface-2"
              >
                <FiEdit2 className="h-3.5 w-3.5" aria-hidden /> Corrigir
              </button>
            ) : null}
          </div>
          {editing ? (
            <ProfileEditor profile={profile} onDone={() => setEditing(false)} />
          ) : (
          <>
          <p className="mt-1 text-sm text-muted">O que a IA entendeu do seu CV. Errou algo? Corrija — as próximas buscas usam esta versão.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <li key={s} className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm">
                {s}
              </li>
            ))}
          </ul>

          {profile.areas.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-semibold text-muted">Áreas de atuação</h3>
              <p className="mt-2 text-sm">{profile.areas.join(', ')}</p>
            </>
          ) : null}

          <h3 className="mt-6 text-sm font-semibold text-muted">Buscas que usamos para achar suas vagas</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.searchQueries.map((q) => (
              <li key={q} className="rounded-pill bg-background px-3 py-1 font-mono text-xs">
                {q}
              </li>
            ))}
          </ul>
          </>
          )}
        </section>
      </div>

      <CVImprovementReportPanel />
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="px-6 py-5 sm:px-8">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-3xl font-extrabold tabular-nums ${highlight ? 'text-accent-ink' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

/** O alerta de vagas do painel: o que a última busca trouxe de novo, ou que ela já envelheceu. */
function JobsAlert({ newJobs, ageDays }: { newJobs: number; ageDays: number | null }) {
  const stale = ageDays !== null && ageDays >= STALE_AFTER_DAYS;
  if (newJobs === 0 && !stale) return null;
  const texto =
    newJobs > 0
      ? `${newJobs === 1 ? '1 vaga nova' : `${newJobs} vagas novas`} com nota ${ALERT_MIN_SCORE}+ na sua última busca.`
      : `Sua última busca foi há ${ageDays} dias. Vale ver se abriram vagas novas.`;
  return (
    <Link
      href="/resultados"
      className="mt-4 flex items-center gap-3 rounded-card border border-accent-ink/40 px-4 py-3 text-sm transition-colors hover:bg-background"
    >
      <FiBell className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
      <span className="font-medium">{texto}</span>
      <span className="ml-auto shrink-0 text-accent-ink">Ver vagas</span>
    </Link>
  );
}
