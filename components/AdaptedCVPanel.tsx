'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import type { AdaptedCV } from '@/lib/cv-features';
import type { CVProfile, Job } from '@/lib/providers/types';

export function AdaptedCVPanel({
  job,
  profile,
  onClose,
}: {
  job: Job;
  profile: CVProfile;
  onClose: () => void;
}) {
  const [result, setResult] = useState<AdaptedCV | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/cv/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, job }),
    })
      .then(async (response) => {
        const body = await response.json() as { adaptedCV?: AdaptedCV; error?: string };
        if (!response.ok || !body.adaptedCV) throw new Error(body.error ?? 'Não foi possível adaptar o CV.');
        if (mounted) setResult(body.adaptedCV);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Não foi possível adaptar o CV.');
      });
    return () => { mounted = false; };
  }, [job, profile]);

  const text = useMemo(() => {
    if (!result) return '';
    return [
      result.headline,
      result.summary,
      `Habilidades: ${result.skills.join(', ')}`,
      ...result.experienceHighlights.map((highlight) => `• ${highlight}`),
    ].join('\n\n');
  }, [result]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('CV adaptado copiado.');
    } catch {
      toast.error('Não foi possível copiar o CV.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="adapted-cv-title">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">CV direcionado para</p>
            <h2 id="adapted-cv-title" className="mt-1 font-display text-xl font-bold">{job.title}</h2>
            <p className="mt-1 text-sm text-muted">{job.company}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar CV adaptado" className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:text-foreground">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!result && !error && (
            <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
              <p className="font-display text-lg font-bold">Adaptando seu CV...</p>
              <p className="mt-2 text-sm text-muted">A IA está destacando o que importa para esta vaga.</p>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-warn/40 bg-warn/10 p-6 text-center">
              <p className="font-display font-bold">Não foi possível adaptar agora.</p>
              <p className="mt-2 text-sm text-muted">{error}</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <section>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Título sugerido</p>
                <p className="mt-2 font-display text-2xl font-bold">{result.headline}</p>
              </section>
              <section>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Resumo</p>
                <p className="mt-2 leading-relaxed text-foreground/90">{result.summary}</p>
              </section>
              <section>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Habilidades em destaque</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.skills.map((skill) => <span key={skill} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">{skill}</span>)}
                </div>
              </section>
              <section>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Realizações para destacar</p>
                <ul className="mt-2 space-y-2">
                  {result.experienceHighlights.map((highlight) => <li key={highlight} className="flex gap-2 text-sm leading-relaxed"><FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />{highlight}</li>)}
                </ul>
              </section>
              {result.cautions.length > 0 && (
                <section className="rounded-2xl border border-caution/30 bg-caution/10 p-4">
                  <p className="font-display font-bold">Antes de enviar</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">{result.cautions.map((caution) => <li key={caution}>• {caution}</li>)}</ul>
                </section>
              )}
            </div>
          )}
        </div>

        {result && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
            <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground">
              <FiCopy className="h-4 w-4" /> Copiar adaptação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
