'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiCopy, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import type { AdaptedCV } from '@/lib/cv-features';
import type { CVProfile, Job } from '@/lib/providers/types';

/**
 * Painel modal com o CV adaptado para uma vaga específica.
 *
 * ATENÇÃO — por que `createPortal`. O JobCard aplica `animate-rise` no
 * `<article>` pai, e esse `transform` cria um *containing block* para
 * descendentes `position: fixed`. Sem o portal, o `fixed inset-0` daqui se
 * ancorava no card em vez do viewport: o modal aparecia colado na posição do
 * card, o X e o header podiam ficar fora da tela e rolar levava o painel
 * junto. Portal para `document.body` é a correção estrutural.
 *
 * Pelo mesmo motivo seguimos o padrão do CoverLetterPanel: Esc fecha, backdrop
 * clicável fecha, e a rolagem do fundo trava enquanto o painel está aberto.
 */
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Esc fecha e scroll do body trava enquanto o painel está aberto.
  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus();
    };
  }, [onClose]);

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

  // No SSR não há body; o portal só pode acontecer depois de montado no cliente.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      {/* Backdrop clicável — mesmo papel do CoverLetterPanel. aria-hidden
          porque a tecnologia assistiva já tem o X e o Esc; anunciar "Fechar"
          duas vezes só atrapalha. */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adapted-cv-title"
        tabIndex={-1}
        className="animate-rise relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-h-[88vh] sm:rounded-panel"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">CV direcionado para</p>
            <h2 id="adapted-cv-title" className="mt-1 truncate font-display text-xl font-bold">{job.title}</h2>
            <p className="mt-1 truncate text-sm text-muted">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar CV adaptado"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-foreground"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!result && !error && <AdaptandoCV />}
          {error && (
            <div className="rounded-card border border-warn/40 bg-warn/10 p-6 text-center">
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
                <section className="rounded-card border border-caution/30 bg-caution/10 p-4">
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
    </div>,
    document.body,
  );
}

/**
 * Estado de carregamento com movimento próprio — a mesma lógica da espera da
 * carta: o usuário tem que ver que algo está acontecendo, não uma caixa parada.
 */
function AdaptandoCV() {
  return (
    <div className="space-y-4 rounded-card border border-border bg-surface-2/40 p-6">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-ink">
        <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-accent-bright" />
        adaptando seu CV
      </p>
      <p className="text-sm text-muted">A IA está destacando o que importa para esta vaga.</p>
      {[90, 100, 76, 94, 68].map((w, i) => (
        <div
          key={i}
          className="animate-type-line h-3 rounded-full bg-foreground/10"
          style={{ width: `${w}%`, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}
