'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { FiEyeOff } from 'react-icons/fi';
import { DISMISS_REASON_LABELS, DismissReasonEnum, type DismissReason } from '@/lib/dismiss-reasons';

/**
 * "Não tenho interesse" com o motivo. Um clique abre a lista; escolher um
 * motivo descarta. Esc ou clique fora fecha sem fazer nada.
 */
export function DismissButton({ jobTitle, onDismiss }: { jobTitle: string; onDismiss: (reason: DismissReason) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Não tenho interesse em ${jobTitle}`}
        aria-expanded={open}
        aria-controls={menuId}
        title="Não tenho interesse"
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
      >
        <FiEyeOff className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="group"
          aria-label="Por que esta vaga não interessa?"
          className="absolute bottom-12 right-0 z-20 w-64 rounded-card border border-border bg-surface p-2 shadow-float"
        >
          <p className="px-3 pb-1 pt-1 text-xs text-muted">Por que não interessa? Ela sai da lista.</p>
          {DismissReasonEnum.options.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => {
                setOpen(false);
                onDismiss(reason);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
            >
              {DISMISS_REASON_LABELS[reason]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
