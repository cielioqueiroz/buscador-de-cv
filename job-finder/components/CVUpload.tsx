'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiUploadCloud, FiFileText } from 'react-icons/fi';
import { saveProfile, clearProfile } from '@/lib/store';
import { cn } from '@/lib/utils';

const ACCEPT = '.pdf,.docx,.doc,.txt';
const MAX_MB = 8;

export function CVUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande (máx. ${MAX_MB}MB).`);
      return;
    }
    setFileName(file.name);
    setBusy(true);
    const t = toast.loading('Analisando seu currículo com IA…');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/cv/analyze', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao analisar o CV.');
      clearProfile();
      saveProfile(data.profile);
      toast.success('Perfil pronto! Buscando vagas…', { id: t });
      router.push('/resultados');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado.';
      toast.error(msg, { id: t });
      setBusy(false);
      setFileName(null);
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click(); }}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all sm:p-14',
        dragging
          ? 'border-accent bg-accent-bright/10 scale-[1.01]'
          : 'border-border bg-surface hover:border-accent',
        busy && 'pointer-events-none',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="pointer-events-none flex flex-col items-center gap-4">
        <div
          className={cn(
            'grid h-16 w-16 place-items-center rounded-2xl transition-transform',
            busy ? '' : 'group-hover:-translate-y-1',
            'bg-accent text-accent-foreground',
          )}
        >
          {busy ? (
            <span className="h-7 w-7 rounded-full border-[3px] border-accent-foreground/30 border-t-accent-foreground animate-spin-slow" />
          ) : fileName ? (
            <FiFileText className="h-7 w-7" />
          ) : (
            <FiUploadCloud className="h-7 w-7" />
          )}
        </div>

        <div>
          <p className="font-display text-xl font-bold">
            {busy ? 'Lendo seu currículo…' : 'Solte seu currículo aqui'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {fileName ?? 'ou clique para escolher — PDF, DOCX ou TXT'}
          </p>
        </div>

        {!busy && (
          <span className="mt-1 rounded-full bg-accent px-5 py-2 font-display text-sm font-bold text-accent-foreground">
            Escolher arquivo
          </span>
        )}
      </div>
    </div>
  );
}
