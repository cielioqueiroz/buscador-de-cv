'use client';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiAlertCircle, FiCheck, FiLoader, FiTrash2, FiUpload } from 'react-icons/fi';
import { Avatar } from '@/components/auth/Avatar';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

type Props = {
  initialName: string | null;
  email: string;
  initialImage: string | null;
};

type Feedback = { kind: 'ok' | 'error'; text: string } | null;

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return typeof json?.error === 'string' ? json.error : fallback;
}

export function AccountSettings({ initialName, email, initialImage }: Props) {
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(initialName ?? '');
  const [savedName, setSavedName] = useState(initialName ?? '');
  const [image, setImage] = useState(initialImage);
  const [busy, setBusy] = useState<'name' | 'upload' | 'remove' | null>(null);
  const [nameFeedback, setNameFeedback] = useState<Feedback>(null);
  const [photoFeedback, setPhotoFeedback] = useState<Feedback>(null);

  const ownPhoto = image?.startsWith('/api/perfil/avatar') ?? false;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoFeedback(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhotoFeedback({ kind: 'error', text: 'Imagem muito grande (máx. 2MB).' });
      return;
    }

    setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/perfil/avatar', { method: 'POST', body: form });
      if (!res.ok) {
        setPhotoFeedback({ kind: 'error', text: await errorFrom(res, 'Falha ao enviar a foto.') });
        return;
      }
      const json = (await res.json()) as { image: string };
      setImage(json.image);
      await update();
      setPhotoFeedback({ kind: 'ok', text: 'Foto atualizada.' });
    } catch {
      setPhotoFeedback({ kind: 'error', text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(null);
    }
  }

  async function onRemovePhoto() {
    setPhotoFeedback(null);
    setBusy('remove');
    try {
      const res = await fetch('/api/perfil/avatar', { method: 'DELETE' });
      if (!res.ok) {
        setPhotoFeedback({ kind: 'error', text: await errorFrom(res, 'Falha ao remover a foto.') });
        return;
      }
      setImage(null);
      await update();
      setPhotoFeedback({ kind: 'ok', text: 'Foto removida.' });
    } catch {
      setPhotoFeedback({ kind: 'error', text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(null);
    }
  }

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameFeedback(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameFeedback({ kind: 'error', text: 'Informe seu nome.' });
      return;
    }

    setBusy('name');
    try {
      const res = await fetch('/api/perfil/conta', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        setNameFeedback({ kind: 'error', text: await errorFrom(res, 'Falha ao salvar.') });
        return;
      }
      const json = (await res.json()) as { name: string };
      setName(json.name);
      setSavedName(json.name);
      await update();
      setNameFeedback({ kind: 'ok', text: 'Nome salvo.' });
    } catch {
      setNameFeedback({ kind: 'error', text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="foto-titulo" className="rounded-panel border border-border bg-surface p-6 sm:p-8">
        <h2 id="foto-titulo" className="font-display text-lg font-bold">Foto de perfil</h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={savedName} email={email} image={image} className="h-20 w-20 text-2xl" />
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                id="avatar-file"
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={onPickFile}
                disabled={busy !== null}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy !== null}
                className="flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy === 'upload' ? <FiLoader aria-hidden className="animate-spin" /> : <FiUpload aria-hidden />}
                {image ? 'Trocar foto' : 'Enviar foto'}
              </button>
              {ownPhoto ? (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  disabled={busy !== null}
                  className="flex items-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-60"
                >
                  {busy === 'remove' ? <FiLoader aria-hidden className="animate-spin" /> : <FiTrash2 aria-hidden />}
                  Remover
                </button>
              ) : null}
            </div>
            <p className="text-xs text-muted">JPG, PNG ou WebP até 2MB. Cortamos em quadrado e removemos os metadados da foto.</p>
          </div>
        </div>
        <FeedbackLine feedback={photoFeedback} />
      </section>

      <section aria-labelledby="dados-titulo" className="rounded-panel border border-border bg-surface p-6 sm:p-8">
        <h2 id="dados-titulo" className="font-display text-lg font-bold">Dados da conta</h2>
        <form onSubmit={onSaveName} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Nome</span>
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-pill border border-border bg-background px-4 py-2 field outline-none"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block text-muted">E-mail</span>
            <p className="rounded-pill border border-border bg-background px-4 py-2 text-muted">{email}</p>
            <p className="mt-1 text-xs text-muted">A troca de e-mail ainda não está disponível.</p>
          </div>
          <FeedbackLine feedback={nameFeedback} />
          <button
            type="submit"
            disabled={busy !== null || name.trim() === savedName}
            className="flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === 'name' ? <FiLoader aria-hidden className="animate-spin" /> : null}
            Salvar nome
          </button>
        </form>
      </section>
    </div>
  );
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className="mt-4 flex items-center gap-2 rounded-pill bg-background px-3 py-2 text-sm text-foreground"
    >
      {feedback.kind === 'error' ? <FiAlertCircle aria-hidden className="text-warn" /> : <FiCheck aria-hidden className="text-accent-ink" />}
      {feedback.text}
    </p>
  );
}
