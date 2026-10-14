import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useModalDialog } from '@/lib/client/use-modal-dialog';

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  // onClose novo a cada renderização, como os chamadores reais passam
  useModalDialog(ref, () => onClose());
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-label="teste">
      <button type="button" onClick={() => setN(n + 1)}>primeiro {n}</button>
      <input aria-label="campo" />
      <button type="button">último</button>
    </div>
  );
}

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>abrir</button>
      {open && <Dialog onClose={() => { onClose(); setOpen(false); }} />}
    </>
  );
}

describe('useModalDialog', () => {
  it('foca o painel, prende o Tab dentro, Esc fecha e o foco volta a quem abriu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const abrir = screen.getByRole('button', { name: 'abrir' });
    await user.click(abrir);

    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    await user.tab();
    expect(screen.getByRole('button', { name: /primeiro/ })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'último' })).toHaveFocus();
    await user.tab(); // volta ao primeiro, não sai do diálogo
    expect(screen.getByRole('button', { name: /primeiro/ })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'último' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(abrir).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('re-renderizar o diálogo não rouba o foco de volta', async () => {
    const user = userEvent.setup();
    render(<Harness onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'abrir' }));
    const primeiro = screen.getByRole('button', { name: /primeiro/ });
    await user.click(primeiro); // muda estado → nova renderização com onClose novo
    expect(screen.getByRole('button', { name: 'primeiro 1' })).toHaveFocus();
  });
});
