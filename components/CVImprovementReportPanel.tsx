'use client';

import { useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { toast } from 'sonner';
import type { CVImprovementReport } from '@/lib/cv-features';
import type { CVProfile } from '@/lib/providers/types';

export function CVImprovementReportPanel({ profile }: { profile: CVProfile }) {
  const [report, setReport] = useState<CVImprovementReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch('/api/cv/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const body = await response.json() as { report?: CVImprovementReport; error?: string };
      if (!response.ok || !body.report) throw new Error(body.error ?? 'Não foi possível gerar o relatório.');
      setReport(body.report);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-surface p-7 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Próximo passo</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">Como melhorar seu CV</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Receba forças, lacunas e ações concretas para deixar seu currículo mais claro para recrutadores e sistemas ATS.</p>
        </div>
        <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground disabled:opacity-60">
          {loading && <FiLoader className="h-4 w-4 animate-spin" />}
          {loading ? 'Analisando...' : report ? 'Atualizar relatório' : 'Gerar relatório'}
        </button>
      </div>

      {report && (
        <div className="mt-8 space-y-7 border-t border-border pt-7">
          <p className="max-w-3xl leading-relaxed text-foreground/90">{report.summary}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-bold"><FiCheckCircle className="text-accent-ink" /> Pontos fortes</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">{report.strengths.map((strength) => <li key={strength}>• {strength}</li>)}</ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-bold"><FiAlertCircle className="text-warn" /> O que melhorar</h3>
              <div className="mt-3 space-y-3">{report.improvements.map((item) => <div key={`${item.area}-${item.action}`} className="rounded-2xl border border-border bg-surface-2 p-4"><div className="flex items-center justify-between gap-3"><p className="font-display font-bold">{item.area}</p><span className="font-mono text-[10px] uppercase tracking-widest text-muted">{item.priority}</span></div><p className="mt-2 text-sm text-muted">{item.problem}</p><p className="mt-2 text-sm leading-relaxed">{item.action}</p></div>)}</div>
            </div>
          </div>
          {report.missingKeywords.length > 0 && <div><h3 className="font-display text-lg font-bold">Termos para investigar</h3><p className="mt-1 text-xs text-muted">Eles aparecem como oportunidades no diagnóstico; só adicione ao CV se forem verdadeiros para você.</p><div className="mt-3 flex flex-wrap gap-2">{report.missingKeywords.map((keyword) => <span key={keyword} className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted">{keyword}</span>)}</div></div>}
        </div>
      )}
    </section>
  );
}
