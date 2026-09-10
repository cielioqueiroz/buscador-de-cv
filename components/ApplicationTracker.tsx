'use client';

import { useEffect, useState } from 'react';
import { FiArrowRight, FiBriefcase, FiTrash2 } from 'react-icons/fi';
import { APPLICATION_STAGES, listApplications, type Application, type ApplicationStage, removeApplication, updateApplicationStage } from '@/lib/applications';

const STAGE_LABELS: Record<ApplicationStage, string> = {
  aplicado: 'Aplicado',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
};

export function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplications(listApplications()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function move(id: string, stage: ApplicationStage) {
    setApplications(updateApplicationStage(id, stage));
    setDraggedId(null);
  }

  function remove(id: string) {
    setApplications(removeApplication(id));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {APPLICATION_STAGES.map((stage) => {
        const column = applications.filter((application) => application.stage === stage);
        return (
          <section
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (draggedId) move(draggedId, stage); }}
            className="min-h-64 rounded-3xl border border-border bg-surface-2/40 p-4"
          >
            <div className="flex items-center justify-between gap-3 px-2 pb-3">
              <h2 className="font-display text-lg font-bold">{STAGE_LABELS[stage]}</h2>
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface px-2 font-mono text-xs text-muted">{column.length}</span>
            </div>
            <div className="space-y-3">
              {column.map((application) => (
                <article
                  key={application.id}
                  draggable
                  onDragStart={() => setDraggedId(application.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className="cursor-grab rounded-2xl border border-border bg-surface p-4 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-bold">{application.job.title}</h3>
                      <p className="mt-1 truncate text-sm text-muted">{application.job.company} · {application.job.location}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-accent-ink">{Math.round(application.match.score)}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <label className="sr-only" htmlFor={`stage-${application.id}`}>Etapa de {application.job.title}</label>
                    <select
                      id={`stage-${application.id}`}
                      value={application.stage}
                      onChange={(event) => move(application.id, event.target.value as ApplicationStage)}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-foreground"
                    >
                      {APPLICATION_STAGES.map((option) => <option key={option} value={option}>{STAGE_LABELS[option]}</option>)}
                    </select>
                    <a href={application.job.applyUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir vaga de ${application.job.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-foreground"><FiArrowRight className="h-4 w-4" /></a>
                    <button type="button" onClick={() => remove(application.id)} aria-label={`Remover ${application.job.title} do tracker`} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-warn"><FiTrash2 className="h-4 w-4" /></button>
                  </div>
                </article>
              ))}
              {column.length === 0 && <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">Arraste candidaturas para cá</div>}
            </div>
          </section>
        );
      })}
      {applications.length === 0 && <div className="lg:col-span-3 rounded-3xl border border-dashed border-border bg-surface p-10 text-center"><FiBriefcase className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-display text-xl font-bold">Seu tracker está vazio</p><p className="mt-2 text-sm text-muted">Nas vagas, clique em “Acompanhar” para começar a organizar suas candidaturas.</p></div>}
    </div>
  );
}
