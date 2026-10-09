'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiUploadCloud, FiX, FiLoader } from 'react-icons/fi';
import { clearProfile, loadProfile } from '@/lib/store';
import type { CVProfile } from '@/lib/providers/types';

type Status = 'idle' | 'sending' | 'conflict';

export function ImportGuestProfileBanner() {
  const router = useRouter();
  const [guest, setGuest] = useState<CVProfile | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    setGuest(loadProfile());
  }, []);

  if (!guest) return null;

  async function send(force: boolean) {
    if (!guest) return;
    setStatus('sending');
    try {
      const url = `/api/perfil/import${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: guest }),
      });
      if (res.status === 409) {
        setStatus('conflict');
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? 'Não deu para importar.');
        setStatus('idle');
        return;
      }
      clearProfile();
      setGuest(null);
      toast.success('Perfil importado para a sua conta.');
      router.refresh();
    } catch {
      toast.error('Falha de rede. Tente de novo.');
      setStatus('idle');
    }
  }

  function dismiss() {
    setGuest(null);
  }

  if (status === 'conflict') {
    return (
      <div className="mb-6 rounded-panel border border-border bg-surface p-4">
        <p className="text-sm text-foreground">
          Sua conta já tem um perfil salvo. Substituir pelo perfil que está neste navegador?
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => send(true)}
            className="rounded-pill bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Substituir
          </button>
          <button
            type="button"
            onClick={() => {
              clearProfile();
              setGuest(null);
              toast.message('Mantivemos o perfil da sua conta.');
            }}
            className="rounded-pill border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
          >
            Manter o da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-surface p-4">
      <div className="flex items-center gap-3 text-sm">
        <FiUploadCloud aria-hidden className="h-5 w-5 text-accent-ink" />
        <div>
          <p className="font-medium text-foreground">
            Você tem um perfil neste navegador.
          </p>
          <p className="text-muted">Importar para sua conta?</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => send(false)}
          disabled={status === 'sending'}
          className="flex items-center gap-2 rounded-pill bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {status === 'sending' ? <FiLoader aria-hidden className="animate-spin" /> : null}
          Importar
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar"
          className="rounded-pill border border-border p-2 text-foreground hover:bg-background"
        >
          <FiX aria-hidden />
        </button>
      </div>
    </div>
  );
}
