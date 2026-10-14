'use client';
import { useState } from 'react';
import { FiLoader, FiMail } from 'react-icons/fi';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'sent'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('busy');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Independentemente do resultado, mostramos a mesma mensagem — a rota
      // já é agnóstica para não vazar quais e-mails existem.
      setStatus('sent');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-pill bg-background px-4 py-3 text-sm text-foreground">
        <p className="flex items-center gap-2">
          <FiMail aria-hidden /> Se existir uma conta com esse e-mail, mandamos um link para redefinir a senha. O link vale por 30 minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-pill border border-border bg-background px-4 py-2 field outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'busy'}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'busy' ? <FiLoader aria-hidden className="animate-spin" /> : null}
        Enviar link de redefinição
      </button>
    </form>
  );
}
