'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { loadProfile } from '@/lib/store';
import type { CVProfile } from '@/lib/providers/types';

const SENIORITY_LABEL: Record<CVProfile['seniority'], string> = {
  estagio: 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead / Gestão',
};

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace('/');
      return;
    }
    setProfile(p);
    setReady(true);
  }, [router]);

  if (!ready || !profile) return null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <Link
          href="/resultados"
          className="group mb-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground"
        >
          <FiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> voltar para as vagas
        </Link>

        <div className="rounded-3xl border border-border bg-surface p-7 sm:p-9">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Perfil extraído do seu CV
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
            {profile.title}
          </h1>
          <span className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 font-display text-sm font-bold text-accent-foreground">
            {SENIORITY_LABEL[profile.seniority]}
          </span>

          <Section title="Habilidades">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm transition-colors hover:border-accent-ink"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>

          {profile.areas.length > 0 && (
            <Section title="Áreas de atuação">
              <div className="flex flex-wrap gap-2">
                {profile.areas.map((a) => (
                  <span key={a} className="font-mono text-sm text-muted">
                    #{a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Buscas usadas">
            <ul className="space-y-1.5">
              {profile.searchQueries.map((q) => (
                <li key={q} className="flex items-center gap-2 text-sm">
                  <span className="text-accent-ink">→</span>
                  <span className="font-mono">{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
