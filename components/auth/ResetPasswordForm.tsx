'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');

  if (!token) {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-pill bg-background px-3 py-2 text-sm text-foreground">
        <FiAlertCircle aria-hidden /> Link inválido. Peça um novo em “Esqueci minha senha”.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('busy');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Não foi possível redefinir.');
        setStatus('idle');
        return;
      }
      setStatus('done');
      setTimeout(() => router.push('/entrar'), 1_200);
    } catch {
      setError('Falha de rede. Tente de novo.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <p className="flex items-center gap-2 rounded-pill bg-background px-3 py-2 text-sm text-foreground">
        <FiCheck aria-hidden /> Senha trocada. Já pode entrar.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Nova senha</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-pill border border-border bg-background px-4 py-2 field outline-none"
        />
        <span className="mt-1 block text-xs text-muted">
          Mínimo 8 caracteres, com letra e número.
        </span>
      </label>
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-pill bg-background px-3 py-2 text-sm text-foreground">
          <FiAlertCircle aria-hidden /> {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'busy'}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'busy' ? <FiLoader aria-hidden className="animate-spin" /> : null}
        Trocar senha
      </button>
    </form>
  );
}
