import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DismissButton } from '@/components/DismissButton';

describe('DismissButton', () => {
  it('abre os motivos e descarta com o escolhido', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<DismissButton jobTitle="Dev React" onDismiss={onDismiss} />);

    const trigger = screen.getByRole('button', { name: 'Não tenho interesse em Dev React' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Salário baixo' }));
    expect(onDismiss).toHaveBeenCalledWith('salario');
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('Esc fecha sem descartar', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<DismissButton jobTitle="Dev" onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: /Não tenho interesse/ }));
    expect(screen.getByRole('group')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group')).toBeNull();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
