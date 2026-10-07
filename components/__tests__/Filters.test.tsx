import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filters } from '@/components/Filters';
import { DEFAULT_FILTERS } from '@/lib/filters';

beforeEach(() => {
  localStorage.clear();
});

describe('Filters', () => {
  it('mostra a contagem de resultados', () => {
    render(<Filters value={DEFAULT_FILTERS} onChange={() => {}} count={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('o toggle "só favoritas" alterna o filtro e exibe quantas há', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Filters value={DEFAULT_FILTERS} onChange={onChange} count={3} favCount={5} />,
    );

    const toggle = screen.getByRole('button', { name: /só favoritas/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveTextContent('5');

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, favorite: true });
  });

  it('escolher uma modalidade propaga a mudança', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters value={DEFAULT_FILTERS} onChange={onChange} count={3} />);

    await user.click(screen.getByRole('button', { name: /^remota$/i }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, modality: 'remote' });
  });

  it('a re-busca regional só habilita após mudar algo e envia os opts certos', async () => {
    const user = userEvent.setup();
    const onRegionSearch = vi.fn();
    render(
      <Filters
        value={DEFAULT_FILTERS}
        onChange={() => {}}
        count={3}
        onRegionSearch={onRegionSearch}
      />,
    );

    // Sem mudança de escopo, o botão nasce desabilitado (nada a re-buscar).
    const botao = screen.getByRole('button', { name: /buscar nessa região/i });
    expect(botao).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /^brasil$/i }));
    await user.selectOptions(screen.getByLabelText('Estado'), 'SP');
    expect(botao).toBeEnabled();

    await user.click(botao);
    expect(onRegionSearch).toHaveBeenCalledWith({ country: 'br', location: 'SP' });
  });

  it('lembra a última região ao remontar (não reabre em "qualquer lugar")', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Filters value={DEFAULT_FILTERS} onChange={() => {}} count={3} onRegionSearch={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /^brasil$/i }));
    await user.selectOptions(screen.getByLabelText('Estado'), 'SP');
    await user.click(screen.getByRole('button', { name: /buscar nessa região/i }));
    unmount();

    render(
      <Filters value={DEFAULT_FILTERS} onChange={() => {}} count={3} onRegionSearch={vi.fn()} />,
    );
    // O efeito de restauração reabre no Brasil, com SP selecionado e o botão
    // desabilitado (aquele ranking já está em cache).
    await waitFor(() =>
      expect(screen.getByLabelText('Estado')).toHaveValue('SP'),
    );
    expect(screen.getByRole('button', { name: /buscar nessa região/i })).toBeDisabled();
  });
});
