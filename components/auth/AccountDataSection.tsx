'use client';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { FiAlertCircle, FiDownload, FiLoader, FiTrash2 } from 'react-icons/fi';
import { clearLocalUserData } from '@/lib/store';

type Props = {
  email: string;
  /** Conta com senha pede a senha para excluir; conta só Google, não. */
  hasPassword: boolean;
};

export function AccountDataSection({ email, hasPassword }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (confirming) emailRef.current?.focus();
  }, [confirming]);

  const emailMatches = typedEmail.trim().toLowerCase() === email.toLowerCase();
  const canSubmit = emailMatches && (!hasPassword || password.length > 0) && !busy;

  function cancel() {
    setConfirming(false);
    setTypedEmail('');
    setPassword('');
    setError(null);
  }

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/perfil/conta', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmEmail: typedEmail, password: hasPassword ? password : undefined }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? 'Não deu para excluir a conta. Tente de novo.');
        setBusy(false);
        return;
      }
      clearLocalUserData();
      await signOut({ callbackUrl: '/' });
    } catch {
      setError('Sem conexão. Tente de novo.');
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="seus-dados-titulo" className="rounded-panel border border-border bg-surface p-6 sm:p-8">
      <h2 id="seus-dados-titulo" className="font-display text-lg font-bold">Seus dados</h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Baixe um arquivo com tudo que a sua conta guarda: perfil, currículo, candidaturas, favoritos, cartas e foto.
        </p>
        <a
          href="/api/perfil/exportar"
          download
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-pill border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background sm:self-auto"
        >
          <FiDownload aria-hidden /> Baixar meus dados
        </a>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="font-semibold text-warn">Excluir conta</h3>
        <p className="mt-1 text-sm text-muted">
          Apaga para sempre o perfil, o currículo, as candidaturas, os favoritos, as cartas, os CVs adaptados e a foto.
          Não dá para desfazer.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-pill border border-warn/60 px-4 py-2 text-sm font-medium text-warn transition-colors hover:bg-warn/10"
          >
            <FiTrash2 aria-hidden /> Excluir minha conta
          </button>
        ) : (
          <form onSubmit={onDelete} className="mt-4 space-y-4 rounded-card border border-warn/40 bg-background p-4">
            <label className="block text-sm">
              <span className="mb-1 block">
                Para confirmar, digite <strong className="break-all">{email}</strong>
              </span>
              <input
                ref={emailRef}
                type="email"
                autoComplete="off"
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                className="w-full rounded-pill border border-border bg-surface px-4 py-2 field outline-none"
              />
            </label>
            {hasPassword ? (
              <label className="block text-sm">
                <span className="mb-1 block">Sua senha</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-pill border border-border bg-surface px-4 py-2 field outline-none"
                />
              </label>
            ) : null}

            {error ? (
              <p role="alert" className="flex items-center gap-2 text-sm text-foreground">
                <FiAlertCircle aria-hidden className="text-warn" /> {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-pill bg-warn px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <FiLoader aria-hidden className="animate-spin" /> : <FiTrash2 aria-hidden />}
                Excluir para sempre
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="rounded-pill px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
