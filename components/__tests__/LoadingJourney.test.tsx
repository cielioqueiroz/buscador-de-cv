import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingJourney } from '@/components/LoadingJourney';

describe('LoadingJourney', () => {
  it('anuncia a etapa atual para leitores de tela', () => {
    render(<LoadingJourney stage="searching" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Buscando vagas');
  });

  it('mostra em que ponto da jornada o usuário está', () => {
    render(<LoadingJourney stage="scoring" />);
    expect(screen.getByText(/etapa 4 de 4/i)).toBeInTheDocument();
  });

  /**
   * O ponto da tela toda: nunca parecer travada. Mesmo sem animação (o CSS
   * zera tudo em prefers-reduced-motion), tem de haver texto dizendo o que
   * está acontecendo agora.
   */
  it('sempre diz o que está acontecendo, mesmo sem animação', () => {
    render(<LoadingJourney stage="reading" />);
    expect(screen.getByText('Lendo seu currículo')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toMatch(/\S{20,}/);
  });
});
