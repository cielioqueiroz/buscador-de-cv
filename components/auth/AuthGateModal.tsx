'use client';
import { Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { SignupForm } from '@/components/auth/SignupForm';

type Props = {
  open: boolean;
  onClose: () => void;
  googleEnabled: boolean;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Convite para criar conta quando o visitante tenta usar o app. É só a porta:
 * as rotas de IA recusam quem não está logado de qualquer jeito.
 */
export function AuthGateModal({ open, onClose, googleEnabled }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('input, button')?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      // Mantém o Tab dentro do modal enquanto ele está aberto.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal no <body>: a landing anima seus blocos com transform, e um ancestral
  // com transform prende o `position: fixed` dentro dele.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-[fade-in_200ms_ease-out_both]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        aria-describedby="auth-gate-desc"
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-panel border border-border bg-surface p-6 shadow-float sm:rounded-panel sm:p-8 animate-[rise_260ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <FiX aria-hidden />
        </button>

        <p className="font-mono text-[11px] uppercase tracking-widest text-accent-ink">Grátis · 30 segundos</p>
        <h2 id="auth-gate-title" className="mt-2 pr-8 font-display text-2xl font-extrabold tracking-tight">
          Crie sua conta para analisar seu currículo
        </h2>
        <p id="auth-gate-desc" className="mt-2 text-sm text-muted">
          Seu perfil, as vagas pontuadas, as cartas e o tracker ficam salvos na conta — em qualquer aparelho.
        </p>

        <div className="mt-6">
          <Suspense fallback={null}>
            <SignupForm googleEnabled={googleEnabled} />
          </Suspense>
        </div>

        <p className="mt-6 text-sm text-muted">
          Já tem conta?{' '}
          <Link href="/entrar" className="font-medium text-accent-ink underline-offset-2 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>,
    document.body,
  );
}
