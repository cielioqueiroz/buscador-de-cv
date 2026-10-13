'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiUploadCloud, FiX, FiLoader } from 'react-icons/fi';
import {
  clearProfile,
  getFavorites,
  loadAllLetters,
  loadProfile,
} from '@/lib/store';
import { listApplications } from '@/lib/applications';
import type { CVProfile } from '@/lib/providers/types';
import type { Application } from '@/lib/application-schema';
import type { SavedLetter } from '@/lib/letter-schema';

type Status = 'idle' | 'sending' | 'conflict';

type GuestBundle = {
  profile: CVProfile | null;
  applications: Application[];
  favorites: string[];
  letters: Record<string, SavedLetter>;
};

const APPLICATIONS_KEY = 'jf_applications';
const FAV_KEY = 'jf_favorites';
const LETTERS_KEY = 'jf_letters';

function hasAnythingToImport(bundle: GuestBundle): boolean {
  return Boolean(
    bundle.profile ||
      bundle.applications.length ||
      bundle.favorites.length ||
      Object.keys(bundle.letters).length,
  );
}

function describeBundle(bundle: GuestBundle): string {
  const parts: string[] = [];
  if (bundle.profile) parts.push('perfil');
  if (bundle.applications.length) {
    parts.push(`${bundle.applications.length} candidatura${bundle.applications.length === 1 ? '' : 's'}`);
  }
  if (bundle.favorites.length) {
    parts.push(`${bundle.favorites.length} favorita${bundle.favorites.length === 1 ? '' : 's'}`);
  }
  const letters = Object.keys(bundle.letters).length;
  if (letters) parts.push(`${letters} carta${letters === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

type Props = {
  /** Perfil já salvo na conta. Com ele, o perfil do navegador é só cache, não dado de convidado. */
  serverProfile?: CVProfile | null;
};

export function ImportGuestProfileBanner({ serverProfile = null }: Props) {
  const router = useRouter();
  const [bundle, setBundle] = useState<GuestBundle | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    setBundle({
      // O app logado também guarda o perfil no navegador (cache das telas de
      // vagas). Se a conta já tem perfil, oferecer "importar" esse cache seria
      // um falso alarme — e um 409 garantido.
      profile: serverProfile ? null : loadProfile(),
      applications: listApplications(),
      favorites: getFavorites(),
      letters: loadAllLetters(),
    });
  }, [serverProfile]);

  if (!bundle || !hasAnythingToImport(bundle)) return null;

  async function send(force: boolean) {
    if (!bundle) return;
    setStatus('sending');
    try {
      const url = `/api/sync/import${force ? '?force=true' : ''}`;
      const payload = {
        profile: bundle.profile ?? undefined,
        applications: bundle.applications.length ? bundle.applications : undefined,
        favorites: bundle.favorites.length ? bundle.favorites : undefined,
        letters: Object.keys(bundle.letters).length ? bundle.letters : undefined,
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
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
      try {
        localStorage.removeItem(APPLICATIONS_KEY);
        localStorage.removeItem(FAV_KEY);
        localStorage.removeItem(LETTERS_KEY);
      } catch { /* storage indisponível */ }
      setBundle(null);
      toast.success('Dados importados para a sua conta.');
      router.refresh();
    } catch {
      toast.error('Falha de rede. Tente de novo.');
      setStatus('idle');
    }
  }

  function dismiss() {
    setBundle(null);
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
              setBundle(null);
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
            Você tem dados neste navegador.
          </p>
          <p className="text-muted">
            {describeBundle(bundle)}. Importar para sua conta?
          </p>
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
