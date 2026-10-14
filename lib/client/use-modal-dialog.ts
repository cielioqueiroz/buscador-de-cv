'use client';
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Options = {
  /** Para modais que montam fechados (ex.: o de cadastro). Padrão: ativo. */
  active?: boolean;
  /** Onde o foco entra: no próprio painel (leitura) ou no primeiro campo (formulário). */
  initialFocus?: 'panel' | 'first-field';
};

/**
 * O comportamento de diálogo modal, num lugar só (carta, CV adaptado, cadastro):
 * foco entra no painel e volta para quem abriu; Esc fecha; Tab e Shift+Tab
 * circulam só dentro dele; a página de trás não rola.
 *
 * `onClose` vai numa ref: quem chama costuma passar uma função nova a cada
 * renderização, e com ela nas dependências o efeito remontava — devolvendo o
 * foco ao botão de abrir no meio da digitação.
 */
export function useModalDialog(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  { active = true, initialFocus = 'panel' }: Options = {},
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const panel = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (initialFocus === 'first-field') panel?.querySelector<HTMLElement>('input, button')?.focus();
    else panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [active, initialFocus, ref]);
}
