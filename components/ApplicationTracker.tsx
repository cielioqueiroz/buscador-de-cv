'use client';

import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { FiArrowRight, FiBriefcase, FiCalendar, FiEdit3, FiLoader, FiTrash2 } from 'react-icons/fi';
import {
  APPLICATION_STAGES,
  type Application,
  type ApplicationPatch,
  type ApplicationStage,
} from '@/lib/application-schema';
import { useAuthed } from '@/lib/client/use-authed';
import {
  fetchApplications,
  removeApplicationStore,
  restoreApplicationStore,
  updateApplicationStore,
} from '@/lib/client/sync-client';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<ApplicationStage, string> = {
  aplicado: 'Aplicado',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
  recusado: 'Recusado',
};

/** "2026-10-20" → "20/10/2026", sem passar por Date (que deslocaria o dia pelo fuso). */
function dataBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function Detalhes({
  application,
  onSave,
}: {
  application: Application;
  onSave: (patch: ApplicationPatch) => Promise<void>;
}) {
  const [notes, setNotes] = useState(application.notes ?? '');
  const [interviewOn, setInterviewOn] = useState(application.interviewOn ?? '');
  const [saving, setSaving] = useState(false);
  const notesId = useId();
  const dateId = useId();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ notes, interviewOn: interviewOn || null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mt-4 space-y-3 border-t border-border pt-4">
      <div>
        <label htmlFor={dateId} className="text-xs font-semibold text-muted">Data da entrevista</label>
        <input
          id={dateId}
          type="date"
          value={interviewOn}
          onChange={(e) => setInterviewOn(e.target.value)}
          className="field mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
        />
      </div>
      <div>
        <label htmlFor={notesId} className="text-xs font-semibold text-muted">Anotações</label>
        <textarea
          id={notesId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Recrutador, próximos passos, salário combinado…"
          className="field mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? <FiLoader className="animate-spin" aria-hidden /> : null}
        Salvar
      </button>
    </form>
  );
}

export function ApplicationTracker() {
  const authed = useAuthed();
  const [applications, setApplications] = useState<Application[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchApplications(authed).then((list) => {
      if (!cancelled) setApplications(list);
    });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  async function atualizar(id: string, patch: ApplicationPatch) {
    try {
      setApplications(await updateApplicationStore(authed, id, patch));
    } catch {
      toast.error('Não deu para salvar. Tente de novo.');
    }
  }

  async function move(id: string, stage: ApplicationStage) {
    setDraggedId(null);
    await atualizar(id, { stage });
  }

  async function salvarDetalhes(id: string, patch: ApplicationPatch) {
    await atualizar(id, patch);
    setAberto(null);
    toast.success('Anotações salvas.');
  }

  /** Remove na hora e oferece desfazer: a candidatura volta com estágio e anotações. */
  async function remove(application: Application) {
    setApplications((list) => list.filter((a) => a.id !== application.id));
    try {
      setApplications(await removeApplicationStore(authed, application.id));
      toast('Candidatura removida do tracker.', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            void restoreApplicationStore(authed, application).then(setApplications);
          },
        },
      });
    } catch {
      setApplications(await fetchApplications(authed));
      toast.error('Não deu para remover. Tente de novo.');
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {APPLICATION_STAGES.map((stage) => {
        const column = applications.filter((application) => application.stage === stage);
        return (
          <section
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (draggedId) void move(draggedId, stage); }}
            className="min-h-64 rounded-panel border border-border bg-surface-2/40 p-4"
          >
            <div className="flex items-center justify-between gap-3 px-2 pb-3">
              <h2 className="font-display text-lg font-bold">{STAGE_LABELS[stage]}</h2>
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface px-2 font-mono text-xs text-muted">{column.length}</span>
            </div>
            <div className="space-y-3">
              {column.map((application) => {
                const expandido = aberto === application.id;
                return (
                  <article
                    key={application.id}
                    draggable={!expandido}
                    onDragStart={() => setDraggedId(application.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={cn(
                      'rounded-card border border-border bg-surface p-4 shadow-sm transition-colors hover:border-foreground/25',
                      !expandido && 'cursor-grab active:cursor-grabbing',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display font-bold">{application.job.title}</h3>
                        <p className="mt-1 truncate text-sm text-muted">{application.job.company} · {application.job.location}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-accent-ink">{Math.round(application.match.score)}</span>
                    </div>

                    {(application.interviewOn || application.notes) && !expandido && (
                      <div className="mt-3 space-y-1 text-xs text-muted">
                        {application.interviewOn && (
                          <p className="inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-2 py-0.5 font-medium text-accent-ink">
                            <FiCalendar className="h-3 w-3" aria-hidden /> Entrevista em {dataBR(application.interviewOn)}
                          </p>
                        )}
                        {application.notes && <p className="line-clamp-2">{application.notes}</p>}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <label className="sr-only" htmlFor={`stage-${application.id}`}>Etapa de {application.job.title}</label>
                      <select
                        id={`stage-${application.id}`}
                        value={application.stage}
                        onChange={(event) => void move(application.id, event.target.value as ApplicationStage)}
                        className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-foreground"
                      >
                        {APPLICATION_STAGES.map((option) => <option key={option} value={option}>{STAGE_LABELS[option]}</option>)}
                      </select>
                      {/* Os ícones numa linha própria: dividindo a linha com eles, o seletor
                          ficava estreito e cortava o nome da etapa ("Entrevis…"). */}
                      <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAberto(expandido ? null : application.id)}
                        aria-expanded={expandido}
                        aria-label={`Anotações de ${application.job.title}`}
                        className={cn(
                          'grid h-8 w-8 place-items-center rounded-lg border text-muted transition-colors hover:text-foreground',
                          expandido ? 'border-accent-ink text-accent-ink' : 'border-border',
                        )}
                      >
                        <FiEdit3 className="h-4 w-4" aria-hidden />
                      </button>
                      <a href={application.job.applyUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir vaga de ${application.job.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-foreground"><FiArrowRight className="h-4 w-4" /></a>
                      <button type="button" onClick={() => void remove(application)} aria-label={`Remover ${application.job.title} do tracker`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-warn"><FiTrash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {expandido && (
                      <Detalhes
                        application={application}
                        onSave={(patch) => salvarDetalhes(application.id, patch)}
                      />
                    )}
                  </article>
                );
              })}
              {column.length === 0 && <div className="grid min-h-32 place-items-center rounded-card border border-dashed border-border p-4 text-center text-sm text-muted">Arraste candidaturas para cá</div>}
            </div>
          </section>
        );
      })}
      {applications.length === 0 && <div className="rounded-panel border border-dashed border-border bg-surface p-10 text-center md:col-span-2 xl:col-span-4"><FiBriefcase className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-display text-xl font-bold">Seu tracker está vazio</p><p className="mt-2 text-sm text-muted">Nas vagas, clique em “Acompanhar” para começar a organizar suas candidaturas.</p></div>}
    </div>
  );
}
